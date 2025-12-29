import React, { useState, useEffect } from 'react'
import { getItems, saveItems, getPurchases, getStockReturns, getSales, getSaleReturns } from '../utils/storage'
import '../App.css'

function Items() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [movementHistory, setMovementHistory] = useState([])
  const [openMenuId, setOpenMenuId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    purchasePrice: '',
    salePrice: '',
  })

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    const loadedItems = getItems()
    setItems(loadedItems)
  }

  const getNextItemCode = () => {
    if (items.length === 0) {
      return '10001'
    }
    // Find the highest code number
    const codes = items
      .map(item => {
        const codeNum = parseInt(item.code)
        return isNaN(codeNum) ? 0 : codeNum
      })
      .filter(code => code >= 10001)
    
    if (codes.length === 0) {
      return '10001'
    }
    
    const maxCode = Math.max(...codes)
    const nextCode = maxCode + 1
    return nextCode.toString()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.name,
      code: formData.code,
      category: formData.category,
      purchasePrice: parseFloat(formData.purchasePrice),
      salePrice: parseFloat(formData.salePrice),
    }

    let updatedItems
    if (editingItem) {
      updatedItems = items.map(item => 
        item.id === editingItem.id ? newItem : item
      )
    } else {
      updatedItems = [...items, newItem]
    }

    saveItems(updatedItems)
    setItems(updatedItems)
    setShowModal(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: '',
      purchasePrice: '',
      salePrice: '',
    })
    setEditingItem(null)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      code: item.code,
      category: item.category,
      purchasePrice: item.purchasePrice.toString(),
      salePrice: item.salePrice.toString(),
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedItems = items.filter(item => item.id !== id)
      saveItems(updatedItems)
      setItems(updatedItems)
    }
  }

  const openModal = () => {
    resetForm()
    // Auto-generate item code for new items
    const nextCode = getNextItemCode()
    setFormData({
      name: '',
      code: nextCode,
      category: '',
      purchasePrice: '',
      salePrice: '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.code.toLowerCase().includes(searchLower) ||
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower)
    )
  })

  const getMovementHistory = (itemId) => {
    const purchases = getPurchases()
    const stockReturns = getStockReturns()
    const sales = getSales()
    const saleReturns = getSaleReturns()
    
    const movements = []

    // Get purchases
    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        if (item.itemId === itemId) {
          const price = parseFloat(item.price) || 0
          const quantity = parseFloat(item.quantity) || 0
          movements.push({
            date: purchase.date,
            invoiceNumber: purchase.invoiceNumber,
            quantity: quantity,
            status: 'Purchase',
            statusIcon: '🛒',
            totalPrice: quantity * price,
            type: 'purchase'
          })
        }
      })
    })

    // Get stock returns
    stockReturns.forEach(return_ => {
      return_.items.forEach(item => {
        if (item.itemId === itemId) {
          const price = parseFloat(item.price) || 0
          const quantity = parseFloat(item.quantity) || 0
          movements.push({
            date: return_.date,
            invoiceNumber: return_.returnNumber,
            quantity: -quantity, // Negative for return
            status: 'Purchase Return',
            statusIcon: '↩️',
            totalPrice: quantity * price,
            type: 'stockReturn'
          })
        }
      })
    })

    // Get sales
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.itemId === itemId) {
          const price = parseFloat(item.price) || 0
          const quantity = parseFloat(item.quantity) || 0
          movements.push({
            date: sale.date,
            invoiceNumber: sale.invoiceNumber,
            quantity: -quantity, // Negative for sale
            status: 'Sale',
            statusIcon: '💰',
            totalPrice: quantity * price,
            type: 'sale'
          })
        }
      })
    })

    // Get sale returns
    saleReturns.forEach(return_ => {
      return_.items.forEach(item => {
        if (item.itemId === itemId) {
          const price = parseFloat(item.price) || 0
          const quantity = parseFloat(item.quantity) || 0
          movements.push({
            date: return_.date,
            invoiceNumber: return_.returnNumber,
            quantity: quantity,
            status: 'Sale Return',
            statusIcon: '🔄',
            totalPrice: quantity * price,
            type: 'saleReturn'
          })
        }
      })
    })

    // Sort by date (oldest first, then newest)
    movements.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA - dateB
    })
    
    return movements
  }

  const handleMovementClick = (item) => {
    setSelectedItem(item)
    const history = getMovementHistory(item.id)
    setMovementHistory(history)
    setShowMovementModal(true)
  }

  const closeMovementModal = () => {
    setShowMovementModal(false)
    setSelectedItem(null)
    setMovementHistory([])
    setStatusFilter('all')
    setDateFromFilter('')
    setDateToFilter('')
  }

  const getFilteredMovements = () => {
    return movementHistory.filter(movement => {
      // Status filter
      const matchesStatus = statusFilter === 'all' || movement.type === statusFilter
      
      // Date range filter
      if (dateFromFilter || dateToFilter) {
        const movementDate = new Date(movement.date)
        movementDate.setHours(0, 0, 0, 0) // Reset time to start of day
        
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter)
          fromDate.setHours(0, 0, 0, 0)
          if (movementDate < fromDate) return false
        }
        
        if (dateToFilter) {
          const toDate = new Date(dateToFilter)
          toDate.setHours(23, 59, 59, 999) // Set to end of day
          if (movementDate > toDate) return false
        }
      }
      
      return matchesStatus
    })
  }

  const toggleMenu = (itemId, event) => {
    setOpenMenuId(openMenuId === itemId ? null : itemId)
  }

  const getMenuPosition = (buttonElement) => {
    if (!buttonElement) return { bottom: '100%', top: 'auto', marginBottom: '0.25rem', marginTop: 0 }
    
    const rect = buttonElement.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const spaceBelow = windowHeight - rect.bottom
    const spaceAbove = rect.top
    const menuHeight = 150 // Approximate menu height
    
    // If not enough space below but enough space above, open upward
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      return { bottom: '100%', top: 'auto', marginBottom: '0.25rem', marginTop: 0 }
    }
    // Otherwise open downward
    return { top: '100%', bottom: 'auto', marginTop: '0.25rem', marginBottom: 0 }
  }

  const handleMenuAction = (action, item) => {
    setOpenMenuId(null)
    if (action === 'movement') {
      handleMovementClick(item)
    } else if (action === 'edit') {
      handleEdit(item)
    } else if (action === 'delete') {
      handleDelete(item.id)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Items Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
          <button className="btn btn-primary" onClick={openModal} style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
            ➕ Add
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p>No items found. Add your first item to get started.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No items found matching your search.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Purchase Price</th>
                <th>Sale Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>PKR {item.purchasePrice.toFixed(2)}</td>
                  <td>PKR {item.salePrice.toFixed(2)}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          const buttonRect = e.currentTarget.getBoundingClientRect()
                          const windowHeight = window.innerHeight
                          const spaceBelow = windowHeight - buttonRect.bottom
                          const spaceAbove = buttonRect.top
                          const menuHeight = 150
                          
                          // Store position in button data attribute
                          const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > menuHeight
                          e.currentTarget.setAttribute('data-menu-up', shouldOpenUp)
                          
                          toggleMenu(item.id, e)
                        }}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '1rem',
                          minWidth: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="More options"
                      >
                        ⋮
                      </button>
                      {openMenuId === item.id && (
                        <>
                          <div 
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 998
                            }}
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            ref={(el) => {
                              if (el) {
                                const button = el.previousElementSibling?.previousElementSibling
                                if (button) {
                                  const buttonRect = button.getBoundingClientRect()
                                  const windowHeight = window.innerHeight
                                  const spaceBelow = windowHeight - buttonRect.bottom
                                  const spaceAbove = buttonRect.top
                                  const menuHeight = 150
                                  
                                  const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > menuHeight
                                  
                                  if (shouldOpenUp) {
                                    el.style.bottom = `${windowHeight - buttonRect.top}px`
                                    el.style.top = 'auto'
                                  } else {
                                    el.style.top = `${buttonRect.bottom}px`
                                    el.style.bottom = 'auto'
                                  }
                                  el.style.right = `${window.innerWidth - buttonRect.right}px`
                                }
                              }
                            }}
                            style={{
                              position: 'fixed',
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              zIndex: 999,
                              minWidth: '160px',
                              overflow: 'hidden',
                              marginTop: '0.25rem',
                              marginBottom: '0.25rem'
                            }}
                          >
                            <button
                              onClick={() => handleMenuAction('movement', item)}
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#374151',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <span>📊</span>
                              <span>Movement</span>
                            </button>
                            <button
                              onClick={() => handleMenuAction('edit', item)}
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#374151',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background-color 0.2s',
                                borderTop: '1px solid #e5e7eb'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleMenuAction('delete', item)}
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background-color 0.2s',
                                borderTop: '1px solid #e5e7eb'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Item Code *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sale Price *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMovementModal && selectedItem && (
        <div className="modal" onClick={closeMovementModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                Movement History - {selectedItem.name} ({selectedItem.code})
              </h2>
              <button className="close-btn" onClick={closeMovementModal}>×</button>
            </div>
            <div style={{ padding: '1rem 0', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Status Filter</label>
                  <select
                    className="form-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '0.5rem' }}
                  >
                    <option value="all">All Status</option>
                    <option value="purchase">Purchase</option>
                    <option value="stockReturn">Purchase Return</option>
                    <option value="sale">Sale</option>
                    <option value="saleReturn">Sale Return</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    style={{ padding: '0.5rem' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    style={{ padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {movementHistory.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">📊</div>
                  <p>No movement history found for this item.</p>
                </div>
              ) : getFilteredMovements().length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">🔍</div>
                  <p>No movements found matching the selected filters.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice Number</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredMovements().map((movement, index) => (
                        <tr key={index}>
                          <td>{new Date(movement.date).toLocaleDateString()}</td>
                          <td>{movement.invoiceNumber}</td>
                          <td style={{ 
                            fontWeight: 'bold', 
                            color: movement.quantity > 0 ? '#10b981' : '#ef4444' 
                          }}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </td>
                          <td>
                            <span style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '12px', 
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              background: movement.type === 'purchase' ? '#10b98120' : 
                                         movement.type === 'stockReturn' ? '#f59e0b20' :
                                         movement.type === 'sale' ? '#667eea20' : '#764ba220',
                              color: movement.type === 'purchase' ? '#10b981' : 
                                     movement.type === 'stockReturn' ? '#f59e0b' :
                                     movement.type === 'sale' ? '#667eea' : '#764ba2'
                            }}>
                              <span>{movement.statusIcon}</span>
                              <span>{movement.status}</span>
                            </span>
                          </td>
                          <td>PKR {movement.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="form-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={closeMovementModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Items

