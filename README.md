# POS System

Complete Point of Sale (POS) System for Shops with full inventory management.

## Features

- 📦 **Items Management** - Add, edit, and delete items with details like code, name, category, unit, purchase price, and sale price
- 🛒 **Stock Purchase** - Record stock purchases from suppliers with invoice tracking
- ↩️ **Stock Return** - Return purchased stock to suppliers
- 💰 **Sale** - Record sales transactions with customer details
- 🔄 **Sale Return** - Handle customer returns
- 📊 **Closing Stock** - View current available stock for all items with real-time calculations

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

1. **Items Page**: Start by adding items to your inventory
2. **Stock Purchase**: Record purchases to increase stock
3. **Stock Return**: Return items to suppliers if needed
4. **Sale**: Record sales transactions (stock is automatically deducted)
5. **Sale Return**: Handle customer returns (stock is automatically added back)
6. **Closing Stock**: View current stock levels for all items

## Data Storage

All data is stored in browser's localStorage, so it persists between sessions.

## Technology Stack

- React 18
- React Router DOM
- Vite
- Modern CSS with responsive design
