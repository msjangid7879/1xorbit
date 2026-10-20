const pool = require('../config/db');

exports.getTaskComments = async (req, res) => {
  try {
    const { task_id } = req.params;
    const query = `
      SELECT c.*, u.name as user_name, u.username as user_username 
      FROM task_comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.task_id = $1 
      ORDER BY c.id ASC;
    `;
    const { rows } = await pool.query(query, [task_id]);
    res.json(rows);
  } catch (err) {
    console.error('Get Task Comments Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.addTaskComment = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { user_id, comment } = req.body;
    const query = `
      INSERT INTO task_comments (task_id, user_id, comment, is_read) 
      VALUES ($1, $2, $3, FALSE) 
      RETURNING *, (SELECT name FROM users WHERE id = user_id) as user_name, (SELECT username FROM users WHERE id = user_id) as user_username;
    `;
    const { rows } = await pool.query(query, [task_id, user_id, comment]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add Task Comment Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Mark Comments as Read when chat modal is opened
exports.markTaskCommentsRead = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { user_id } = req.body;
    
    await pool.query(
      'UPDATE task_comments SET is_read = TRUE WHERE task_id = $1 AND user_id != $2 AND is_read = FALSE',
      [task_id, user_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark Comments Read Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// Get unread comment counts for all tasks of a tenant
exports.getUnreadCounts = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const query = `
      SELECT tc.task_id, COUNT(*) as unread_count
      FROM task_comments tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE t.tenant_id = $1 AND tc.is_read = FALSE
      GROUP BY tc.task_id;
    `;
    const { rows } = await pool.query(query, [tenant_id || 1]);
    res.json(rows);
  } catch (err) {
    console.error('Get Unread Counts Error:', err.message);
    res.status(500).send('Server Error');
  }
};