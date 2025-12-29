import React, { useState, useEffect } from 'react'
import { getItems, getSales, saveSales, getCurrentStock } from '../utils/storage'
import '../App.css'

function Sale() {
  const [items, setItems] = useState([])
  const [sales, setSales] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [saleItems, setSaleItems] = useState([])
  const [formData, setFormData] = useState({
    customerName: '',
    invoiceNumber: '',
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
  const [viewingSale, setViewingSale] = useState(null)
  const [editingSale, setEditingSale] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setItems(getItems())
    setSales(getSales())
  }

  const generateUniqueInvoiceNumber = () => {
    // Always get fresh data from storage
    const currentSales = getSales()
    const existingNumbers = new Set()
    
    // Collect all existing invoice numbers
    currentSales.forEach(sale => {
      const match = sale.invoiceNumber.match(/^SV-(\d+)$/)
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
    
    return `SV-${randomNumber.toString().padStart(5, '0')}`
  }

  const handleAddItem = () => {
    if (!selectedItem.itemId || !selectedItem.quantity || !selectedItem.price) {
      alert('Please fill all fields')
      return
    }

    const item = items.find(i => i.id === selectedItem.itemId)
    const currentStock = getCurrentStock(selectedItem.itemId)
    const requestedQty = parseInt(selectedItem.quantity)
    const existingItemIndex = saleItems.findIndex(s => s.itemId === selectedItem.itemId)
    
    // Calculate total quantity after adding
    const totalQuantity = existingItemIndex !== -1 
      ? saleItems[existingItemIndex].quantity + requestedQty 
      : requestedQty

    if (totalQuantity > currentStock) {
      alert(`Insufficient stock! Available: ${currentStock}`)
      return
    }

    if (existingItemIndex !== -1) {
      // Item already exists, update quantity
      const updatedItems = [...saleItems]
      const existingItem = updatedItems[existingItemIndex]
      const newQuantity = existingItem.quantity + requestedQty
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: newQuantity * existingItem.price,
      }
      setSaleItems(updatedItems)
    } else {
      // New item, add it
      const newSaleItem = {
        itemId: selectedItem.itemId,
        itemName: item.name,
        itemCode: item.code,
        quantity: requestedQty,
        price: parseFloat(selectedItem.price),
        total: requestedQty * parseFloat(selectedItem.price),
      }
      setSaleItems([...saleItems, newSaleItem])
    }
    
    setSelectedItem({ itemId: '', quantity: '', price: '' })
    setItemSearch('')
  }

  const handleRemoveItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const handleEditItem = (index) => {
    const item = saleItems[index]
    setEditingIndex(index)
    setEditValues({ quantity: item.quantity.toString(), price: item.price.toString() })
  }

  const handleSaveEdit = (index) => {
    const updatedItems = [...saleItems]
    const newQuantity = parseInt(editValues.quantity)
    const newPrice = parseFloat(editValues.price)
    const currentStock = getCurrentStock(updatedItems[index].itemId)
    
    if (newQuantity > currentStock) {
      alert(`Insufficient stock! Available: ${currentStock}`)
      return
    }
    
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity,
      price: newPrice,
      total: newQuantity * newPrice,
    }
    setSaleItems(updatedItems)
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (saleItems.length === 0) {
      alert('Please add at least one item')
      return
    }

    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
    
    if (editingSale) {
      // Update existing sale
      const updatedSales = sales.map(s => 
        s.id === editingSale.id 
          ? {
              ...s,
              customerName: formData.customerName,
              date: formData.date,
              narration: formData.narration,
              items: saleItems,
              totalAmount: totalAmount,
            }
          : s
      )
      saveSales(updatedSales)
      setEditingSale(null)
    } else {
      // Generate unique invoice number on save for new sale
      const invoiceNumber = generateUniqueInvoiceNumber()
      const newSale = {
        id: Date.now().toString(),
        customerName: formData.customerName,
        invoiceNumber: invoiceNumber,
        date: formData.date,
        narration: formData.narration,
        items: saleItems,
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
      }
      const updatedSales = [newSale, ...sales]
      saveSales(updatedSales)
    }
    
    loadData()
    resetForm()
    setShowModal(false)
  }

  const handleViewSale = (sale) => {
    setViewingSale(sale)
    setOpenMenuId(null)
  }

  const handlePrintSale = (sale) => {
    setOpenMenuId(null)
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale Invoice - ${sale.invoiceNumber}</title>
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
            <h1>Sale Invoice</h1>
            <h2>${sale.invoiceNumber}</h2>
          </div>
          <div class="invoice-info">
            <div class="info-section">
              <h3>Invoice Details</h3>
              <p><strong>Date:</strong> ${new Date(sale.date).toLocaleDateString()}</p>
              <p><strong>Customer:</strong> ${sale.customerName || 'N/A'}</p>
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
              ${sale.items.map(item => `
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
                <td><strong>PKR ${sale.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
          ${sale.narration ? `
            <div class="narration">
              <strong>Narration:</strong> ${sale.narration}
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

  const handleEditSale = (sale) => {
    setEditingSale(sale)
    setFormData({
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      date: sale.date,
      narration: sale.narration || '',
    })
    setSaleItems(sale.items.map(item => ({
      ...item,
      total: item.quantity * item.price
    })))
    setShowModal(true)
    setOpenMenuId(null)
  }

  const toggleMenu = (saleId, e) => {
    if (e) {
      const buttonRect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const spaceBelow = windowHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      const menuHeight = 150
      
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > menuHeight
      e.currentTarget.setAttribute('data-menu-up', shouldOpenUp)
    }
    setOpenMenuId(openMenuId === saleId ? null : saleId)
  }

  const resetForm = () => {
    setFormData({
      customerName: 'Walk in Customer',
      invoiceNumber: '', // Will be generated on save
      date: new Date().toISOString().split('T')[0],
      narration: '',
    })
    setSaleItems([])
    setSelectedItem({ itemId: '', quantity: '', price: '' })
    setItemSearch('')
    setShowItemDropdown(false)
    setEditingIndex(null)
    setEditValues({ quantity: '', price: '' })
    setEditingSale(null)
  }

  const getItemPrice = (itemId) => {
    const item = items.find(i => i.id === itemId)
    return item ? item.salePrice : 0
  }

  const handleItemSelect = (itemId) => {
    const item = items.find(i => i.id === itemId)
    const currentStock = getCurrentStock(itemId)
    setSelectedItem({
      ...selectedItem,
      itemId: itemId,
      quantity: itemId ? 1 : '',
      price: getItemPrice(itemId).toString(),
    })
    setItemSearch(item ? item.name : '')
    setShowItemDropdown(false)
    if (currentStock === 0) {
      alert('This item is out of stock!')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && selectedItem.itemId && selectedItem.quantity && selectedItem.price) {
      e.preventDefault()
      handleAddItem()
    }
  }

  const filteredItems = items.filter(item => {
    const stock = getCurrentStock(item.id)
    if (stock <= 0) return false // Only show items with stock > 0
    
    if (!itemSearch.trim()) {
      return true // Show all items when search is empty
    }
    const searchLower = itemSearch.toLowerCase()
    return item.code.toLowerCase().includes(searchLower) || 
           item.name.toLowerCase().includes(searchLower)
  })

  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase()
    return (
      sale.invoiceNumber.toLowerCase().includes(searchLower) ||
      sale.customerName.toLowerCase().includes(searchLower) ||
      sale.date.toLowerCase().includes(searchLower) ||
      sale.items.some(item => 
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower)
      )
    )
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Sale</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by invoice, customer, date, or items..."
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
            invoiceNumber: '', // Will be generated on save
            date: new Date().toISOString().split('T')[0],
            narration: '',
          })
          setSaleItems([])
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

      {sales.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <p>No sales recorded yet. Create your first sale.</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No sales found matching your search.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice Number</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>{sale.invoiceNumber}</td>
                  <td>{sale.customerName}</td>
                  <td>PKR {sale.totalAmount.toFixed(2)}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => toggleMenu(sale.id, e)}
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
                      {openMenuId === sale.id && (
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
                              onClick={() => handleViewSale(sale)}
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
                              onClick={() => handleEditSale(sale)}
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
                              onClick={() => handlePrintSale(sale)}
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
              <h2 className="modal-title">{editingSale ? 'Edit Sale' : 'New Sale'}</h2>
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
                        {filteredItems.map((item) => {
                          const stock = getCurrentStock(item.id)
                          return (
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
                              <strong>{item.code}</strong> - {item.name} <span style={{ color: '#666' }}>({stock})</span>
                            </div>
                          )
                        })}
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

                {saleItems.length > 0 && (
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
                        {saleItems.map((item, index) => (
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
                      Total: PKR {saleItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
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
                  {editingSale ? 'Update Sale' : 'Save Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSale && (
        <div className="modal" onClick={() => setViewingSale(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Sale Invoice - {viewingSale.invoiceNumber}</h2>
              <button className="close-btn" onClick={() => setViewingSale(null)}>×</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>Date:</strong> {new Date(viewingSale.date).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Customer:</strong> {viewingSale.customerName}
                  </div>
                </div>
                {viewingSale.narration && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Narration:</strong> {viewingSale.narration}
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
                    {viewingSale.items.map((item, idx) => (
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
                      <td>PKR {viewingSale.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => handlePrintSale(viewingSale)}>
                🖨️ Print
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingSale(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sale

