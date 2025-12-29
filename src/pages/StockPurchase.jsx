import React, { useState, useEffect } from 'react'
import { getItems, getPurchases, savePurchases } from '../utils/storage'
import '../App.css'

function StockPurchase() {
  const [items, setItems] = useState([])
  const [purchases, setPurchases] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [purchaseItems, setPurchaseItems] = useState([])
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierName: 'Random',
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
  const [viewingPurchase, setViewingPurchase] = useState(null)
  const [editingPurchase, setEditingPurchase] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setItems(getItems())
    setPurchases(getPurchases())
  }

  const generateUniqueInvoiceNumber = () => {
    // Always get fresh data from storage
    const currentPurchases = getPurchases()
    const existingNumbers = new Set()
    
    // Collect all existing invoice numbers
    currentPurchases.forEach(purchase => {
      const match = purchase.invoiceNumber.match(/^PRC-(\d+)$/)
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
    
    return `PRC-${randomNumber.toString().padStart(5, '0')}`
  }

  const handleAddItem = () => {
    if (!selectedItem.itemId || !selectedItem.quantity || !selectedItem.price) {
      alert('Please fill all fields')
      return
    }

    const item = items.find(i => i.id === selectedItem.itemId)
    const existingItemIndex = purchaseItems.findIndex(p => p.itemId === selectedItem.itemId)
    
    if (existingItemIndex !== -1) {
      // Item already exists, update quantity
      const updatedItems = [...purchaseItems]
      const existingItem = updatedItems[existingItemIndex]
      const newQuantity = existingItem.quantity + parseInt(selectedItem.quantity)
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: newQuantity * existingItem.price,
      }
      setPurchaseItems(updatedItems)
    } else {
      // New item, add it
      const newPurchaseItem = {
        itemId: selectedItem.itemId,
        itemName: item.name,
        itemCode: item.code,
        quantity: parseInt(selectedItem.quantity),
        price: parseFloat(selectedItem.price),
        total: parseFloat(selectedItem.quantity) * parseFloat(selectedItem.price),
      }
      setPurchaseItems([...purchaseItems, newPurchaseItem])
    }
    
    setSelectedItem({ itemId: '', quantity: '', price: '' })
    setItemSearch('')
  }

  const handleRemoveItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const handleEditItem = (index) => {
    const item = purchaseItems[index]
    setEditingIndex(index)
    setEditValues({ quantity: item.quantity.toString(), price: item.price.toString() })
  }

  const handleSaveEdit = (index) => {
    const updatedItems = [...purchaseItems]
    const newQuantity = parseInt(editValues.quantity)
    const newPrice = parseFloat(editValues.price)
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity,
      price: newPrice,
      total: newQuantity * newPrice,
    }
    setPurchaseItems(updatedItems)
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (purchaseItems.length === 0) {
      alert('Please add at least one item')
      return
    }

    const totalAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0)
    
    if (editingPurchase) {
      // Update existing purchase
      const updatedPurchases = purchases.map(p => 
        p.id === editingPurchase.id 
          ? {
              ...p,
              supplierName: formData.supplierName,
              date: formData.date,
              narration: formData.narration,
              items: purchaseItems,
              totalAmount: totalAmount,
            }
          : p
      )
      savePurchases(updatedPurchases)
      setEditingPurchase(null)
    } else {
      // Generate unique invoice number on save for new purchase
      const invoiceNumber = generateUniqueInvoiceNumber()
      const newPurchase = {
        id: Date.now().toString(),
        invoiceNumber: invoiceNumber,
        supplierName: formData.supplierName,
        date: formData.date,
        narration: formData.narration,
        items: purchaseItems,
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
      }
      const updatedPurchases = [newPurchase, ...purchases]
      savePurchases(updatedPurchases)
    }
    
    loadData()
    resetForm()
    setShowModal(false)
  }

  const handleViewPurchase = (purchase) => {
    setViewingPurchase(purchase)
    setOpenMenuId(null)
  }

  const handlePrintPurchase = (purchase) => {
    setOpenMenuId(null)
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Invoice - ${purchase.invoiceNumber}</title>
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
            <h1>Purchase Invoice</h1>
            <h2>${purchase.invoiceNumber}</h2>
          </div>
          <div class="invoice-info">
            <div class="info-section">
              <h3>Invoice Details</h3>
              <p><strong>Date:</strong> ${new Date(purchase.date).toLocaleDateString()}</p>
              <p><strong>Supplier:</strong> ${purchase.supplierName || 'N/A'}</p>
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
              ${purchase.items.map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.quantity}</td>
                  <td>PKR ${item.price.toFixed(2)}</td>
                  <td>PKR ${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>Total Amount:</strong></td>
                <td><strong>PKR ${purchase.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
          ${purchase.narration ? `
            <div class="narration">
              <strong>Narration:</strong> ${purchase.narration}
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

  const handleEditPurchase = (purchase) => {
    setEditingPurchase(purchase)
    setFormData({
      invoiceNumber: purchase.invoiceNumber,
      supplierName: purchase.supplierName,
      date: purchase.date,
      narration: purchase.narration || '',
    })
    setPurchaseItems(purchase.items.map(item => ({
      ...item,
      total: item.quantity * item.price
    })))
    setShowModal(true)
    setOpenMenuId(null)
  }

  const toggleMenu = (purchaseId, e) => {
    if (e) {
      const buttonRect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const spaceBelow = windowHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      const menuHeight = 150
      
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > menuHeight
      e.currentTarget.setAttribute('data-menu-up', shouldOpenUp)
    }
    setOpenMenuId(openMenuId === purchaseId ? null : purchaseId)
  }

  const resetForm = () => {
    setFormData({
      invoiceNumber: '', // Will be generated on save
      supplierName: 'Random',
      date: new Date().toISOString().split('T')[0],
      narration: '',
    })
    setPurchaseItems([])
    setSelectedItem({ itemId: '', quantity: '', price: '' })
    setItemSearch('')
    setShowItemDropdown(false)
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
    setEditingPurchase(null)
  }

  const getItemPrice = (itemId) => {
    const item = items.find(i => i.id === itemId)
    return item ? item.purchasePrice : 0
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

  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchTerm.toLowerCase()
    return (
      purchase.invoiceNumber.toLowerCase().includes(searchLower) ||
      purchase.supplierName.toLowerCase().includes(searchLower) ||
      purchase.date.toLowerCase().includes(searchLower) ||
      purchase.items.some(item => 
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower)
      )
    )
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Stock Purchase</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by invoice, supplier, date, or items..."
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
            invoiceNumber: '', // Will be generated on save
            supplierName: 'Random',
            date: new Date().toISOString().split('T')[0],
            narration: '',
          })
          setPurchaseItems([])
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

      {purchases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p>No purchases recorded yet. Create your first purchase.</p>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No purchases found matching your search.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice Number</th>
                <th>Supplier Name</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{new Date(purchase.date).toLocaleDateString()}</td>
                  <td>{purchase.invoiceNumber}</td>
                  <td>{purchase.supplierName}</td>
                  <td>PKR {purchase.totalAmount.toFixed(2)}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => toggleMenu(purchase.id, e)}
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
                      {openMenuId === purchase.id && (
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
                              onClick={() => handleViewPurchase(purchase)}
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
                              onClick={() => handleEditPurchase(purchase)}
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
                              onClick={() => handlePrintPurchase(purchase)}
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
              <h2 className="modal-title">{editingPurchase ? 'Edit Stock Purchase' : 'New Stock Purchase'}</h2>
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
                  <label className="form-label">Supplier Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Narration / Note</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  placeholder="Add any notes or narration here..."
                />
              </div>

              <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add Items</h3>
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
                      onFocus={() => {
                        setShowItemDropdown(true)
                        if (!itemSearch) {
                          // Show all items when focused and search is empty
                        }
                      }}
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

                {purchaseItems.length > 0 && (
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
                        {purchaseItems.map((item, index) => (
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
                            <td>PKR {editingIndex === index ? (parseFloat(editValues.quantity || 0) * parseFloat(editValues.price || 0)).toFixed(2) : item.total.toFixed(2)}</td>
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
                      Total: PKR {purchaseItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
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
                  {editingPurchase ? 'Update Purchase' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingPurchase && (
        <div className="modal" onClick={() => setViewingPurchase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Purchase Invoice - {viewingPurchase.invoiceNumber}</h2>
              <button className="close-btn" onClick={() => setViewingPurchase(null)}>×</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>Date:</strong> {new Date(viewingPurchase.date).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Supplier:</strong> {viewingPurchase.supplierName}
                  </div>
                </div>
                {viewingPurchase.narration && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Narration:</strong> {viewingPurchase.narration}
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
                    {viewingPurchase.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.itemName}</td>
                        <td>{item.quantity}</td>
                        <td>PKR {item.price.toFixed(2)}</td>
                        <td>PKR {(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid #e5e7eb' }}>
                      <td colSpan="3" style={{ textAlign: 'right' }}>Total Amount:</td>
                      <td>PKR {viewingPurchase.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => handlePrintPurchase(viewingPurchase)}>
                🖨️ Print
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingPurchase(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockPurchase

