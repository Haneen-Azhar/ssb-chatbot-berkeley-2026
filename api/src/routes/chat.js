import express from 'express';
import { getChatResponse, getChatResponseStream } from '../services/claude.js';
import { searchKnowledgeBase, loadKnowledgeBase } from '../services/knowledgeBaseEnhanced.js';
import { webSearch } from '../services/search.js';
import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch, buildRoleContext } from '../utils/prompts.js';
import { optionalAuth } from '../middleware/auth.js';
import { logQuery, getProfile, updateProfile } from '../services/database.js';

const router = express.Router();

await loadKnowledgeBase();

function buildSources(kbResults, searchResults) {
  const sources = kbResults.map(result => ({
    type: 'kb',
    file: result.file,
    header: result.header,
    url: result.sourceUrl,
    label: result.sourceLabel,
    confidence: result.score > 5 ? 'high' : result.score > 2 ? 'medium' : 'low'
  }));

  if (searchResults) {
    searchResults.forEach(result => {
      sources.push({ type: 'web', title: result.title, url: result.url });
    });
  }

  return sources;
}

// GET /api/chat/profile - Get current user's profile
router.get('/profile', optionalAuth, async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const profile = req.user.profile || await getProfile(req.user.id);
  res.json({ success: true, profile });
});

// PUT /api/chat/profile - Update current user's profile
router.put('/profile', optionalAuth, async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const { name, role, bot_name } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (bot_name !== undefined) updates.bot_name = bot_name;

  const profile = await updateProfile(req.user.id, updates);
  if (!profile) {
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
  res.json({ success: true, profile });
});

// POST /api/chat - Main chat endpoint
router.post('/', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, history = [], sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const userName = req.user?.profile?.name || 'staff';
    console.log(`💬 Query from ${userName}: "${message}"`);

    const [kbResults, searchResults] = await Promise.all([
      Promise.resolve(searchKnowledgeBase(message)),
      shouldTriggerSearch(message) ? webSearch(message) : Promise.resolve(null)
    ]);

    const userPrompt = buildUserPrompt(message, kbResults, searchResults, history);
    const systemPrompt = SYSTEM_PROMPT + buildRoleContext(req.user?.profile);
    const claudeResponse = await getChatResponse(systemPrompt, userPrompt, history);

    if (!claudeResponse.success) {
      throw new Error(claudeResponse.error);
    }

    const sources = buildSources(kbResults, searchResults);
    const responseTimeMs = Date.now() - startTime;

    // Log query async (don't await — never block the response)
    if (req.user?.id) {
      logQuery({
        userId: req.user.id,
        sessionId: sessionId || crypto.randomUUID(),
        message,
        response: claudeResponse.response,
        sources,
        kbResultsCount: kbResults.length,
        searchUsed: searchResults !== null,
        inputTokens: claudeResponse.usage?.inputTokens || 0,
        outputTokens: claudeResponse.usage?.outputTokens || 0,
        responseTimeMs
      }).catch(err => console.error('Query log error:', err));
    }

    res.json({
      success: true,
      response: claudeResponse.response,
      sources,
      searchUsed: searchResults !== null,
      suggestions: [],
      usage: claudeResponse.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      errorId: Date.now().toString(36)
    });
  }
});

// POST /api/chat/stream - Streaming chat endpoint
router.post('/stream', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, history = [], sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const userName = req.user?.profile?.name || 'staff';
    console.log(`💬 Streaming query from ${userName}: "${message}"`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const [kbResults, searchResults] = await Promise.all([
      Promise.resolve(searchKnowledgeBase(message)),
      shouldTriggerSearch(message) ? webSearch(message) : Promise.resolve(null)
    ]);

    const sources = buildSources(kbResults, searchResults);
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    const userPrompt = buildUserPrompt(message, kbResults, searchResults, history);
    const systemPrompt = SYSTEM_PROMPT + buildRoleContext(req.user?.profile);
    const stream = await getChatResponseStream(systemPrompt, userPrompt, history);

    let fullResponse = '';
    let usage = null;

    stream.on('text', (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('message', (msg) => {
      if (msg.usage) {
        usage = {
          inputTokens: msg.usage.input_tokens,
          outputTokens: msg.usage.output_tokens
        };
      }
    });

    stream.on('end', () => {
      const responseTimeMs = Date.now() - startTime;

      // Log query async
      if (req.user?.id) {
        logQuery({
          userId: req.user.id,
          sessionId: sessionId || crypto.randomUUID(),
          message,
          response: fullResponse,
          sources,
          kbResultsCount: kbResults.length,
          searchUsed: searchResults !== null,
          inputTokens: usage?.inputTokens || 0,
          outputTokens: usage?.outputTokens || 0,
          responseTimeMs
        }).catch(err => console.error('Query log error:', err));
      }

      res.write(`data: ${JSON.stringify({ type: 'done', usage, timestamp: new Date().toISOString() })}\n\n`);
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Stream chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process streaming chat',
      errorId: Date.now().toString(36)
    });
  }
});

// POST /api/chat/feedback - User feedback endpoint
router.post('/feedback', optionalAuth, async (req, res) => {
  try {
    const { messageId, helpful, comment } = req.body;
    console.log('📊 Feedback received:', { messageId, helpful, comment, user: req.user?.profile?.name });
    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

export default router;
