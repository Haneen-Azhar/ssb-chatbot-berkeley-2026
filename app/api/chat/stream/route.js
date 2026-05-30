import { getUser } from '@/lib/auth';
import { getChatResponseStream } from '@/lib/claude';
import { loadKnowledgeBase, searchKnowledgeBase } from '@/lib/knowledgeBase';
import { webSearch } from '@/lib/search';
import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch, buildRoleContext } from '@/lib/prompts';
import { logQuery, getCampusMemoryContext } from '@/lib/database';

let kbLoaded = false;

export async function POST(request) {
  const startTime = Date.now();

  try {
    // Load knowledge base once
    if (!kbLoaded) {
      await loadKnowledgeBase();
      kbLoaded = true;
    }

    // Optional auth
    const user = await getUser(request);

    // Parse request body
    const { message, history, sessionId } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Run KB search and web search in parallel
    const useWebSearch = shouldTriggerSearch(message);
    const [kbResults, searchResults] = await Promise.all([
      Promise.resolve(searchKnowledgeBase(message)),
      useWebSearch ? webSearch(message) : Promise.resolve(null),
    ]);

    // Build prompts with campus memory context
    const campusContext = await getCampusMemoryContext();
    const systemPrompt = SYSTEM_PROMPT + buildRoleContext(user?.profile) + campusContext;
    const userPrompt = buildUserPrompt(message, kbResults, searchResults, history);

    // Build sources from KB results
    const sources = kbResults.map((r) => ({
      file: r.file,
      header: r.header,
      score: r.score,
      sourceUrl: r.sourceUrl,
      sourceLabel: r.sourceLabel,
    }));

    // Get streaming response from Claude
    const claudeStream = await getChatResponseStream(systemPrompt, userPrompt, history || []);

    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources event first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
          );

          // Wire up Claude stream events
          claudeStream.on('text', (text) => {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
            );
          });

          // Wait for the stream to complete
          const finalMessage = await claudeStream.finalMessage();

          const usage = {
            inputTokens: finalMessage.usage?.input_tokens,
            outputTokens: finalMessage.usage?.output_tokens,
          };

          const responseTimeMs = Date.now() - startTime;

          // Send done event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', usage, responseTimeMs })}\n\n`)
          );

          controller.close();

          // Log query async after stream ends
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
