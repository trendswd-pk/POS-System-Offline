import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import Items from './pages/Items'
import StockPurchase from './pages/StockPurchase'
import StockReturn from './pages/StockReturn'
import Sale from './pages/Sale'
import SaleReturn from './pages/SaleReturn'
import ClosingStock from './pages/ClosingStock'
import Users from './pages/Users'
import Login from './pages/Login'
import { getCurrentUser, setCurrentUser } from './utils/storage'
import './App.css'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [currentUser, setCurrentUserState] = useState(getCurrentUser())

  useEffect(() => {
    // Update user state when it changes
    const user = getCurrentUser()
    setCurrentUserState(user)
  }, [location])

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setCurrentUser(null)
      setCurrentUserState(null)
      navigate('/login')
    }
  }
  
  const navItems = [
    { path: '/', label: 'Items', icon: '📦' },
    { path: '/stock-purchase', label: 'Stock Purchase', icon: '🛒' },
    { path: '/stock-return', label: 'Stock Return', icon: '↩️' },
    { path: '/sale', label: 'Sale', icon: '💰' },
    { path: '/sale-return', label: 'Sale Return', icon: '🔄' },
    { path: '/closing-stock', label: 'Closing Stock', icon: '📊' },
    { path: '/users', label: 'Users', icon: '👥' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-title">POS System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <span style={{ color: 'white', fontSize: '0.875rem' }}>
                {currentUser.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function ProtectedRoute({ children }) {
  const currentUser = getCurrentUser()
  
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function Layout({ children }) {
  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Items />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/stock-purchase" element={
          <ProtectedRoute>
            <Layout>
              <StockPurchase />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/stock-return" element={
          <ProtectedRoute>
            <Layout>
              <StockReturn />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/sale" element={
          <ProtectedRoute>
            <Layout>
              <Sale />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/sale-return" element={
          <ProtectedRoute>
            <Layout>
              <SaleReturn />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/closing-stock" element={
          <ProtectedRoute>
            <Layout>
              <ClosingStock />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App

