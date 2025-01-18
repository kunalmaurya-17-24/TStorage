import React from 'react'
import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('token')

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default PrivateRoute