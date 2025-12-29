import React, { useState, useEffect } from 'react'
import { getUsers, saveUsers, defaultPermissions, getCurrentUser } from '../utils/storage'
import '../App.css'

function Users() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    permissions: { ...defaultPermissions }
  })

  useEffect(() => {
    loadUsers()
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
      setUsers([adminUser])
    }
  }, [])

  const loadUsers = () => {
    const loadedUsers = getUsers()
    setUsers(loadedUsers)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password || !formData.fullName) {
      alert('Please fill all required fields')
      return
    }

    // Check if username already exists (for new users)
    if (!editingUser) {
      const existingUser = users.find(u => u.username === formData.username)
      if (existingUser) {
        alert('Username already exists. Please choose a different username.')
        return
      }
    } else {
      // For editing, check if username exists for other users
      const existingUser = users.find(u => u.username === formData.username && u.id !== editingUser.id)
      if (existingUser) {
        alert('Username already exists. Please choose a different username.')
        return
      }
    }

    const isAdmin = currentUser && currentUser.username === 'admin'
    
    const newUser = {
      id: editingUser ? editingUser.id : Date.now().toString(),
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName,
      // Only admin can change permissions, otherwise keep existing permissions
      permissions: isAdmin ? formData.permissions : (editingUser ? editingUser.permissions : formData.permissions),
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    let updatedUsers
    if (editingUser) {
      updatedUsers = users.map(user => 
        user.id === editingUser.id ? newUser : user
      )
    } else {
      updatedUsers = [...users, newUser]
    }

    saveUsers(updatedUsers)
    setUsers(updatedUsers)
    setShowModal(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      permissions: { ...defaultPermissions }
    })
    setEditingUser(null)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    const isAdmin = currentUser && currentUser.username === 'admin'
    setFormData({
      username: user.username,
      password: '', // Don't show password
      fullName: user.fullName,
      permissions: { ...user.permissions } // Always load user's permissions, but only admin can edit them
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== id)
      saveUsers(updatedUsers)
      setUsers(updatedUsers)
    }
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handlePermissionChange = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission]
      }
    })
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.fullName.toLowerCase().includes(searchLower)
    )
  })

  const permissionLabels = {
    items: 'Items Management',
    stockPurchase: 'Stock Purchase',
    stockReturn: 'Stock Return',
    sale: 'Sale',
    saleReturn: 'Sale Return',
    closingStock: 'Closing Stock',
    users: 'Users Management',
  }

  const isAdmin = currentUser && currentUser.username === 'admin'

  return (
    <div className="page-container">
      {!isAdmin && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
          <span>You have read-only access. Only admin can edit users.</span>
        </div>
      )}
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        {currentUser && currentUser.username === 'admin' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by username or name..."
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
              ➕ Add User
            </button>
          </div>
        )}
        {currentUser && currentUser.username !== 'admin' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by username or name..."
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
        )}
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>No users found. Add your first user to get started.</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No users found matching your search.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table" style={{ 
            opacity: currentUser && currentUser.username !== 'admin' ? 0.7 : 1,
            pointerEvents: currentUser && currentUser.username !== 'admin' ? 'none' : 'auto'
          }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Permissions</th>
                <th>Created At</th>
                {currentUser && currentUser.username === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ cursor: currentUser && currentUser.username !== 'admin' ? 'not-allowed' : 'default' }}>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {Object.entries(user.permissions).map(([key, value]) => 
                        value && (
                          <span
                            key={key}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              background: '#667eea20',
                              color: '#667eea'
                            }}
                          >
                            {permissionLabels[key]}
                          </span>
                        )
                      )}
                    </div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  {currentUser && currentUser.username === 'admin' && (
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(user)}
                        style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(user.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Permissions
                  {currentUser && currentUser.username !== 'admin' && (
                    <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                      (Only admin can edit permissions)
                    </span>
                  )}
                </label>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  opacity: currentUser && currentUser.username !== 'admin' ? 0.6 : 1,
                  pointerEvents: currentUser && currentUser.username !== 'admin' ? 'none' : 'auto'
                }}>
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: currentUser && currentUser.username === 'admin' ? 'pointer' : 'not-allowed',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (currentUser && currentUser.username === 'admin') {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions[key]}
                        onChange={() => handlePermissionChange(key)}
                        disabled={currentUser && currentUser.username !== 'admin'}
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          cursor: currentUser && currentUser.username === 'admin' ? 'pointer' : 'not-allowed'
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update' : 'Add'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users

