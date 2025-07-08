const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');
const cron = require('node-cron');
const imagekit = require('../config/imagekit');

// Configure multer for file upload
const storage = multer.memoryStorage(); // Use memory storage to keep file in buffer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Log detailed file information for debugging
    // console.log('File upload details:', {
    //   originalname: file.originalname,
    //   mimetype: file.mimetype,
    //   encoding: file.encoding
    // });

    // Comprehensive allowed types
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/bmp', 
      'image/webp',
      'video/mp4', 
      'video/mpeg', 
      'video/quicktime', 
      'video/x-msvideo', 
      'video/x-ms-wmv',
      'application/pdf',
      'text/plain', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/x-wav',
      'audio/x-mpeg',
      'text/html',
      'text/plain',
      'application/xhtml+xml'
    ];

    const extensionAllowList = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
      '.mp4', '.avi', '.mov', '.wmv', '.mpg', '.mpeg',
      '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx',
      '.mp3', '.wav', '.html', '.htm', '.txt'
    ];

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isMimeTypeAllowed = allowedTypes.includes(file.mimetype);
    const isExtensionAllowed = extensionAllowList.includes(fileExtension);

    if (isMimeTypeAllowed || isExtensionAllowed) {
      cb(null, true);
    } else {
      // console.error('File type not allowed:', {
      //   mimetype: file.mimetype,
      //   extension: fileExtension
      // });

      const error = new Error(`File type not allowed. Received: ${file.mimetype}, Extension: ${fileExtension}`);
      error.name = 'FileTypeError';
      cb(error, false);
    }
  }
});

// Utility function to convert timer to milliseconds
const getExpirationTime = (timer) => {
  const timerMap = {
    '5m': 5 * 60 * 1000,      // 5 minutes
    '10m': 10 * 60 * 1000,    // 10 minutes
    '15m': 15 * 60 * 1000,    // 15 minutes
    '30m': 30 * 60 * 1000,    // 30 minutes
    '1h': 60 * 60 * 1000,     // 1 hour
    '3h': 3 * 60 * 60 * 1000, // 3 hours
    '6h': 6 * 60 * 60 * 1000, // 6 hours
    '12h': 12 * 60 * 60 * 1000 // 12 hours
  }
  
  const expirationMs = timerMap[timer] || (30 * 60 * 1000)
  
  // console.error('ULTRA DETAILED TIMER CALCULATION:', {
  //   inputTimer: timer,
  //   exactMilliseconds: expirationMs,
  //   exactSeconds: expirationMs / 1000,
  //   exactMinutes: expirationMs / (60 * 1000),
  //   exactHours: expirationMs / (60 * 60 * 1000),
  //   systemTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  //   currentTimeUTC: new Date().toUTCString(),
  //   currentTimeISO: new Date().toISOString(),
  //   systemTime: {
  //     local: new Date().toString(),
  //     localeString: new Date().toLocaleString(),
  //     timestamp: Date.now()
  //   }
  // })
  
  return expirationMs
}

// Generate unique shareable link
function generateShareableLink() {
  return crypto.randomBytes(16).toString('hex');
}

