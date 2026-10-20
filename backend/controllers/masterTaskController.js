const pool = require('../config/db');

exports.getMasterTasks = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let query = `
      SELECT m.*, u.name as assignee_name, u.username as assignee_username 
      FROM master_tasks m 
      LEFT JOIN users u ON m.assignee_id = u.id
    `;
    let values = [];
    if (tenant_id) {
      query += ' WHERE m.tenant_id = $1';
      values.push(tenant_id);
    }
    query += ' ORDER BY m.id DESC';
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error('Get Master Tasks Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.createMasterTask = async (req, res) => {
  try {
    const { tenant_id, title, department, frequency, assignee_id, day_date, schedule_day_date, remarks, reference_image } = req.body;
    
    const finalDayDate = schedule_day_date || day_date || 'Everyday';

    const query = `
      INSERT INTO master_tasks (tenant_id, title, department, frequency, assignee_id, schedule_day_date, remarks, reference_image, last_scheduled_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
      RETURNING *;
    `;
    const values = [
      tenant_id || 1,
      title,
      department || 'Operations',
      frequency || 'Daily',
      assignee_id ? parseInt(assignee_id) : null,
      finalDayDate,
      remarks || null,
      reference_image || null
    ];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create Master Task Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMasterTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Pehle is master task ki titles/details fetch karein taaki generated tasks delete kiye ja sakein
    const masterQuery = 'SELECT title FROM master_tasks WHERE id = $1';
    const masterResult = await pool.query(masterQuery, [id]);
    
    if (masterResult.rows.length > 0) {
      const masterTitle = masterResult.rows[0].title;
      
      // 2. Tasks table se wo sabhi tasks delete kar dein jo is master task se generate hue thay
      await pool.query('DELETE FROM tasks WHERE title = $1 AND is_master_task = true', [masterTitle]);
    }

    // 3. Ab master task ko delete karein
    await pool.query('DELETE FROM master_tasks WHERE id = $1', [id]);
    
    res.json({ message: 'Master task and its generated instances deleted successfully' });
  } catch (err) {
    console.error('Delete Master Task Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateMasterTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, assignee_id, frequency, department, day_date, schedule_day_date, remarks, reference_image } = req.body;
    
    const finalDayDate = schedule_day_date || day_date || 'Everyday';

    // 1. Pehle purana title nikal lete hain taaki tasks table me match karke update kar sakein
    const oldTaskRes = await pool.query('SELECT title FROM master_tasks WHERE id = $1', [id]);
    const oldTitle = oldTaskRes.rows.length > 0 ? oldTaskRes.rows[0].title : null;

    // 2. Master task update karein
    const query = `
      UPDATE master_tasks 
      SET title = $1, assignee_id = $2, frequency = $3, department = $4, schedule_day_date = $5, remarks = $6, reference_image = $7
      WHERE id = $8 
      RETURNING *;
    `;
    const values = [
      title, 
      assignee_id ? parseInt(assignee_id) : null, 
      frequency, 
      department, 
      finalDayDate, 
      remarks || null, 
      reference_image || null, 
      id
    ];
    const { rows } = await pool.query(query, values);
    const updatedMaster = rows[0];

    // 3. Agar master task update hua hai, toh tasks table me bhi matching tasks update kar dein
    if (oldTitle) {
      await pool.query(`
        UPDATE tasks 
        SET title = $1, department = $2, assignee_id = $3, file_url = COALESCE($4, file_url)
        WHERE title = $5 AND is_master_task = true AND status = 'Todo'
      `, [title, department, assignee_id ? parseInt(assignee_id) : null, reference_image, oldTitle]);
    }

    res.json(updatedMaster);
  } catch (err) {
    console.error('Update Master Task Error:', err.message);
    res.status(500).send('Server Error');
  }
};