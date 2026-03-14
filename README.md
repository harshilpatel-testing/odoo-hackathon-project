# CoreInventory - Full Stack Inventory Management System

CoreInventory is a complete inventory management solution built with modern web technologies. 
It supports multiple users, product management, comprehensive warehousing operations (Receipts, Deliveries, Transfers, Adjustments), and a complete Stock Ledger.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, ShadCN UI, Framer Motion, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT based Auth

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `localhost:27017`

## Quick Start

### 1. Setup Backend
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure MongoDB is running locally. The backend connects to `mongodb://127.0.0.1:27017/coreinventory`.
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The API will be available at http://localhost:5000*

### 2. Setup Frontend
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The Application will be available at http://localhost:5173* (or as output in terminal)

## Default User Initialization
You can sign up directly from the web interface. Choose the "Inventory Manager" role to get full access.

The password reset functionality simulates an OTP send. When you request an OTP during the "Forgot Password" flow, check the backend console logs to see the generated OTP.

## Features Included
- **Dashboard**: High-level KPIs, low stock alerts, and charts.
- **Products**: Complete product catalog with real-time stock levels.
- **Operations - Receipts**: Incoming stock.
- **Operations - Delivery Orders**: Outgoing stock.
- **Operations - Internal Transfers**: Move items between standard or virtual locations.
- **Operations - Adjustments**: Physical vs. recorded stock gap adjustment.
- **Move History (Stock Ledger)**: Complete audit trail of all warehouse movements.
- **Secure Authentication**: Utilizing JSON Web Tokens and BCrypt password hashing.

Enjoy using CoreInventory!
