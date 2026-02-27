const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../db');

// GET /tasks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks
router.post('/',
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
        [title, description]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /tasks/:id
router.put('/:id',
  param('id').isInt(),
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('completed').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { title, description, completed } = req.body;
    try {
      const result = await pool.query(
        `UPDATE tasks SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          completed = COALESCE($3, completed),
          updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [title, description, completed, id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /tasks/:id
router.delete('/:id',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
      res.json({ message: 'Task deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
