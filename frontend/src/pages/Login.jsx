import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '../utils/axiosConfig'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

// Global error handler
const logError = (error, context = '') => {
  console.group('Login Error Log')
  console.error('Context:', context)
  console.error('Error Name:', error.name)
  console.error('Error Message:', error.message)
  console.error('Full Error:', error)
  
  // Detailed response logging
  if (error.response) {
    console.error('Response Status:', error.response.status)
    console.error('Response Data:', error.response.data)
  }
  
  console.groupEnd()
}

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Global error boundary
  useEffect(() => {
    const handleError = (event) => {
      logError(event.error, 'Global Error Handler')
      toast.error('An unexpected error occurred. Please try again.')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      console.group('Login Attempt')
      console.log('Attempting login with:', { email })
      
      const response = await axiosInstance.post('/auth/login', { 
        email, 
        password 
      }, {
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 300
        }
      })
      
      // Extensive logging of response
      console.log('Full Response:', response)
      console.log('Response Data:', response.data)
      console.log('Response Status:', response.status)
      console.groupEnd()
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format: Expected an object')
      }
      
      // Ensure token exists
      const token = response.data.token
      if (!token) {
        throw new Error('No authentication token received')
      }
      
      // Store authentication details
      localStorage.setItem('token', token)
      document.cookie = `token=${token}; path=/; SameSite=Strict`
      
      // User feedback
      toast.success('Login successful!')
      navigate('/upload')
    } catch (error) {
      logError(error, 'Login Submission')
      
      // User-friendly error messages
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Login failed: Unexpected error'
      
      toast.error(errorMessage)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Welcome Back</h2>
            <p className="text-sm text-gray-500 mb-6">Sign in to continue to your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2 text-sm font-semibold">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 pr-10" 
                  required 
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2 text-sm font-semibold">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 pr-10" 
                  required 
                  placeholder="Enter your password"
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600 transition"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Log In
            </button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mt-4">
              Don't have an account? {' '}
              <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login