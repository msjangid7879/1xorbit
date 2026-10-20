const pool = require('../config/db');

exports.getMessages = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let query = `
      SELECT m.*, u.name as sender_name, u.username as sender_username 
      FROM messages m 
      LEFT JOIN users u ON m.sender_id = u.id
    `;
    let values = [];
    if (tenant_id) {
      query += ' WHERE m.tenant_id = $1';
      values.push(tenant_id);
    }
    query += ' ORDER BY m.id ASC';
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error('Get Messages Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { tenant_id, sender_id, receiver_id, group_id, message, file_url } = req.body;

    // Check if message is a task command: /task [Task Title]
    if (message && message.startsWith('/task ')) {
      const taskTitle = message.replace('/task ', '').trim();
      await pool.query(
        `INSERT INTO tasks (tenant_id, title, department, priority, assignee_id, created_by, status) 
     VALUES ($1, $2, 'Operations', 'Medium', $3, $4, 'Todo')`,
        [tenant_id || 1, taskTitle, receiver_id || parseInt(sender_id), parseInt(sender_id)]
        // ✅ Yahan akhiri parameter sender_id (created_by) pass ho raha hai
      );
    }

    const query = `
      INSERT INTO messages (tenant_id, sender_id, receiver_id, group_id, message, file_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *, (SELECT name FROM users WHERE id = sender_id) as sender_name;
    `;
    const values = [
      tenant_id || 1,
      sender_id,
      receiver_id ? parseInt(receiver_id) : null,
      group_id ? parseInt(group_id) : null,
      message,
      file_url || null
    ];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Send Message Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const { rows } = await pool.query('SELECT * FROM chat_groups WHERE tenant_id = $1 ORDER BY id DESC;', [tenant_id || 1]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { tenant_id, group_name, created_by, members } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO chat_groups (tenant_id, group_name, created_by, members) VALUES ($1, $2, $3, $4::jsonb) RETURNING *;',
      [tenant_id || 1, group_name, created_by, JSON.stringify(members || [])]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete Message Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;

    if (sender_id && receiver_id) {
      await pool.query(
        'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE',
        [sender_id, receiver_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Mark Read Error:', err.message);
    res.status(500).send('Server Error');
  }
};