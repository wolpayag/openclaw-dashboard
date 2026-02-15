import { Router } from 'express';
import { ApiKeyRepository } from '../models/apiKeys.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/settings/api-keys - List all API keys (without sensitive values)
router.get('/api-keys', asyncHandler(async (req, res) => {
  const keys = await ApiKeyRepository.findAll();
  // Mask the actual key values
  const maskedKeys = keys.map(key => ({
    ...key,
    key_value: key.key_value ? '••••' + key.key_value.slice(-4) : null
  }));
  res.json({ keys: maskedKeys });
}));

// POST /api/settings/api-keys - Create new API key
router.post('/api-keys', asyncHandler(async (req, res) => {
  const { name, provider, keyValue, isDefault } = req.body;
  
  if (!name || !provider || !keyValue) {
    return res.status(400).json({ error: 'Name, provider, and keyValue are required' });
  }

  const key = await ApiKeyRepository.create({
    name,
    provider,
    keyValue,
    isDefault: isDefault || false
  });

  res.status(201).json({
    ...key,
    key_value: '••••' + key.key_value.slice(-4)
  });
}));

// DELETE /api/settings/api-keys/:id - Delete API key
router.delete('/api-keys/:id', asyncHandler(async (req, res) => {
  await ApiKeyRepository.delete(req.params.id);
  res.json({ deleted: true });
}));

// PATCH /api/settings/api-keys/:id - Update API key
router.patch('/api-keys/:id', asyncHandler(async (req, res) => {
  const key = await ApiKeyRepository.update(req.params.id, req.body);
  res.json({
    ...key,
    key_value: key.key_value ? '••••' + key.key_value.slice(-4) : null
  });
}));

export default router;