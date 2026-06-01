const MAX_MESSAGE_LENGTH = 5000;
const MAX_HISTORY_LENGTH = 30;
const MAX_HISTORY_ITEM_LENGTH = 10000;

export function validateChatInput(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { message, history } = body;

  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` };
  }

  if (history && !Array.isArray(history)) {
    return { valid: false, error: 'History must be an array' };
  }

  if (history && history.length > MAX_HISTORY_LENGTH) {
    return { valid: false, error: `History too long (max ${MAX_HISTORY_LENGTH} messages)` };
  }

  if (history) {
    for (const item of history) {
      if (typeof item.content === 'string' && item.content.length > MAX_HISTORY_ITEM_LENGTH) {
        return { valid: false, error: 'History item too long' };
      }
    }
  }

  return { valid: true };
}

export { MAX_MESSAGE_LENGTH, MAX_HISTORY_LENGTH };
