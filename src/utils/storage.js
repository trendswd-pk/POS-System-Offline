// LocalStorage utility functions for POS System

export const getItems = () => {
  const items = localStorage.getItem('pos_items')
  return items ? JSON.parse(items) : []
}

export const saveItems = (items) => {
  localStorage.setItem('pos_items', JSON.stringify(items))
}

export const getPurchases = () => {
  const purchases = localStorage.getItem('pos_purchases')
  return purchases ? JSON.parse(purchases) : []
}

export const savePurchases = (purchases) => {
  localStorage.setItem('pos_purchases', JSON.stringify(purchases))
}

export const getStockReturns = () => {
  const returns = localStorage.getItem('pos_stock_returns')
  return returns ? JSON.parse(returns) : []
}

export const saveStockReturns = (returns) => {
  localStorage.setItem('pos_stock_returns', JSON.stringify(returns))
}

export const getSales = () => {
  const sales = localStorage.getItem('pos_sales')
  return sales ? JSON.parse(sales) : []
}

export const saveSales = (sales) => {
  localStorage.setItem('pos_sales', JSON.stringify(sales))
}

export const getSaleReturns = () => {
  const returns = localStorage.getItem('pos_sale_returns')
  return returns ? JSON.parse(returns) : []
}

export const saveSaleReturns = (returns) => {
  localStorage.setItem('pos_sale_returns', JSON.stringify(returns))
}

// Calculate current stock for an item
export const getCurrentStock = (itemId) => {
  const purchases = getPurchases()
  const stockReturns = getStockReturns()
  const sales = getSales()
  const saleReturns = getSaleReturns()

  let stock = 0

  // Add purchases
  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      if (item.itemId === itemId) {
        stock += item.quantity
      }
    })
  })

  // Subtract stock returns
  stockReturns.forEach(return_ => {
    return_.items.forEach(item => {
      if (item.itemId === itemId) {
        stock -= item.quantity
      }
    })
  })

  // Subtract sales
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.itemId === itemId) {
        stock -= item.quantity
      }
    })
  })

  // Add sale returns
  saleReturns.forEach(return_ => {
    return_.items.forEach(item => {
      if (item.itemId === itemId) {
        stock += item.quantity
      }
    })
  })

  return stock
}

