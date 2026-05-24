import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const sendMessage = async (message, history = []) => {
  try {
    const response = await api.post('/api/chat', {
      message,
      history
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to send message');
  }
};

export const sendFeedback = async (messageId, helpful, comment = '') => {
  try {
    const response = await api.post('/api/chat/feedback', {
      messageId,
      helpful,
      comment
    });
    return response.data;
  } catch (error) {
    console.error('Feedback Error:', error);
    throw new Error('Failed to submit feedback');
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health Check Error:', error);
    return { status: 'error' };
  }
};
