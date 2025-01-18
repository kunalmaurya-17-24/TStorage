const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const path = require('path')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',  // Vite default
        'http://localhost:3000',  // Create React App default
        'http://127.0.0.1:3000'   // Alternate localhost
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(cookieParser())

// Serve uploaded files with authentication
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to Database
connectDB()

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/files', require('./routes/files'))

// Create uploads directory if it doesn't exist
const fs = require('fs')
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir)
}

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})