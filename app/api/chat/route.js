import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getChatResponse } from '@/lib/claude';
import { loadKnowledgeBase, searchKnowledgeBase } from '@/lib/knowledgeBase';
import { webSearch } from '@/lib/search';
import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch, buildRoleContext, isConversational } from '@/lib/prompts';
import { logQuery, getCampusMemoryContext } from '@/lib/database';
import { chatLimiter } from '@/lib/rateLimit';
import { validateChatInput } from '@/lib/validation';

export const maxDuration = 60;

let kbLoadPromise = null;

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { limited } = chatLimiter(request);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    if (!kbLoadPromise) {
      kbLoadPromise = loadKnowledgeBase();
    }

    const body = await request.json();
    const { valid, error: validationError } = validateChatInput(body);
    if (!valid) {
      return NextResponse.json({ error: validationError }, { status: 400 });
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
        getCampusMemoryContext(),
        new Promise((resolve) => setTimeout(() => resolve(''), 2000)),
      ]),
    ]);

    const dynamicContext = buildRoleContext(user?.profile) + campusContext;
    const systemPrompt = SYSTEM_PROMPT + dynamicContext;

    const userPrompt = buildUserPrompt(message, kbResults, searchResults);

    const result = await getChatResponse(systemPrompt, userPrompt, history || []);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get response' },
        { status: 500 }
      );
    }

    const sources = kbResults.map((r) => ({
      file: r.file,
      header: r.header,
      score: r.score,
      sourceUrl: r.sourceUrl,
      sourceLabel: r.sourceLabel,
    }));

    const responseTimeMs = Date.now() - startTime;

    if (user) {
      logQuery({
        userId: user.id,
        sessionId: sessionId || crypto.randomUUID(),
        message,
        response: result.response,
        sources,
        kbResultsCount: kbResults.length,
        searchUsed: useWebSearch && searchResults !== null,
        inputTokens: result.usage?.inputTokens,
        outputTokens: result.usage?.outputTokens,
        responseTimeMs,
      }).catch((err) => console.error('Failed to log query:', err));
    }

    return NextResponse.json({
      response: result.response,
      sources,
      usage: result.usage,
      responseTimeMs,
      searchUsed: useWebSearch && searchResults !== null,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