// File upload route (uses ImageKit)
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { timer = '30m' } = req.body // Default to 30 minutes if not specified
    const expirationTime = getExpirationTime(timer)
    const expiresAt = new Date(Date.now() + expirationTime)

    // console.log('Expires At (Backend):', {
    //   timer: timer,
    //   expirationTime: expirationTime,
    //   expiresAt: expiresAt.toISOString()
    // });

    // Log all incoming request details
    // console.log('Upload Request Details:', {
    //   headers: req.headers,
    //   body: req.body,
    //   files: req.files,
    //   user: req.user ? req.user._id : 'No user'
    // });

    // Proceed with existing upload logic
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded or invalid file type',
        details: 'Please ensure you have selected a valid file.'
      })
    }

    // Check if ImageKit is available
    if (!imagekit) {
      return res.status(500).json({
        message: 'File upload service not configured',
        error: 'ImageKit configuration missing'
      })
    }

    // ImageKit upload
    const uploadResponse = await new Promise((resolve, reject) => {
      imagekit.upload({
        file: req.file.buffer, // Use buffer directly
        fileName: req.file.originalname,
        folder: '/user-uploads'
      }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    });

    // Create file record
    const newFile = new File({
      fileName: req.file.originalname,
      fileId: uploadResponse.fileId,
      userId: req.user._id,
      url: uploadResponse.url,
      fileType: req.file.mimetype,
      fileSize: uploadResponse.size || req.file.size || req.file.buffer.length,
      expiresAt: expiresAt,
      deletionTimer: expirationTime,
      // Remove explicit shareableLink setting
      isShareable: false
    })

    // console.log('File Creation Details:', {
    //   fileName: newFile.fileName,
    //   fileSize: newFile.fileSize,
    //   userId: newFile.userId,
    //   uploadResponseSize: uploadResponse.size,
    //   reqFileSize: req.file.size,
    //   bufferLength: req.file.buffer.length
    // })

    await newFile.save()

    res.status(201).json({ 
      message: 'File uploaded successfully', 
      file: {
        id: newFile._id,
        fileName: newFile.fileName,
        url: newFile.url,
        expiresAt: newFile.expiresAt
      }
    })
  } catch (error) {
    
    // More specific error handling
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Upload failed',
        error: 'Duplicate key error',
        details: 'An unexpected database constraint was violated. Please try again.'
      })
    } else {
      res.status(500).json({ 
        message: 'Upload failed', 
        error: error.message,
        stack: error.stack
      })
    }
  }
})

// Scheduled task to delete expired files (can be moved to a separate service)
router.delete('/cleanup-expired-files', authMiddleware, async (req, res) => {
  try {
    const now = new Date()
    const expiredFiles = await File.find({
      userId: req.user._id,
      expiresAt: { $lt: now }
    });

    // Delete from database
    await File.deleteMany({
      userId: req.user._id,
      expiresAt: { $lt: now }
    });

    // Optional: Add logic to delete from ImageKit
    for (let file of expiredFiles) {
      // Implement ImageKit file deletion logic here
      // await imagekit.deleteFile(file.fileId)
    }

    res.json({ 
      message: 'Expired files cleaned up', 
      deletedCount: expiredFiles.length 
    })
  } catch (error) {
    // console.error('File cleanup error:', error)
    res.status(500).json({ message: 'File cleanup failed' })
  }
})

// Get user's uploaded files
router.get('/user-files', authMiddleware, async (req, res) => {
  try {
    // Find all files for the current user, sorted by upload date (most recent first)
    const userFiles = await File.find({ 
      userId: req.user._id,
      // Optional: filter out expired files
      expiresAt: { $gt: new Date() }
    })
    .sort({ uploadedAt: -1 })
    .select('originalName size uploadedAt fileType url')
    .limit(50)  // Limit to 50 most recent files

    res.status(200).json(userFiles)
  } catch (error) {
    // console.error('Error fetching user files:', error)
    res.status(500).json({ 
      message: 'Failed to retrieve files', 
      error: error.message 
    })
  }
});

