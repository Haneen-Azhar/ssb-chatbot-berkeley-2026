import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8765',
    'http://localhost:8000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorId: Date.now().toString(36)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SSB Chatbot Backend running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});
