import { Router } from 'express';
import { ModelService } from '../services/models.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/models - List available models
router.get('/', asyncHandler(async (req, res) => {
  const models = await ModelService.getAvailableModels();
  res.json({ models });
}));

// POST /api/models/generate - Generate text with a model
router.post('/generate', asyncHandler(async (req, res) => {
  const { model, prompt, context } = req.body;
  
  if (!model || !prompt) {
    return res.status(400).json({ error: 'Model and prompt are required' });
  }
  
  try {
    const response = await ModelService.generateWithModel(model, prompt, context);
    res.json({ response, model });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;