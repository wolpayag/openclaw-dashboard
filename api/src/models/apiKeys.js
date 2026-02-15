import { getDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export const ApiKeyRepository = {
  async findAll() {
    const db = getDb();
    return db.all(`
      SELECT id, name, provider, is_default, metadata, created_at, updated_at
      FROM api_keys
      ORDER BY created_at DESC
    `);
  },

  async findById(id) {
    const db = getDb();
    return db.get('SELECT * FROM api_keys WHERE id = ?', id);
  },

  async findByProvider(provider) {
    const db = getDb();
    return db.all('SELECT * FROM api_keys WHERE provider = ?', provider);
  },

  async findDefault() {
    const db = getDb();
    return db.get('SELECT * FROM api_keys WHERE is_default = 1 LIMIT 1');
  },

  async create(keyData) {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    // If this is marked as default, unset other defaults
    if (keyData.isDefault) {
      await db.run('UPDATE api_keys SET is_default = 0');
    }

    await db.run(`
      INSERT INTO api_keys (id, name, provider, key_value, is_default, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      keyData.name,
      keyData.provider,
      keyData.keyValue,
      keyData.isDefault ? 1 : 0,
      keyData.metadata ? JSON.stringify(keyData.metadata) : null,
      now,
      now
    ]);

    return this.findById(id);
  },

  async update(id, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.keyValue) {
      fields.push('key_value = ?');
      values.push(updates.keyValue);
    }

    if (updates.isDefault !== undefined) {
      if (updates.isDefault) {
        await db.run('UPDATE api_keys SET is_default = 0');
      }
      fields.push('is_default = ?');
      values.push(updates.isDefault ? 1 : 0);
    }

    if (updates.metadata) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await db.run(`UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    const db = getDb();
    await db.run('DELETE FROM api_keys WHERE id = ?', id);
    return { deleted: true };
  }
};