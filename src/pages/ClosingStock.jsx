import React, { useState, useEffect } from 'react'
import { getItems, getCurrentStock } from '../utils/storage'
import '../App.css'

function ClosingStock() {
  const [items, setItems] = useState([])
  const [stockData, setStockData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState(null) // null = all, 'inStock' = in stock only, 'outOfStock' = out of stock only, 'negativeStock' = negative stock only

  useEffect(() => {
    loadStockData()
  }, [])

  const loadStockData = () => {
    const allItems = getItems()
    const stockInfo = allItems.map(item => ({
      ...item,
      currentStock: getCurrentStock(item.id),
    }))
    setItems(allItems)
    setStockData(stockInfo)
  }

  const filteredStock = stockData.filter(item => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Stock status filter
    const matchesStockFilter = stockFilter === null || 
      (stockFilter === 'inStock' && item.currentStock > 0) ||
      (stockFilter === 'outOfStock' && item.currentStock === 0) ||
      (stockFilter === 'negativeStock' && item.currentStock < 0)
    
    return matchesSearch && matchesStockFilter
  })

  const inStockItems = stockData.filter(item => item.currentStock > 0).length
  const outOfStockItems = stockData.filter(item => item.currentStock === 0).length
  const availableQuantity = stockData.reduce((sum, item) => sum + item.currentStock, 0)
  const totalStockValue = stockData.reduce((sum, item) => 
    sum + (item.currentStock * item.purchasePrice), 0
  )

  const handleInStockClick = () => {
    if (stockFilter === 'inStock') {
      setStockFilter(null) // Toggle off if already active
    } else {
      setStockFilter('inStock')
    }
  }

  const handleOutOfStockClick = () => {
    if (stockFilter === 'outOfStock') {
      setStockFilter(null) // Toggle off if already active
    } else {
      setStockFilter('outOfStock')
    }
  }

  const handleNegativeStockClick = () => {
    if (stockFilter === 'negativeStock') {
      setStockFilter(null) // Toggle off if already active
    } else {
      setStockFilter('negativeStock')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Closing Stock</h1>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, code, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px', paddingRight: '2rem' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#6b7280',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div 
          className="stat-card" 
          style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
            opacity: stockFilter === 'inStock' ? 1 : stockFilter === null ? 1 : 0.7,
            border: stockFilter === 'inStock' ? '3px solid #ffffff' : '3px solid transparent',
            boxShadow: stockFilter === 'inStock' ? '0 6px 20px rgba(16, 185, 129, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onClick={handleInStockClick}
          onMouseEnter={(e) => {
            if (stockFilter !== 'inStock') {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (stockFilter !== 'inStock') {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <div className="stat-label">
            In Stock Item
            {stockFilter === 'inStock' && <span style={{ marginLeft: '0.5rem' }}>✓</span>}
          </div>
          <div className="stat-value">{inStockItems}</div>
        </div>
        <div 
          className="stat-card" 
          style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
            opacity: stockFilter === 'outOfStock' ? 1 : stockFilter === null ? 1 : 0.7,
            border: stockFilter === 'outOfStock' ? '3px solid #ffffff' : '3px solid transparent',
            boxShadow: stockFilter === 'outOfStock' ? '0 6px 20px rgba(239, 68, 68, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onClick={handleOutOfStockClick}
          onMouseEnter={(e) => {
            if (stockFilter !== 'outOfStock') {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (stockFilter !== 'outOfStock') {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <div className="stat-label">
            Out of Stock Item
            {stockFilter === 'outOfStock' && <span style={{ marginLeft: '0.5rem' }}>✓</span>}
          </div>
          <div className="stat-value">{outOfStockItems}</div>
        </div>
        <div 
          className="stat-card" 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
            opacity: stockFilter === 'negativeStock' ? 1 : stockFilter === null ? 1 : 0.7,
            border: stockFilter === 'negativeStock' ? '3px solid #ffffff' : '3px solid transparent',
            boxShadow: stockFilter === 'negativeStock' ? '0 6px 20px rgba(102, 126, 234, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onClick={handleNegativeStockClick}
          onMouseEnter={(e) => {
            if (stockFilter !== 'negativeStock') {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (stockFilter !== 'negativeStock') {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <div className="stat-label">
            Available Quantity
            {stockFilter === 'negativeStock' && <span style={{ marginLeft: '0.5rem' }}>✓</span>}
          </div>
          <div className="stat-value">{availableQuantity}</div>
        </div>
        <div 
          className="stat-card" 
          style={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
            opacity: stockFilter === 'negativeStock' ? 1 : stockFilter === null ? 1 : 0.7,
            border: stockFilter === 'negativeStock' ? '3px solid #ffffff' : '3px solid transparent',
            boxShadow: stockFilter === 'negativeStock' ? '0 6px 20px rgba(245, 158, 11, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onClick={handleNegativeStockClick}
          onMouseEnter={(e) => {
            if (stockFilter !== 'negativeStock') {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (stockFilter !== 'negativeStock') {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <div className="stat-label">
            Stock Value
            {stockFilter === 'negativeStock' && <span style={{ marginLeft: '0.5rem' }}>✓</span>}
          </div>
          <div className="stat-value">PKR {totalStockValue.toFixed(2)}</div>
        </div>
      </div>

      {stockData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>No items found. Add items first to view stock.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Purchase Price</th>
                <th>Sale Price</th>
                <th>Stock Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => {
                const stockValue = item.currentStock * item.purchasePrice
                const status = item.currentStock === 0 
                  ? 'Out of Stock' 
                  : item.currentStock < 10 
                  ? 'Low Stock' 
                  : 'In Stock'
                const statusColor = item.currentStock === 0 
                  ? '#ef4444' 
                  : item.currentStock < 10 
                  ? '#f59e0b' 
                  : '#10b981'
                
                return (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 'bold', color: statusColor }}>
                      {item.currentStock}
                    </td>
                    <td>PKR {item.purchasePrice.toFixed(2)}</td>
                    <td>PKR {item.salePrice.toFixed(2)}</td>
                    <td>PKR {stockValue.toFixed(2)}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '12px', 
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        background: statusColor + '20',
                        color: statusColor
                      }}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ClosingStock

