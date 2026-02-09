require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const dynamicCronManager = require('../utils/dynamicCronManager'); // Import dynamic cron manager

// Load PYQ models
require('./models/Course/Exam');
require('./models/Course/Subject');
require('./models/Course/PreviousQuestionPaper');

// Load Banner model
require('./models/Banner');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB();

// Initialize the dynamic cron manager to handle auto-submit jobs
// The job will start when users begin tests and stop when all tests are completed
dynamicCronManager.initializeFromDatabase();

console.log('Dynamic cron manager initialized');

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