import { Router } from 'express';
import Topic from '../models/Topic.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, level } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (level) filter.level = level;
    const topics = await Topic.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, topics });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });
    res.json({ success: true, topic });
  } catch (err) {
    next(err);
  }
});

export default router;