// Get user's uploaded files
router.get('/', authMiddleware, async (req, res) => {
  try {
    // console.log('Files retrieval request received')
    // console.log('Authenticated User ID:', req.user._id)
    
    const files = await File.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 }); // Sort by most recent first

    // console.log('Files found:', files.length)

    const processedFiles = files.map(file => ({
      id: file._id,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      url: file.url,
      expiresAt: file.expiresAt,
      createdAt: file.createdAt
    }))

    // Explicitly set content type to JSON
    res.header('Content-Type', 'application/json')
    res.json({ 
      message: 'Files retrieved successfully',
      files: processedFiles
    });
  } catch (error) {
    // console.error('Fetch files error:', {
    //   message: error.message,
    //   stack: error.stack,
    //   userId: req.user ? req.user._id : 'No user'
    // });
    
    // Explicitly set content type to JSON
    res.header('Content-Type', 'application/json')
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Periodic cleanup job (removes expired files)
function setupPeriodicCleanup() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expiredFiles = await File.find({
        expiresAt: { $lte: new Date() }
      });

      // console.log(`Cleaning up ${expiredFiles.length} expired files`);

      const deletePromises = expiredFiles.map(async (file) => {
        try {
          await new Promise((resolve, reject) => {
            imagekit.deleteFile(file.fileId, (err) => {
              if (err) {
                // console.error(`Failed to delete file from ImageKit: ${file.fileId}`, err);
                reject(err);
              } else {
                // console.log(`Deleted file from ImageKit: ${file.fileId}`);
                resolve();
              }
            });
          });

          await File.findByIdAndDelete(file._id);
          // console.log(`Deleted file from database: ${file._id}`);
        } catch (error) {
          // console.error(`Error cleaning up file ${file._id}:`, error);
        }
      });

      await Promise.allSettled(deletePromises);

      // console.log('Periodic cleanup completed');
    } catch (error) {
      // console.error('Periodic cleanup error:', error);
    }
  });
}

setupPeriodicCleanup();

// Get storage information
router.get('/storage-info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id
    const totalStorage = 5 * 1024 * 1024 * 1024 // 5GB in bytes

    // console.log('Storage Info Request Details:', {
    //   userId: userId,
    //   requestUser: req.user,
    //   requestHeaders: req.headers
    // });

    // Calculate used storage
    const files = await File.find({ userId })
    
    // console.log('Files found for storage calculation:', files.map(file => ({
    //   fileName: file.fileName,
    //   fileSize: file.fileSize,
    //   fileId: file._id
    // }))

    const usedStorage = files.reduce((total, file) => total + file.fileSize, 0)

    // console.log('Calculated Storage Details:', {
    //   usedStorage: usedStorage,
    //   totalStorage: totalStorage,
    //   fileCount: files.length
    // });

    res.json({
      used: usedStorage,
      total: totalStorage
    })
  } catch (error) {
    // console.error('Error fetching storage info:', error)
    res.status(500).json({ message: 'Failed to fetch storage information' })
  }
})

// File preview route
router.get('/files/:fileId/preview', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({
      fileId: req.params.fileId,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Return file preview information
    res.json({
      url: file.url,
      fileName: file.fileName,
      fileType: file.fileType,
      message: 'File preview retrieved successfully'
    });
  } catch (error) {
    // console.error('File preview error:', error);
    res.status(500).json({
      message: 'Failed to retrieve file preview',
      error: error.message
    });
  }
});

// File share route
router.post('/files/:fileId/share', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.fileId,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Generate a unique share token
    const shareToken = crypto.randomBytes(16).toString('hex')

    // Save the share token in the database
    file.shareToken = shareToken
    file.shareTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    await file.save()

    // Create shareable link
    const shareableLink = `${process.env.FRONTEND_URL}/share/${shareToken}`

    res.json({ 
      shareableLink,
      expiresAt: file.shareTokenExpires
    })
  } catch (error) {
    res.status(500).json({ message: 'Error generating share link' })
  }
})

