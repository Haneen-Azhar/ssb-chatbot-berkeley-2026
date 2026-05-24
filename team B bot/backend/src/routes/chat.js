import express from 'express';
import { getChatResponse, getChatResponseStream, extractSuggestedQuestions } from '../services/claude.js';
import { searchKnowledgeBase, loadKnowledgeBase } from '../services/knowledgeBaseEnhanced.js';
import { webSearch } from '../services/search.js';
import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch } from '../utils/prompts.js';

const router = express.Router();

// Load enhanced knowledge base on server start
await loadKnowledgeBase();

// POST /api/chat - Main chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`💬 Query: "${message}"`);
    console.log(`📝 History length: ${history.length} messages`);

    // Step 1: Run KB search and web search in parallel
    const [kbResults, searchResults] = await Promise.all([
      Promise.resolve(searchKnowledgeBase(message)),
      shouldTriggerSearch(message) ? webSearch(message) : Promise.resolve(null)
    ]);

    console.log(`📚 Found ${kbResults.length} relevant KB files`);
    if (searchResults) {
      console.log(`🔍 Found ${searchResults.length} web search results`);
    }

    // Step 2: Build prompt with context including conversation history
    const userPrompt = buildUserPrompt(message, kbResults, searchResults, history);

    // Step 3: Get response from Claude
    const claudeResponse = await getChatResponse(SYSTEM_PROMPT, userPrompt, history);

    if (!claudeResponse.success) {
      throw new Error(claudeResponse.error);
    }

    // Step 5: Extract sources from KB results with URLs and labels
    const sources = kbResults.map(result => ({
      type: 'kb',
      file: result.file,
      header: result.header,
      url: result.sourceUrl,
      label: result.sourceLabel,
      confidence: result.score > 5 ? 'high' : result.score > 2 ? 'medium' : 'low'
    }));

    // Add search results as sources if used
    if (searchResults) {
      searchResults.forEach(result => {
        sources.push({
          type: 'web',
          title: result.title,
          url: result.url
        });
      });
    }

    // Step 6: Return response (removed suggested questions for speed)
    res.json({
      success: true,
      response: claudeResponse.response,
      sources: sources,
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
router.post('/stream', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`💬 Streaming query: "${message}"`);

    // Set up SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Step 1: Get KB and search results
    const [kbResults, searchResults] = await Promise.all([
      Promise.resolve(searchKnowledgeBase(message)),
      shouldTriggerSearch(message) ? webSearch(message) : Promise.resolve(null)
    ]);

    console.log(`📚 Found ${kbResults.length} relevant KB files`);

    // Send sources immediately
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
        sources.push({
          type: 'web',
          title: result.title,
          url: result.url
        });
      });
    }

    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    // Step 2: Build prompt and stream response
    const userPrompt = buildUserPrompt(message, kbResults, searchResults, history);
    const stream = await getChatResponseStream(SYSTEM_PROMPT, userPrompt, history);

    let fullResponse = '';
    let usage = null;

    // Stream text chunks as they arrive
    stream.on('text', (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    // Send final metadata when done
    stream.on('message', (message) => {
      if (message.usage) {
        usage = {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens
        };
      }
    });

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({
        type: 'done',
        usage,
        timestamp: new Date().toISOString()
      })}\n\n`);
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
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, helpful, comment } = req.body;

    // Log feedback (in production, save to database)
    console.log('📊 Feedback received:', { messageId, helpful, comment });

    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

export default router;
