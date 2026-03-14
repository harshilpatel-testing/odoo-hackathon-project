import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Transfers from './pages/Transfers';
import Adjustments from './pages/Adjustments';
import Ledger from './pages/Ledger';

import Warehouses from './pages/Warehouses';
import UsersManagement from './pages/UsersManagement';
import Categories from './pages/Categories';
import StockAvailability from './pages/StockAvailability';
import ReorderingRules from './pages/ReorderingRules';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const ManagerRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'Inventory Manager' ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />

            <Route path="products" element={<ManagerRoute><Products /></ManagerRoute>} />
            <Route path="products/stock" element={<StockAvailability />} />
            <Route path="products/categories" element={<ManagerRoute><Categories /></ManagerRoute>} />
            <Route path="products/rules" element={<ManagerRoute><ReorderingRules /></ManagerRoute>} />

            <Route path="operations/receipts" element={<Receipts />} />
            <Route path="operations/deliveries" element={<Deliveries />} />
            <Route path="operations/transfers" element={<Transfers />} />
            <Route path="operations/adjustments" element={<Adjustments />} />
            <Route path="operations/history" element={<Ledger />} />

            <Route path="settings/warehouses" element={<ManagerRoute><Warehouses /></ManagerRoute>} />
            <Route path="settings/users" element={<ManagerRoute><UsersManagement /></ManagerRoute>} />

            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
