import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../utils/axiosConfig'
import toast from 'react-hot-toast'

const FileUpload = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [deletingFileId, setDeletingFileId] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [storageInfo, setStorageInfo] = useState({
    usedStorage: 0,
    totalStorage: 5 * 1024 * 1024 * 1024, // 5GB in bytes
    formattedUsed: '',
    formattedTotal: '',
    percentage: ''
  })
  const [selectedTimer, setSelectedTimer] = useState('30m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const timerOptions = [
    { value: '5m', label: '5 mins' },
    { value: '10m', label: '10 mins' },
    { value: '15m', label: '15 mins' },
    { value: '30m', label: '30 mins' },
    { value: '1h', label: '1 hr' },
    { value: '3h', label: '3 hrs' },
    { value: '6h', label: '6 hrs' },
    { value: '12h', label: '12 hrs' }
  ]

  const fetchUploadedFiles = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      // console.group('Fetch Uploaded Files')
      // console.log('Token:', localStorage.getItem('token'))
      
      const response = await axiosInstance.get('/files', {
        // Force no cache
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      // console.log('Full Response:', response)
      
      let filesData = []
      if (response.data && response.data.files) {
        filesData = Array.isArray(response.data.files) 
          ? response.data.files 
          : []
      }
      
      // console.log('Processed Files:', filesData)
      // console.groupEnd()
      
      setUploadedFiles(filesData)
      await fetchStorageInfo()
    } catch (error) {
      // console.group('Fetch Files Error')
      // console.error('Error Details:', error)
      
      // Detailed error logging
      // if (error.response) {
      //   console.error('Response Status:', error.response.status)
      //   console.error('Response Data:', error.response.data)
      //   console.error('Response Headers:', error.response.headers)
      // }
      
      // console.groupEnd()
      
      // More specific error handling
      if (error.response && error.response.status === 401) {
        // Token might be invalid, redirect to login
        localStorage.removeItem('token')
        navigate('/login')
        toast.error('Session expired. Please log in again.')
      } else {
        setError(error.response?.data?.message || 'Failed to fetch files. Please try again.')
        toast.error('Failed to fetch files. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Fetch user's uploaded files when component mounts
    fetchUploadedFiles()
  }, [])

  const formatStorageInfo = (usedStorage, totalStorage) => {
    // Convert bytes to more readable format
    const formatBytes = (bytes) => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }

    // Calculate percentage
    const percentage = totalStorage > 0 
      ? ((usedStorage / totalStorage) * 100).toFixed(1) 
      : 0

    return {
      formattedUsed: formatBytes(usedStorage),
      formattedTotal: formatBytes(totalStorage),
      percentage: `${percentage}%`
    }
  }

  const fetchStorageInfo = async () => {
    try {
      // console.log('Fetching storage info...')
      const response = await axiosInstance.get('/files/storage-info')

      // console.log('Storage info response:', response.data)

      // Handle different response structures
      const usedStorage = Number(response.data.used || response.data.usedStorage || 0)
      const totalStorage = Number(response.data.total || response.data.totalStorage || (5 * 1024 * 1024 * 1024)) // 5GB default

      const { formattedUsed, formattedTotal, percentage } = formatStorageInfo(usedStorage, totalStorage)

      // console.log('Parsed storage:', { 
      //   usedStorage, 
      //   totalStorage, 
      //   formattedUsed, 
      //   formattedTotal, 
      //   percentage 
      // })

      setStorageInfo({
        usedStorage,
        totalStorage,
        formattedUsed,
        formattedTotal,
        percentage
      })
    } catch (error) {
      // console.error('Failed to fetch storage info:', error.response ? error.response.data : error)
    }
  }

  useEffect(() => {
    fetchStorageInfo()
  }, [uploadedFiles.length, deletingFileId])

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout')
      localStorage.removeItem('token')
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      // console.error('Logout failed', error)
      toast.error('Logout failed. Please try again.')
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file size (20MB limit)
    const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 20MB limit')
      return
    }

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('timer', selectedTimer)

    setIsUploading(true)

    // Show loading toast
    const uploadToast = toast.loading('Uploading file...')

    try {
      const response = await axiosInstance.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // console.log('Full Upload Response:', {
      //   data: response.data,
      //   selectedTimer: selectedTimer,
      //   expiresAt: response.data.file.expiresAt,
      //   debugInfo: response.data.file.debugInfo
      // })

      // Dismiss loading toast and show success
      toast.dismiss(uploadToast)
      toast.success(`File uploaded. Will expire in ${selectedTimer}`)

      // Reset file selection
      setSelectedTimer('30m') // Reset to default timer
      fileInputRef.current.value = '' // Clear file input

      // Refresh the uploaded files list
      await fetchUploadedFiles()
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss(uploadToast)
      
      // Check for specific error types
      if (error.response && error.response.status === 401) {
        toast.error('Session expired. Please log in again.')
        // Optional: Redirect to login or trigger logout
        handleLogout()
      } else {
        toast.error(
          error.response?.data?.message || 
          'File upload failed. Please try again.'
        )
      }
      
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDeleteFile = async (fileId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this file?')
    if (!confirmDelete) return

    try {
      setDeletingFileId(fileId)

      await axiosInstance.delete(`/files/${fileId}`)

      toast.success('File deleted successfully')
      await fetchUploadedFiles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete file')
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleShareFile = async (file) => {
    try {
      // console.log('Attempting to share file:', JSON.stringify(file, null, 2))

      // Determine the correct file ID
      const fileId = file._id || file.id || file.fileId

      // Validate file ID
      if (!fileId) {
        // console.error('No valid file ID found', file)
        toast.error('Unable to share file: Invalid file identifier')
        return
      }

      // console.log('Sharing file with ID:', fileId)

      const response = await axiosInstance.post(`/files/${fileId}/share`)

      // Copy direct file URL to clipboard
      await navigator.clipboard.writeText(file.url)

      // Show toast notification with expiration
      toast.success(`Direct file URL copied! Expires on ${new Date(file.expiresAt).toLocaleString()}`)
    } catch (error) {
      // console.error('Share file error:', error.response ? error.response.data : error)
      toast.error(
        error.response?.data?.message ||
        'Failed to generate share link. Please try again.'
      )
    }
  }

  const handlePreviewFile = (file) => {
    setPreviewFile(file)
  }

  const closePreview = () => {
    setPreviewFile(null)
  }

  const renderFilePreview = () => {
    if (!previewFile) return null

    const fileType = previewFile.fileType?.toLowerCase() || ''
    const fileName = previewFile.fileName?.toLowerCase() || ''

    // Image preview
    if (fileType.startsWith('image/')) {
      return (
        <img
          src={previewFile.url}
          alt={previewFile.fileName}
          className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-md"
        />
      )
    }

    // Video preview
    if (fileType.startsWith('video/')) {
      return (
        <video
          controls
          className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-md"
        >
          <source src={previewFile.url} type={previewFile.fileType} />
          Your browser does not support the video tag.
        </video>
      )
    }

    // Audio preview
    if (fileType.startsWith('audio/') ||
      fileName.endsWith('.mp3') ||
      fileName.endsWith('.wav') ||
      fileType === 'audio/mpeg') {
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <audio
            controls
            autoPlay={false}
            className="w-full max-w-md"
            style={{
              minWidth: '300px',
              maxWidth: '500px',
            }}
          >
            <source
              src={previewFile.url}
              type={previewFile.fileType || 'audio/mpeg'}
            />
            Your browser does not support the audio element.
          </audio>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Now playing: {previewFile.fileName}
            </p>
          </div>
        </div>
      )
    }

    // HTML preview
    if (fileType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      return (
        <iframe
          src={previewFile.url}
          className="w-full h-[70vh] border rounded-lg shadow-md"
          title="HTML Preview"
        />
      )
    }

    // Document preview (PDF, DOC, DOCX)
    if (
      fileType === 'application/pdf' ||
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return (
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
          className="w-full h-[70vh] border rounded-lg shadow-md"
          title="Document Preview"
        />
      )
    }

    // Text file preview
    if (fileType === 'text/plain') {
      return (
        <div className="bg-gray-100 p-4 rounded-lg max-h-[70vh] overflow-auto">
          <pre className="text-black">{previewFile.content || 'Unable to load text content'}</pre>
        </div>
      )
    }

    // Fallback for unsupported file types
    return (
      <div className="text-center p-4">
        <p className="text-black">Preview not available for this file type</p>
      </div>
    )
  }

  const formatRemainingTime = (expiresAt) => {
    if (!expiresAt) return 'Expiring soon'

    try {
      const expirationDate = new Date(expiresAt)
      const currentTime = new Date()
      
      // Check if expiration date is valid
      if (isNaN(expirationDate.getTime())) return 'Expiring soon'

      // Calculate time difference with precise rounding
      const timeDiff = expirationDate.getTime() - currentTime.getTime()
      
      // If already expired
      if (timeDiff <= 0) return 'Expired'

      // Precise calculation of hours and minutes
      const totalMinutes = Math.floor(timeDiff / (1000 * 60))
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      // console.error('PRECISE REMAINING TIME CALCULATION:', {
      //   originalExpiresAt: expiresAt,
      //   expirationDateUTC: expirationDate.toUTCString(),
      //   currentTimeUTC: currentTime.toUTCString(),
      //   timeDiffMs: timeDiff,
      //   totalMinutes: totalMinutes,
      //   hours: hours,
      //   minutes: minutes,
      //   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      // })

      // Detailed time formatting logic
      if (hours > 0) {
        // More than 1 hour
        return `${hours} hr ${minutes} min remaining`
      } else if (minutes >= 1) {
        // 1 or more minutes
        return `${minutes} min remaining`
      } else {
        return 'Expiring soon'
      }
    } catch (error) {
      // console.error('Remaining time calculation error:', error)
      return 'Expiring soon'
    }
  }

  const PreviewModal = () => {
    if (!previewFile) return null

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={closePreview}
      >
        <div
          className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          >
            &#10005;
          </button>
          <h2 className="text-2xl font-bold mb-4 text-black">
            {previewFile.fileName}
          </h2>
          {renderFilePreview()}
          <div className="flex justify-center mt-4">
            <a
              href={previewFile.url}
              download={previewFile.fileName}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Download File
            </a>
          </div>
        </div>
      </div>
    )
  }

  const formatBytes = (bytes) => {
    if (isNaN(bytes) || bytes === undefined) return '0 MB'

    const absBytes = Math.abs(bytes)
    if (absBytes < 1024) return `${absBytes} B`
    if (absBytes < 1024 * 1024) return `${(absBytes / 1024).toFixed(1)} KB`

    // Special case for total storage
    if (absBytes === storageInfo.totalStorage) {
      return '5 GB'
    }

    return `${(absBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const storagePercentage = isNaN(storageInfo.usedStorage) || isNaN(storageInfo.totalStorage)
    ? 0
    : Math.round((storageInfo.usedStorage / storageInfo.totalStorage) * 100)

  const StorageUsageBar = () => {
    return (
      <div className="absolute bottom-2 left-[5%] w-[88%] bg-gray-800 rounded-lg p-3 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-xs">
            Storage Used: {storageInfo.formattedUsed} / {storageInfo.formattedTotal}
          </span>
          <span className="text-white text-xs">
            {storageInfo.percentage}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              storagePercentage > 90
                ? 'bg-red-500'
                : storagePercentage > 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${storagePercentage}%` }}
          ></div>
        </div>
      </div>
    )
  }

  const TimerSelector = () => (
    <div className="absolute top-[13.3%] right-[8.1%] bg-gray-600 bg-opacity-30 p-1 rounded-lg w-[180px] group transition-all duration-300 ease-in-out">
      <select
        value={selectedTimer}
        onChange={(e) => setSelectedTimer(e.target.value)}
        className="
          w-full 
          bg-transparent 
          text-white 
          p-1 
          rounded-md 
          transition-all 
          duration-300 
          ease-in-out
          cursor-pointer
        "
      >
        {timerOptions.map((option) => (
          <option 
            key={option.value} 
            value={option.value} 
            className="bg-gray-700"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner-border" role="status">
          <span className="loading">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">
          {error}
          <button 
            onClick={fetchUploadedFiles} 
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-700 h-screen w-screen relative flex justify-center items-center">
      <button
        onClick={handleLogout}
        className="absolute top-0 right-0 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-bl-lg shadow-md transition-colors duration-300 z-50"
      >
        Logout
      </button>

      <div className="vishal bg-gray-900 w-[99%] h-[92%] rounded-2xl relative top-7">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,video/*,audio/*,text/*,.doc,.docx,.xls,.xlsx"
        />

        <div className="absolute top-[5%] left-[5%] bg-gray-600 bg-opacity-30 p-2 rounded-lg w-[88%]">
          <button
            onClick={handleFileSelect}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg shadow-md transition-colors duration-300 ml-[5px] mt-[5px]"
          >
            Upload File
          </button>
          <p className="text-s text-gray-300 mt-2 text-center">
            Max file upload limit: 20MB
          </p>
        </div>

        {isUploading && (
          <div className="absolute bottom-[10%] left-[5%] w-[88%] bg-gray-700 rounded-full h-2.5 mt-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: '100%' }}
            ></div>
            <div className="text-center text-sm text-gray-300 mt-2">
              Uploading...
            </div>
          </div>
        )}

        {/* Uploaded Files Section */}
        <div className="absolute top-[20%] left-[5%] w-[88%] h-[70%] overflow-y-auto">
          <h2 className="text-white text-xl mb-4">Uploaded Files</h2>
          {isLoading ? (
            <p className="text-gray-400">Loading files...</p>
          ) : uploadedFiles.length === 0 ? (
            <p className="text-gray-400">No files uploaded yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file, index) => (
                <div
                  key={file._id || file.id || `file-${index}`}
                  className="bg-gray-800 rounded-lg p-6 shadow-md hover:bg-gray-700 transition-colors w-full max-w-md"
                >
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white text-lg font-semibold mr-2 truncate">
                        {file.fileName || file.originalName || file.name || 'Unnamed File'}
                      </span>
                      <span className="text-gray-400 text-sm ml-2 flex-shrink-0">
                        {formatFileSize(file.size || file.fileSize || 0)}
                      </span>
                    </div>
                    {/* <div className="text-sm text-gray-500">
                      {formatRemainingTime(file.expiresAt)}
                    </div> */}
                    <div className="flex space-x-3 w-full">
                      <button
                        onClick={() => handlePreviewFile(file)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors flex-1"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleShareFile(file)}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm transition-colors flex-1"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file._id || file.id)}
                        disabled={deletingFileId === (file._id || file.id)}
                        className={`${
                          deletingFileId === (file._id || file.id)
                            ? 'bg-red-300 cursor-wait'
                            : 'bg-red-500 hover:bg-red-600'
                        }
                          text-white py-2 px-4 rounded-md text-sm transition-colors flex-1
                        `}
                      >
                        {deletingFileId === (file._id || file.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <TimerSelector />
      <StorageUsageBar />
      <PreviewModal />
    </div>
  )
}

export default FileUpload
