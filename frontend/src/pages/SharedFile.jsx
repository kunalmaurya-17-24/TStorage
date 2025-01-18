import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axiosInstance from '../utils/axiosConfig'
import { toast } from 'react-hot-toast'

const SharedFile = () => {
  const { shareableLink } = useParams()
  const [sharedFile, setSharedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        const response = await axiosInstance.get(`/files/shared/${shareableLink}`)
        
        // console.log('Shared file details:', response.data)
        setSharedFile(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Shared file fetch error:', error)
        setError('Failed to load shared file')
        setLoading(false)
        toast.error(
          error.response?.data?.message || 
          'Failed to load shared file'
        )
      }
    }

    if (shareableLink) {
      fetchSharedFile()
    }
  }, [shareableLink])

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-400 flex items-center justify-center">
        <div className="text-white text-2xl">Loading shared file...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-400 flex items-center justify-center">
        <div className="bg-red-500 text-white p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Determine file preview based on type
  const renderFilePreview = () => {
    const fileType = sharedFile.fileType.toLowerCase()
    const fileName = sharedFile.fileName.toLowerCase()

    // Image preview
    if (fileType.startsWith('image/')) {
      return (
        <img 
          src={sharedFile.url} 
          alt={sharedFile.fileName} 
          className="max-w-full max-h-[70vh] object-contain  mx-auto rounded-lg shadow-md"
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
          <source src={sharedFile.url} type={sharedFile.fileType} />
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
              maxWidth: '500px' 
            }}
          >
            <source 
              src={sharedFile.url} 
              type={sharedFile.fileType || 'audio/mpeg'} 
            />
            Your browser does not support the audio element.
          </audio>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Now playing: {sharedFile.fileName}
            </p>
          </div>
        </div>
      )
    }

    // HTML preview
    if (fileType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      return (
        <iframe 
          src={sharedFile.url} 
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
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(sharedFile.url)}&embedded=true`}
          className="w-full h-[70vh] border rounded-lg shadow-md"
          title="Document Preview"
        />
      )
    }

    // Text file preview
    if (fileType === 'text/plain') {
      return (
        <div className="bg-gray-100 p-4 rounded-lg max-h-[70vh] overflow-auto">
          <pre className="text-black">{sharedFile.content || 'Unable to load text content'}</pre>
        </div>
      )
    }

    // Fallback for unsupported file types
    return (
      <div className="text-center p-4">
        <p className="text-black">Preview not available for this file type</p>
        <a 
          href={sharedFile.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:underline"
        >
          Download File
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-indigo-400 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-4xl w-full">
        {/* Ensure file name is visible and in black color */}
        <h2 className="text-2xl font-bold mb-4 text-black">Shared File</h2>
        <p className="mb-4 text-lg font-semibold text-black">
          File Name: {sharedFile.fileName}
        </p>
        
        {renderFilePreview()}
        
        <div className="flex justify-center space-x-4 mt-6">
          <a 
            href={sharedFile.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300 flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-9.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Download File
          </a>
        </div>
      </div>
    </div>
  )
}

export default SharedFile
