import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getChatResponse } from '@/lib/claude';
import { loadKnowledgeBase, searchKnowledgeBase } from '@/lib/knowledgeBase';
import { webSearch } from '@/lib/search';
import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch, buildRoleContext } from '@/lib/prompts';
import { logQuery } from '@/lib/database';

let kbLoaded = false;

export async function POST(request) {
  const startTime = Date.now();

  try {
    // Load knowledge base once
    if (!kbLoaded) {
      await loadKnowledgeBase();
      kbLoaded = true;
    }

    // Optional auth — unauthenticated users can still chat
    const user = await getUser(request);

    // Parse request body
    const { message, history, sessionId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Run KB search and web search in parallel
    const useWebSearch = shouldTriggerSearch(message);
    const [kbResults, searchResults] = await Promise.all([
      Promise.resolve(searchKnowledgeBase(message)),
      useWebSearch ? webSearch(message) : Promise.resolve(null),
    ]);

    // Build system prompt with role context
    const systemPrompt = SYSTEM_PROMPT + buildRoleContext(user?.profile);

    // Build user prompt with KB context and search results
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
