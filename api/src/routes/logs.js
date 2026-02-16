import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { asyncHandler } from '../middleware/errorHandler.js';

const API_LOG_FILE = '/tmp/dashboard-api.log';
const WEB_LOG_FILE = '/tmp/dashboard-web.log';

const router = Router();

// Parse log lines into structured format
function parseLogs(content, maxLines = 1000) {
  if (!content) return [];
  
  const lines = content.split('\n').filter(Boolean).slice(-maxLines);
  return lines.map(line => {
    // Try to parse timestamp and level
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+\[(\w+)\]\s*(.*)/);
    if (match) {
      return {
        timestamp: match[1],
        level: match[2].toLowerCase(),
        message: match[3] || line
      };
    }
    
    // Try alternative format
    const altMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)/);
    if (altMatch) {
      return {
        timestamp: altMatch[1],
        level: 'info',
        message: altMatch[2]
      };
    }
    
    return {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: line
    };
  });
}

// GET /api/logs - Get all logs
router.get('/', asyncHandler(async (req, res) => {
  try {
    let apiContent = '';
    let webContent = '';
    
    try {
      apiContent = readFileSync(API_LOG_FILE, 'utf-8');
    } catch (e) {
      // File doesn't exist
    }
    
    try {
      webContent = readFileSync(WEB_LOG_FILE, 'utf-8');
    } catch (e) {
      // File doesn't exist
    }

    const apiLogs = parseLogs(apiContent);
    const webLogs = parseLogs(webContent);

    res.json({
      api: apiLogs,
      web: webLogs,
      apiCount: apiLogs.length,
      webCount: webLogs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/logs/clear - Clear all logs
router.post('/clear', asyncHandler(async (req, res) => {
  try {
    writeFileSync(API_LOG_FILE, '');
    writeFileSync(WEB_LOG_FILE, '');
    res.json({ cleared: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;