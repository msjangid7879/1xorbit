const pool = require('../config/db');

exports.getTasks = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let query = `
      SELECT t.*, u.name as assignee_name, u.username as assignee_username,
      creator.name as created_by_name, creator.username as created_by_username
      FROM tasks t 
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
    `;
    let values = [];
    if (tenant_id) {
      query += ' WHERE t.tenant_id = $1';
      values.push(tenant_id);
    }
    query += ' ORDER BY t.id DESC';
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error('Get Tasks Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.createTask = async (req, res) => {
  try {
    const { tenant_id, title, department, priority, assignee_id, created_by, file_url, status, is_master_task } = req.body;
    
    // Agar yeh master task hai, toh check karein ki aaj ke din yeh task pehle se generated toh nahi hai
    if (is_master_task) {
      const todayStr = new Date().toISOString().split('T')[0];
      const checkDuplicate = await pool.query(
        `SELECT id FROM tasks WHERE title = $1 AND is_master_task = true AND created_at::text LIKE $2`,
        [title, `${todayStr}%`]
      );
      
      if (checkDuplicate.rows.length > 0) {
        return res.status(200).json({ message: 'Task already generated for today', skipped: true });
      }
    }

    const query = `
      INSERT INTO tasks (tenant_id, title, department, priority, assignee_id, created_by, file_url, status, is_master_task)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      tenant_id || 1,
      title,
      department || 'Operations',
      priority || 'Urgent',
      assignee_id ? parseInt(assignee_id) : null,
      created_by ? parseInt(created_by) : null,
      file_url || null,
      status || 'Todo',
      is_master_task || false
    ];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create Task Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const query = 'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *;';
    const { rows } = await pool.query(query, [status, id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update Task Status Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateTaskAssignee = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignee_id } = req.body;
    const query = 'UPDATE tasks SET assignee_id = $1 WHERE id = $2 RETURNING *;';
    const { rows } = await pool.query(query, [assignee_id ? parseInt(assignee_id) : null, id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update Task Assignee Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, priority, assignee_id, file_url, status } = req.body;
    const query = `
      UPDATE tasks 
      SET title = $1, department = $2, priority = $3, assignee_id = $4, file_url = $5, status = $6
      WHERE id = $7 
      RETURNING *;
    `;
    const values = [title, department, priority, assignee_id ? parseInt(assignee_id) : null, file_url, status, id];
    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update Task Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete Task Error:', err.message);
    res.status(500).send('Server Error');
  }
};  

