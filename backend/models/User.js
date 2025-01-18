const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        minLength: [3, 'Username must be at least 3 characters long'],
        maxLength: [20, 'Username must be at most 20 characters long']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        minLength: [13, 'Email must be at least 13 characters long'],
        maxLength: [50, 'Email must be at most 50 characters long']
    },
    password: {
        type: String,
        required: true,
        minLength: [6, 'Password must be at least 6 characters long'],
        maxLength: [100, 'Password must be at most 100 characters long']
    },
    totalStorageUsed: {
        type: Number,
        default: 0,
        min: [0, 'Storage used cannot be negative']
    }
}, {
    timestamps: true  // Add createdAt and updatedAt fields
});

const User = mongoose.model('user', userSchema);
module.exports = User;