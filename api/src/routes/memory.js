import { Router } from 'express';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { asyncHandler } from '../middleware/errorHandler.js';

const MEMORY_DIR = '/home/paul/.openclaw/workspace/memory';

const router = Router();

// GET /api/memory - List all memory entries
router.get('/', asyncHandler(async (req, res) => {
  try {
    const files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
    const entries = [];

    for (const file of files.sort().reverse()) {
      const filePath = join(MEMORY_DIR, file);
      const stats = statSync(filePath);
      const content = readFileSync(filePath, 'utf-8');
      
      // Parse date from filename (YYYY-MM-DD.md)
      const date = file.replace('.md', '');
      
      entries.push({
        id: date,
        date: date,
        time: stats.mtime.toISOString(),
        content: content.slice(0, 5000), // Limit content size
        fullContent: content,
        size: stats.size
      });
    }

    res.json({ entries, count: entries.length });
  } catch (error) {
    res.json({ entries: [], count: 0, error: error.message });
  }
}));

// GET /api/memory/:date - Get specific memory entry
router.get('/:date', asyncHandler(async (req, res) => {
  try {
    const filePath = join(MEMORY_DIR, `${req.params.date}.md`);
    const content = readFileSync(filePath, 'utf-8');
    const stats = statSync(filePath);

    res.json({
      id: req.params.date,
      date: req.params.date,
      time: stats.mtime.toISOString(),
      content
    });
  } catch (error) {
    res.status(404).json({ error: 'Memory entry not found' });
  }
}));

export default router;