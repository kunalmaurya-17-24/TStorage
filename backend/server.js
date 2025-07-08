const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const path = require('path')
require('dotenv').config()

const app = express()

const _dirname = path.resolve();

// Middleware - Allow all origins for development
app.use(cors({
    origin: true,  // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
}))
app.use(express.json())
app.use(cookieParser())


// Serve static files from frontend dist
app.use(express.static(path.join(_dirname, 'frontend', 'dist')))

// Serve uploaded files with authentication
app.use('/uploads', express.static(path.join(_dirname, 'uploads')))

// Root route to show the server is running
app.get('/', (req, res) => {
    res.json({ 
        message: 'Backend server is running', 
        availableRoutes: [
            '/api/auth',
            '/api/files'
        ]
    });
})

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/files', require('./routes/files'))

// Catch-all route AFTER API routes
app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(_dirname, 'frontend', 'dist', 'index.html'))
    } else {
        // Handle undefined API routes
        res.status(404).json({ message: 'API route not found' })
    }
})

// Connect to Database
connectDB()

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