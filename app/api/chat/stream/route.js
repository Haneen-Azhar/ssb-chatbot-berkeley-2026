import { getUser } from '@/lib/auth';
import { loadKnowledgeBase, searchKnowledgeBase } from '@/lib/knowledgeBase';
import { webSearch } from '@/lib/search';
import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch, buildRoleContext, isConversational } from '@/lib/prompts';
import { logQuery, getCampusMemoryContext } from '@/lib/database';
import { chatLimiter } from '@/lib/rateLimit';
import { validateChatInput } from '@/lib/validation';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

let kbLoadPromise = null;

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { limited } = chatLimiter(request);
    if (limited) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!kbLoadPromise) {
      kbLoadPromise = loadKnowledgeBase();
    }

    const body = await request.json();
    const { valid, error: validationError } = validateChatInput(body);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, history, sessionId } = body;

    const casual = isConversational(message);
    const useWebSearch = !casual && shouldTriggerSearch(message);

    const [, user, kbResults, searchResults, campusContext] = await Promise.all([
      kbLoadPromise,
      getUser(request),
      casual ? Promise.resolve([]) : kbLoadPromise.then(() => searchKnowledgeBase(message)),
      useWebSearch ? webSearch(message) : Promise.resolve(null),
      casual ? Promise.resolve('') : Promise.race([
        getCampusMemoryContext(message),
        new Promise((resolve) => setTimeout(() => resolve(''), 2000)),
      ]),
    ]);

    const dynamicContext = buildRoleContext(user?.profile) + campusContext;
    const userPrompt = buildUserPrompt(message, kbResults, searchResults);

    const sources = kbResults.map((r) => ({
      file: r.file,
      header: r.header,
      score: r.score,
      sourceUrl: r.sourceUrl,
      sourceLabel: r.sourceLabel,
    }));

    const messages = [...(history || [])];
    messages.push({ role: 'user', content: userPrompt });

    const maxTokens = casual ? 512 : 2048;

    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
          );

          const systemBlocks = [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ];
          if (dynamicContext) {
            systemBlocks.push({ type: 'text', text: dynamicContext });
          }

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: maxTokens,
            temperature: 0.3,
            stream: true,
            system: systemBlocks,
            messages,
          });

          let inputTokens = 0;
          let outputTokens = 0;

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
              );
            } else if (event.type === 'message_delta' && event.usage) {
              outputTokens = event.usage.output_tokens || 0;
            } else if (event.type === 'message_start' && event.message?.usage) {
              inputTokens = event.message.usage.input_tokens || 0;
            }
          }

          const usage = { inputTokens, outputTokens };
          const responseTimeMs = Date.now() - startTime;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', usage, responseTimeMs })}\n\n`)
          );

          controller.close();

          if (user) {
            logQuery({
              userId: user.id,
              sessionId: sessionId || crypto.randomUUID(),
              message,
              response: fullResponse,
              sources,
              kbResultsCount: kbResults.length,
              searchUsed: useWebSearch && searchResults !== null,
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              responseTimeMs,
            }).catch((err) => console.error('Failed to log query:', err));
          }
        } catch (error) {
          console.error('Stream error:', error);
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', error: error.message || 'Stream interrupted' })}\n\n`
              )
            );
            controller.close();
          } catch {
            // controller already closed
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
