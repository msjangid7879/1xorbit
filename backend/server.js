const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); 
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/master-tasks', require('./routes/masterTaskRoutes'));
app.use('/api/task-comments', require('./routes/taskCommentRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});