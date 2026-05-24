import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function getChatResponse(systemPrompt, userPrompt, history = []) {
  try {
    // Build messages array
    const messages = [...history];

    // Add current user message
    messages.push({
      role: 'user',
      content: userPrompt
    });

    // Call Claude API with prompt caching for speed
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192, // Increased for more thorough, comprehensive responses
      temperature: 0.7,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: messages
    });

    // Extract text response
    const textContent = response.content.find(c => c.type === 'text');

    return {
      success: true,
      response: textContent?.text || 'I apologize, I couldn\'t generate a response.',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get response from Claude'
    };
  }
}

// Streaming version for real-time responses
export async function getChatResponseStream(systemPrompt, userPrompt, history = []) {
  try {
    // Build messages array
    const messages = [...history];

    // Add current user message
    messages.push({
      role: 'user',
      content: userPrompt
    });

    // Call Claude API with streaming enabled
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.7,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: messages
    });

    return stream;
  } catch (error) {
    console.error('Claude API Streaming Error:', error);
    throw error;
  }
}

export async function extractSuggestedQuestions(conversationContext) {
  try {
    const prompt = `Based on this conversation, suggest 3 brief follow-up questions the user might ask. Return only the questions, one per line, without numbers or bullets.

Conversation:
${conversationContext}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250617',
      max_tokens: 200,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    const questions = textContent?.text.split('\n').filter(q => q.trim()).slice(0, 3);

    return questions || [];
  } catch (error) {
    console.error('Error extracting suggested questions:', error);
    return [];
  }
}
