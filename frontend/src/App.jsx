import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import FileUpload from './pages/FileUpload'
import SharedFile from './pages/SharedFile'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: '#4CAF50',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#F44336',
              color: 'white',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <FileUpload />
            </ProtectedRoute>
          } 
        />
        <Route path="/shared/:shareableLink" element={<SharedFile />} />
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
