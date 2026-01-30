require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const cron = require('node-cron'); // Import node-cron for scheduling
const { processExpiredAttempts } = require('../utils/examAutoSubmit'); // Import the CBT-compliant auto-submit function

// Load PYQ models
require('./models/Course/Exam');
require('./models/Course/Subject');
require('./models/Course/PreviousQuestionPaper');

// Load Banner model
require('./models/Banner');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB();

// Schedule the auto-submit job to run every 30 seconds (CBT requirement)
// This will automatically submit tests that have exceeded their time limit
cron.schedule('*/30 * * * * *', async () => {  // Every 30 seconds
  console.log('Running scheduled auto-submit check...');
  await processExpiredAttempts();
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Auto-submit cron job scheduled to run every 5 minutes');
  
  // Set up graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
});