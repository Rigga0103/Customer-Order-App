import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PlaceOrder from './pages/PlaceOrder';
import MyOrders from './pages/MyOrders';
import Schemes from './pages/Schemes';
import Complaints from './pages/Complaints';
import NewProducts from './pages/NewProducts';
import CustomerOrder from './pages/CustomerOrder';
import AllProducts from './pages/AllProducts';
import CustomerDetails from './pages/CustomerDetails';
import PurchaseHistory from './pages/PurchaseHistory';
import ComplaintDetails from './pages/ComplaintDetails';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/place-order" element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
            <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetails /></ProtectedRoute>} />
            <Route path="/new-products" element={<ProtectedRoute><NewProducts /></ProtectedRoute>} />
            <Route path="/all-products" element={<ProtectedRoute><AllProducts /></ProtectedRoute>} />
            <Route path="/purchase-history/:id" element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>} />
            
            {/* Admin Only Routes */}
            <Route path="/admin/pending" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CustomerOrder />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CustomerDetails />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Error Pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
