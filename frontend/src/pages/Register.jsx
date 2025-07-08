import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '../utils/axiosConfig'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Enhanced client-side validation
    const usernameRegex = /^[a-zA-Z0-9._-]{5,20}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

    if (!usernameRegex.test(username)) {
      toast.error('Username must be 5-20 characters, using only letters, numbers, _, ., or -')
      return
    }

    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!passwordRegex.test(password)) {
      toast.error('Password must be at least 8 characters, include uppercase, lowercase, number, and special character')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      
      const response = await axiosInstance.post('/auth/register', { 
        username, 
        email, 
        password 
      })
      
      toast.success('Registration successful!')
      navigate('/login')
    } catch (error) {
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
      toast.error(errorMessage)
    }
  }

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Create Your Account</h2>
            <p className="text-sm text-gray-500 mb-6">Sign up to get started</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-2 text-sm font-semibold">Username</label>
              <input 
                type="text" 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300" 
                required 
                minLength="3"
                maxLength="20"
                placeholder="Choose a unique username"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2 text-sm font-semibold">Email</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300" 
                required 
                placeholder="Enter your email"
              />
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
                  minLength="6"
                  placeholder="Create a strong password"
                />
                <button 
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600 transition"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 mb-2 text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 pr-10" 
                  required 
                  minLength="6"
                  placeholder="Confirm your password"
                />
                <button 
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600 transition"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Create Account
            </button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mt-4">
              Already have an account? {' '}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register