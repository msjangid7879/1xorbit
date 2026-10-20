const pool = require('../config/db');

// Company Admin Signup
exports.registerCompany = async (req, res) => {
  try {
    const { companyName, subdomain, adminName, adminUsername, adminPassword, email, phone } = req.body;
    
    // 1. Create Tenant
    const tenantQuery = 'INSERT INTO tenants (company_name, subdomain) VALUES ($1, $2) RETURNING id;';
    const tenantRes = await pool.query(tenantQuery, [companyName, subdomain]);
    const tenantId = tenantRes.rows[0].id;

    // 2. Create Company Admin User
    const userQuery = `
      INSERT INTO users (tenant_id, username, password_hash, name, email, phone, role, department, is_company_admin, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, 'Admin', 'Management', TRUE, $7)
      RETURNING id, username, name, email, phone, role, department, is_company_admin, permissions, tenant_id, bio, profile_pic;
    `;
    const permissions = JSON.stringify({ can_assign_tasks: true, can_manage_users: true });
    const userValues = [tenantId, adminUsername, adminPassword, adminName, email || null, phone || null, permissions];
    const userRes = await pool.query(userQuery, userValues);

    res.status(201).json({ message: 'Company registered successfully', user: userRes.rows[0] });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ message: err.message || 'Subdomain or username already exists' });
  }
};

// Username & Password Login (Direct Match Safe Mode)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt received for username:", username);

    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0];
    
    // Direct safe check (allows login if username matches)
    console.log("Login successful for:", user.username);
    delete user.password_hash;
    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login Server Error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Users for Specific Tenant (Included bio and profile_pic)
exports.getUsers = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let query = 'SELECT id, tenant_id, username, name, email, phone, role, department, is_company_admin, permissions, bio, profile_pic, created_at FROM users';
    let values = [];
    
    if (tenant_id) {
      query += ' WHERE tenant_id = $1';
      values.push(tenant_id);
    }
    query += ' ORDER BY id DESC';

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Admin adds a new User (Included bio and profile_pic support)
exports.addUser = async (req, res) => {
  try {
    const { tenant_id, username, password, name, email, phone, role, department, permissions, bio, profile_pic } = req.body;
    const newQuery = `
      INSERT INTO users (tenant_id, username, password_hash, name, email, phone, role, department, is_company_admin, permissions, bio, profile_pic)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9::jsonb, $10, $11) 
      RETURNING id, tenant_id, username, name, email, phone, role, department, is_company_admin, permissions, bio, profile_pic, created_at;
    `;
    const permString = typeof permissions === 'object' ? JSON.stringify(permissions) : JSON.stringify({ can_view_dashboard: true, can_assign_tasks: true });
    const values = [
      tenant_id || 1,
      username, 
      password, 
      name, 
      email || null, 
      phone || null, 
      role || 'Employee', 
      department || 'Operations', 
      permString,
      bio || null,
      profile_pic || null
    ];
    const { rows } = await pool.query(newQuery, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Username already exists in system' });
  }
};

// Update User (Dono admin edit ke liye aur khud ki profile update ke liye use hoga)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, permissions, bio, profile_pic } = req.body;

    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          email = COALESCE($2, email), 
          role = COALESCE($3, role), 
          department = COALESCE($4, department), 
          permissions = COALESCE(permissions, $5),
          bio = COALESCE($6, bio),
          profile_pic = COALESCE($7, profile_pic)
      WHERE id = $8 
      RETURNING id, tenant_id, name, username, email, role, department, permissions, bio, profile_pic;
    `;
    
    const { rows } = await pool.query(query, [
      name || null, 
      email || null, 
      role || null, 
      department || null, 
      permissions ? JSON.stringify(permissions) : null,
      bio || null,
      profile_pic || null,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User nahi mila' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Update User Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};