// Generate shareable link for a file
router.post('/:fileId/share', authMiddleware, async (req, res) => {
  try {
    // Find the file and ensure it belongs to the user
    const file = await File.findOne({ 
      _id: req.params.fileId, 
      userId: req.user._id 
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Check if file is already shareable
    if (file.isShareable && file.shareableLink) {
      return res.status(200).json({
        shareableLink: `${process.env.FRONTEND_URL}/shared/${file.shareableLink}`,
        expiresAt: file.shareTokenExpires
      })
    }

    // Generate a new shareable link
    file.isShareable = true
    file.shareableLink = crypto.randomBytes(16).toString('hex')
    file.shareTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await file.save()

    res.status(200).json({
      shareableLink: `${process.env.FRONTEND_URL}/shared/${file.shareableLink}`,
      expiresAt: file.shareTokenExpires
    })
  } catch (error) {
    // console.error('Error generating shareable link:', error)
    res.status(500).json({ 
      message: 'Failed to generate shareable link', 
      error: error.message 
    })
  }
})

// New route to access shared file
router.get('/share/:token', async (req, res) => {
  try {
    const file = await File.findOne({
      shareToken: req.params.token,
      shareTokenExpires: { $gt: new Date() }
    });

    if (!file) {
      return res.status(404).json({ message: 'Shared file not found or link expired' })
    }

    res.json({
      fileName: file.originalName,
      fileType: file.fileType,
      fileUrl: file.url
    })
  } catch (error) {
    res.status(500).json({ message: 'Error accessing shared file' })
  }
});

// Route to access shared file details
router.get('/shared/:shareableLink', async (req, res) => {
  try {
    const { shareableLink } = req.params

    // Find the shared file
    const sharedFile = await File.findOne({ 
      shareableLink, 
      isShareable: true,
      shareTokenExpires: { $gt: new Date() } // Check if not expired
    });

    if (!sharedFile) {
      return res.status(404).json({ 
        message: 'Shared file not found or link has expired' 
      })
    }

    // Return file details
    res.json({
      fileName: sharedFile.fileName,
      fileType: sharedFile.fileType,
      url: sharedFile.url,
      expiresAt: sharedFile.shareTokenExpires
    })
  } catch (error) {
    // console.error('Error accessing shared file:', error)
    res.status(500).json({ 
      message: 'Failed to retrieve shared file', 
      error: error.message 
    })
  }
})

// Delete a specific file
router.delete('/:fileId', authMiddleware, async (req, res) => {
  try {
    // Find the file first to ensure it belongs to the user
    const file = await File.findOne({ 
      _id: req.params.fileId, 
      userId: req.user._id 
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Delete from ImageKit
    await new Promise((resolve, reject) => {
      imagekit.deleteFile(file.fileId, (err) => {
        if (err) {
          // console.error(`Failed to delete file from ImageKit: ${file.fileId}`, err)
          reject(err)
        } else {
          resolve()
        }
      })
    });

    // Delete from database
    await File.findByIdAndDelete(file._id)

    res.status(200).json({ message: 'File deleted successfully' })
  } catch (error) {
    // console.error('Error deleting file:', error)
    res.status(500).json({ 
      message: 'Failed to delete file', 
      error: error.message 
    })
  }
});

// Get storage information
router.get('/files/storage-info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Calculate total storage used
    const totalFiles = await File.countDocuments({ userId });
    const totalSize = await File.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);

    // Define storage limits (e.g., 500MB)
    const MAX_STORAGE_BYTES = 500 * 1024 * 1024; // 500MB
    const usedStorageBytes = totalSize[0]?.totalSize || 0;
    const remainingStorageBytes = Math.max(0, MAX_STORAGE_BYTES - usedStorageBytes);

    res.json({
      totalFiles,
      usedStorageBytes,
      remainingStorageBytes,
      maxStorageBytes: MAX_STORAGE_BYTES,
      storagePercentageUsed: (usedStorageBytes / MAX_STORAGE_BYTES) * 100
    });
  } catch (error) {
    // console.error('Storage info error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve storage information',
      error: error.message 
    });
  }
});

// Get storage information
router.get('/files/storage-info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Calculate total storage used
    const totalFiles = await File.countDocuments({ userId });
    const totalSize = await File.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);

    // Define storage limits (e.g., 500MB)
    const MAX_STORAGE_BYTES = 500 * 1024 * 1024; // 500MB
    const usedStorageBytes = totalSize[0]?.totalSize || 0;
    const remainingStorageBytes = Math.max(0, MAX_STORAGE_BYTES - usedStorageBytes);

    res.json({
      totalFiles,
      usedStorageBytes,
      remainingStorageBytes,
      maxStorageBytes: MAX_STORAGE_BYTES,
      storagePercentageUsed: (usedStorageBytes / MAX_STORAGE_BYTES) * 100
    });
  } catch (error) {
    // console.error('Storage info error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve storage information',
      error: error.message 
    });
  }
});

module.exports = router;
