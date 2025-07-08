const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set')
    }
    
    console.log('Attempting to connect to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

module.exports = connectDB