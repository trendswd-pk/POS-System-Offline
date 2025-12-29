import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, saveUsers, setCurrentUser, getCurrentUser } from '../utils/storage'
import '../App.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // If already logged in, redirect to home
    const currentUser = getCurrentUser()
    if (currentUser) {
      navigate('/')
    }

    // Create default admin user if no users exist
    const existingUsers = getUsers()
    if (existingUsers.length === 0) {
      const adminUser = {
        id: Date.now().toString(),
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrator',
        permissions: {
          items: true,
          stockPurchase: true,
          stockReturn: true,
          sale: true,
          saleReturn: true,
          closingStock: true,
          users: true,
        },
        createdAt: new Date().toISOString(),
      }
      saveUsers([adminUser])
    }
  }, [navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    const users = getUsers()
    const user = users.find(u => u.username === username && u.password === password)

    if (user) {
      // Remove password from user object before storing
      const { password: _, ...userWithoutPassword } = user
      setCurrentUser(userWithoutPassword)
      navigate('/')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '3rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '0.5rem' }}>POS System</h1>
          <p style={{ color: '#6b7280' }}>Please login to continue</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '0.75rem',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Login
            </button>
          </div>
        </form>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
          <strong>Default Admin Credentials:</strong><br />
          Username: <code>admin</code><br />
          Password: <code>admin123</code>
        </div>
      </div>
    </div>
  )
}

export default Login

