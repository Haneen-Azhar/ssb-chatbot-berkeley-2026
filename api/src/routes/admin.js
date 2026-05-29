import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getAdminOverview, getAdminQueries, getAdminUsers, getAdminTopics } from '../services/database.js';

const router = express.Router();

router.use(requireAdmin);

// GET /api/admin/ - Overview stats
router.get('/', async (req, res) => {
  try {
    const overview = await getAdminOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overview' });
  }
});

// GET /api/admin/queries - Paginated query list
router.get('/queries', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const { user_id, role } = req.query;

    const result = await getAdminQueries({ page, pageSize, userId: user_id, role });
    res.json({ success: true, data: result.data, total: result.count, page, pageSize });
  } catch (error) {
    console.error('Admin queries error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch queries' });
  }
});

// GET /api/admin/users - All users with stats
router.get('/users', async (req, res) => {
  try {
    const users = await getAdminUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET /api/admin/topics - Topic frequency
router.get('/topics', async (req, res) => {
  try {
    const topics = await getAdminTopics();
    res.json({ success: true, data: topics });
  } catch (error) {
    console.error('Admin topics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topics' });
  }
});

export default router;
