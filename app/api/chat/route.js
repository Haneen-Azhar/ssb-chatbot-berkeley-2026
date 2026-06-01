import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getChatResponse } from '@/lib/claude';
import { loadKnowledgeBase, searchKnowledgeBase } from '@/lib/knowledgeBase';
import { webSearch } from '@/lib/search';
import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch, buildRoleContext } from '@/lib/prompts';
import { logQuery, getCampusMemoryContext } from '@/lib/database';
import { chatLimiter } from '@/lib/rateLimit';
import { validateChatInput } from '@/lib/validation';

let kbLoaded = false;

export async function POST(request) {
  const startTime = Date.now();

  try {
    // Rate limit
    const { limited } = chatLimiter(request);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    // Load knowledge base once
    if (!kbLoaded) {
      await loadKnowledgeBase();
      kbLoaded = true;
    }

    // Optional auth
    const user = await getUser(request);

    // Parse and validate
    const body = await request.json();
    const { valid, error: validationError } = validateChatInput(body);
    if (!valid) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { message, history, sessionId } = body;

    // Run KB search and web search in parallel
    const useWebSearch = shouldTriggerSearch(message);
    const [kbResults, searchResults] = await Promise.all([
      Promise.resolve(searchKnowledgeBase(message)),
      useWebSearch ? webSearch(message) : Promise.resolve(null),
    ]);

    // Build system prompt with role context and campus memory
    const campusContext = await getCampusMemoryContext();
    const systemPrompt = SYSTEM_PROMPT + buildRoleContext(user?.profile) + campusContext;

    const userPrompt = buildUserPrompt(message, kbResults, searchResults, history);

    // Get Claude response
    const result = await getChatResponse(systemPrompt, userPrompt, history || []);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get response' },
        { status: 500 }
      );
    }

    // Build sources array from KB results
    const sources = kbResults.map((r) => ({
      file: r.file,
      header: r.header,
      score: r.score,
      sourceUrl: r.sourceUrl,
      sourceLabel: r.sourceLabel,
    }));

    const responseTimeMs = Date.now() - startTime;

    // Log query async if user exists — don't block the response
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
