require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

// Load PYQ models
require('./models/Course/Exam');
require('./models/Course/Subject');
require('./models/Course/PreviousQuestionPaper');

// Load Banner model
require('./models/Banner');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
