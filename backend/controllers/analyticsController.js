const pool = require('../config/db');

// Get Dashboard Summary & Scorecard data
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const totalTasks = await pool.query('SELECT COUNT(*) FROM tasks');
    const statusCounts = await pool.query('SELECT status, COUNT(*) FROM tasks GROUP BY status');
    const deptCounts = await pool.query('SELECT department, COUNT(*) FROM tasks GROUP BY department');
    const priorityCounts = await pool.query('SELECT priority, COUNT(*) FROM tasks GROUP BY priority');

    res.json({
      total: parseInt(totalTasks.rows[0].count),
      statusBreakdown: statusCounts.rows,
      departmentBreakdown: deptCounts.rows,
      priorityBreakdown: priorityCounts.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};