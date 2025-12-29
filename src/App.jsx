import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Items from './pages/Items'
import StockPurchase from './pages/StockPurchase'
import StockReturn from './pages/StockReturn'
import Sale from './pages/Sale'
import SaleReturn from './pages/SaleReturn'
import ClosingStock from './pages/ClosingStock'
import './App.css'

function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Items', icon: '📦' },
    { path: '/stock-purchase', label: 'Stock Purchase', icon: '🛒' },
    { path: '/stock-return', label: 'Stock Return', icon: '↩️' },
    { path: '/sale', label: 'Sale', icon: '💰' },
    { path: '/sale-return', label: 'Sale Return', icon: '🔄' },
    { path: '/closing-stock', label: 'Closing Stock', icon: '📊' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-title">POS System</h1>
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
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Items />} />
            <Route path="/stock-purchase" element={<StockPurchase />} />
            <Route path="/stock-return" element={<StockReturn />} />
            <Route path="/sale" element={<Sale />} />
            <Route path="/sale-return" element={<SaleReturn />} />
            <Route path="/closing-stock" element={<ClosingStock />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

