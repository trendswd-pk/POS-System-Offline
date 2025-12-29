import React, { useState, useEffect } from 'react'
import { getItems, getSaleReturns, saveSaleReturns, getSales } from '../utils/storage'
import '../App.css'

function SaleReturn() {
  const [items, setItems] = useState([])
  const [saleReturns, setSaleReturns] = useState([])
  const [sales, setSales] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [returnItems, setReturnItems] = useState([])
  const [formData, setFormData] = useState({
    customerName: '',
    returnNumber: '',
    date: new Date().toISOString().split('T')[0],
    narration: '',
  })
  const [selectedItem, setSelectedItem] = useState({
    itemId: '',
    quantity: '',
    price: '',
  })
  const [itemSearch, setItemSearch] = useState('')
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValues, setEditValues] = useState({ quantity: '', price: '' })
  const [openMenuId, setOpenMenuId] = useState(null)
  const [viewingReturn, setViewingReturn] = useState(null)
  const [editingReturn, setEditingReturn] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setItems(getItems())
    setSaleReturns(getSaleReturns())
    setSales(getSales())
  }

  const generateUniqueReturnNumber = () => {
    // Always get fresh data from storage
    const currentReturns = getSaleReturns()
    const existingNumbers = new Set()
    
    // Collect all existing return numbers
    currentReturns.forEach(return_ => {
      const match = return_.returnNumber.match(/^SRV-(\d+)$/)
      if (match) {
        existingNumbers.add(match[1])
      }
    })
    
    // Generate random 5-digit number (10001 to 99999)
    let randomNumber
    let attempts = 0
    do {
      randomNumber = Math.floor(Math.random() * (99999 - 10001 + 1)) + 10001
      attempts++
      if (attempts > 1000) {
        // Fallback to timestamp-based if too many attempts
        randomNumber = parseInt(Date.now().toString().slice(-5))
        if (randomNumber < 10001) randomNumber += 10001
      }
    } while (existingNumbers.has(randomNumber.toString()))
    
    return `SRV-${randomNumber.toString().padStart(5, '0')}`
  }

  const getItemPrice = (itemId) => {
    const item = items.find(i => i.id === itemId)
    return item ? item.salePrice : 0
  }

  const handleItemSelect = (itemId) => {
    const item = items.find(i => i.id === itemId)
    setSelectedItem({
      ...selectedItem,
      itemId: itemId,
      quantity: itemId ? 1 : '',
      price: getItemPrice(itemId).toString(),
    })
    setItemSearch(item ? item.name : '')
    setShowItemDropdown(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && selectedItem.itemId && selectedItem.quantity && selectedItem.price) {
      e.preventDefault()
      handleAddItem()
    }
  }

  const filteredItems = items.filter(item => {
    if (!itemSearch.trim()) {
      return true // Show all items when search is empty
    }
    const searchLower = itemSearch.toLowerCase()
    return item.code.toLowerCase().includes(searchLower) || 
           item.name.toLowerCase().includes(searchLower)
  })

  const handleAddItem = () => {
    if (!selectedItem.itemId || !selectedItem.quantity || !selectedItem.price) {
      alert('Please fill all required fields')
      return
    }

    const item = items.find(i => i.id === selectedItem.itemId)
    const existingItemIndex = returnItems.findIndex(r => r.itemId === selectedItem.itemId)
    
    if (existingItemIndex !== -1) {
      // Item already exists, update quantity
      const updatedItems = [...returnItems]
      const existingItem = updatedItems[existingItemIndex]
      const newQuantity = existingItem.quantity + parseInt(selectedItem.quantity)
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: newQuantity * existingItem.price,
      }
      setReturnItems(updatedItems)
    } else {
      // New item, add it
      const newReturnItem = {
        itemId: selectedItem.itemId,
        itemName: item.name,
        itemCode: item.code,
        quantity: parseInt(selectedItem.quantity),
        price: parseFloat(selectedItem.price),
        total: parseFloat(selectedItem.quantity) * parseFloat(selectedItem.price),
      }
      setReturnItems([...returnItems, newReturnItem])
    }
    
    setSelectedItem({ itemId: '', quantity: '', price: '' })
    setItemSearch('')
  }

  const handleRemoveItem = (index) => {
    setReturnItems(returnItems.filter((_, i) => i !== index))
  }

  const handleEditItem = (index) => {
    const item = returnItems[index]
    setEditingIndex(index)
    setEditValues({ quantity: item.quantity.toString(), price: item.price.toString() })
  }

  const handleSaveEdit = (index) => {
    const updatedItems = [...returnItems]
    const newQuantity = parseInt(editValues.quantity)
    const newPrice = parseFloat(editValues.price)
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity,
      price: newPrice,
      total: newQuantity * newPrice,
    }
    setReturnItems(updatedItems)
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (returnItems.length === 0) {
      alert('Please add at least one item')
      return
    }

    const totalAmount = returnItems.reduce((sum, item) => sum + item.total, 0)
    
    if (editingReturn) {
      // Update existing return
      const updatedReturns = saleReturns.map(r => 
        r.id === editingReturn.id 
          ? {
              ...r,
              customerName: formData.customerName,
              date: formData.date,
              narration: formData.narration,
              items: returnItems,
              totalAmount: totalAmount,
            }
          : r
      )
      saveSaleReturns(updatedReturns)
      setEditingReturn(null)
    } else {
      // Generate unique return number on save for new return
      const returnNumber = generateUniqueReturnNumber()
      const newReturn = {
        id: Date.now().toString(),
        customerName: formData.customerName,
        returnNumber: returnNumber,
        date: formData.date,
        narration: formData.narration,
        items: returnItems,
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
      }
      const updatedReturns = [newReturn, ...saleReturns]
      saveSaleReturns(updatedReturns)
    }
    
    loadData()
    resetForm()
    setShowModal(false)
  }

  const handleViewReturn = (return_) => {
    setViewingReturn(return_)
    setOpenMenuId(null)
  }

  const handlePrintReturn = (return_) => {
    setOpenMenuId(null)
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale Return - ${return_.returnNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .info-section {
              flex: 1;
            }
            .info-section h3 {
              margin-top: 0;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .narration {
              margin-top: 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sale Return</h1>
            <h2>${return_.returnNumber}</h2>
          </div>
          <div class="invoice-info">
            <div class="info-section">
              <h3>Return Details</h3>
              <p><strong>Date:</strong> ${new Date(return_.date).toLocaleDateString()}</p>
              <p><strong>Customer:</strong> ${return_.customerName || 'N/A'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${return_.items.map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.quantity}</td>
                  <td>PKR ${(item.price || 0).toFixed(2)}</td>
                  <td>PKR ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>Total Amount:</strong></td>
                <td><strong>PKR ${(return_.totalAmount || 0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
          ${return_.narration ? `
            <div class="narration">
              <strong>Narration:</strong> ${return_.narration}
            </div>
          ` : ''}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const handleEditReturn = (return_) => {
    setEditingReturn(return_)
    setFormData({
      returnNumber: return_.returnNumber,
      customerName: return_.customerName,
      date: return_.date,
      narration: return_.narration || '',
    })
    setReturnItems(return_.items.map(item => ({
      ...item,
      total: item.quantity * item.price
    })))
    setShowModal(true)
    setOpenMenuId(null)
  }

  const toggleMenu = (returnId, e) => {
    if (e) {
      const buttonRect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const spaceBelow = windowHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      const menuHeight = 150
      
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > menuHeight
      e.currentTarget.setAttribute('data-menu-up', shouldOpenUp)
    }
    setOpenMenuId(openMenuId === returnId ? null : returnId)
  }

  const resetForm = () => {
    setFormData({
      customerName: 'Walk in Customer',
      returnNumber: '', // Will be generated on save
      date: new Date().toISOString().split('T')[0],
      narration: '',
    })
    setReturnItems([])
    setSelectedItem({ itemId: '', quantity: '', price: '' })
    setItemSearch('')
    setShowItemDropdown(false)
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
    setEditingReturn(null)
  }

  const filteredReturns = saleReturns.filter(return_ => {
    const searchLower = searchTerm.toLowerCase()
    return (
      return_.returnNumber.toLowerCase().includes(searchLower) ||
      return_.customerName.toLowerCase().includes(searchLower) ||
      return_.date.toLowerCase().includes(searchLower) ||
      return_.items.some(item => 
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower)
      )
    )
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Sale Return</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by return number, customer, date, or items..."
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
          <button className="btn btn-primary" style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }} onClick={() => {
          setFormData({
            customerName: 'Walk in Customer',
            returnNumber: '', // Will be generated on save
            date: new Date().toISOString().split('T')[0],
            narration: '',
          })
          setReturnItems([])
          setSelectedItem({ itemId: '', quantity: '', price: '' })
          setItemSearch('')
          setShowItemDropdown(false)
          setEditingIndex(null)
          setEditValues({ quantity: '', price: '' })
          setShowModal(true)
        }}>
          ➕ New
        </button>
        </div>
      </div>

      {saleReturns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔄</div>
          <p>No sale returns recorded yet.</p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No returns found matching your search.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Return Number</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((return_) => (
                <tr key={return_.id}>
                  <td>{new Date(return_.date).toLocaleDateString()}</td>
                  <td>{return_.returnNumber}</td>
                  <td>{return_.customerName}</td>
                  <td>PKR {return_.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => toggleMenu(return_.id, e)}
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
                      {openMenuId === return_.id && (
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
                              onClick={() => handleViewReturn(return_)}
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
                              <span>👁️</span>
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleEditReturn(return_)}
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
                              onClick={() => handlePrintReturn(return_)}
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
                              <span>🖨️</span>
                              <span>Print</span>
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
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">New Sale Return</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Note / Narration</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  placeholder="Add any notes or narration here..."
                />
              </div>

              <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add Items to Return</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search and select item..."
                      value={itemSearch}
                      onChange={(e) => {
                        setItemSearch(e.target.value)
                        setShowItemDropdown(true)
                        if (!e.target.value) {
                          setSelectedItem({ ...selectedItem, itemId: '', quantity: '', price: '' })
                        }
                      }}
                      onFocus={() => setShowItemDropdown(true)}
                      onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                      onKeyPress={handleKeyPress}
                    />
                    {showItemDropdown && filteredItems.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemSelect(item.id)}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <strong>{item.code}</strong> - {item.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Quantity"
                    value={selectedItem.quantity}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || (!isNaN(val) && parseInt(val) >= 0)) {
                        setSelectedItem({ ...selectedItem, quantity: val === '' ? '' : parseInt(val) || '' })
                      }
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Price"
                    value={selectedItem.price}
                    onChange={(e) => setSelectedItem({ ...selectedItem, price: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleAddItem}
                  >
                    Add
                  </button>
                </div>

                {returnItems.length > 0 && (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItems.map((item, index) => (
                          <tr key={index}>
                            <td>{item.itemName}</td>
                            <td>
                              {editingIndex === index ? (
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  className="form-input"
                                  style={{ width: '80px', padding: '0.25rem' }}
                                  value={editValues.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (val === '' || (!isNaN(val) && parseInt(val) >= 0)) {
                                      setEditValues({ ...editValues, quantity: val === '' ? '' : parseInt(val) || '' })
                                    }
                                  }}
                                />
                              ) : (
                                item.quantity
                              )}
                            </td>
                            <td>
                              {editingIndex === index ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-input"
                                  style={{ width: '100px', padding: '0.25rem' }}
                                  value={editValues.price}
                                  onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                                />
                              ) : (
                                `PKR ${item.price.toFixed(2)}`
                              )}
                            </td>
                            <td>PKR {editingIndex === index ? (parseInt(editValues.quantity || 0) * parseFloat(editValues.price || 0)).toFixed(2) : item.total.toFixed(2)}</td>
                            <td>
                              {editingIndex === index ? (
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => handleSaveEdit(index)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => handleEditItem(index)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => handleRemoveItem(index)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Total: PKR {returnItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Clear
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReturn ? 'Update Return' : 'Save Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingReturn && (
        <div className="modal" onClick={() => setViewingReturn(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Sale Return - {viewingReturn.returnNumber}</h2>
              <button className="close-btn" onClick={() => setViewingReturn(null)}>×</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>Date:</strong> {new Date(viewingReturn.date).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Customer:</strong> {viewingReturn.customerName}
                  </div>
                </div>
                {viewingReturn.narration && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Narration:</strong> {viewingReturn.narration}
                  </div>
                )}
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingReturn.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.itemName}</td>
                        <td>{item.quantity}</td>
                        <td>PKR {item.price?.toFixed(2) || '0.00'}</td>
                        <td>PKR {((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid #e5e7eb' }}>
                      <td colSpan="3" style={{ textAlign: 'right' }}>Total Amount:</td>
                      <td>PKR {viewingReturn.totalAmount?.toFixed(2) || '0.00'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => handlePrintReturn(viewingReturn)}>
                🖨️ Print
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingReturn(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SaleReturn

