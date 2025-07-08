// config/imagekit.js
const ImageKit = require('imagekit');
require('dotenv').config();

let imagekit;

try {
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
        console.warn('⚠️ ImageKit environment variables not fully configured. File uploads may not work.');
        imagekit = null;
    } else {
        imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });
        console.log('✅ ImageKit configured successfully');
    }
} catch (error) {
    console.error('❌ Error configuring ImageKit:', error.message);
    imagekit = null;
}

module.exports = imagekit;
