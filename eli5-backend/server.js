require('dotenv').config();
const express = require('express');
const cors = require('cors');
const submitEmailHandler = require('./api/submit-email');

const app = express();
const port = process.env.PORT || 3003;

// Configure CORS for production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://eli5.fun', 'http://eli5.fun']  // Updated domains
        : ['http://localhost:8000', 'http://127.0.0.1:8000'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit payload size

// API endpoint
app.post('/api/submit-email', submitEmailHandler);

app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
}); 