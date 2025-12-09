import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlaceOrder from './pages/PlaceOrder';
import MyOrders from './pages/MyOrders';
import Schemes from './pages/Schemes';
import Complaints from './pages/Complaints';
import NewProducts from './pages/NewProducts';
import NotTried from './pages/NotTried';
import AdminPending from './pages/AdminPending';
import AllProducts from './pages/AllProducts';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/place-order" element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
          <Route path="/new-products" element={<ProtectedRoute><NewProducts /></ProtectedRoute>} />
          <Route path="/not-tried" element={<ProtectedRoute><NotTried /></ProtectedRoute>} />
          <Route path="/all-products" element={<ProtectedRoute><AllProducts /></ProtectedRoute>} />
          <Route path="/admin/pending" element={<ProtectedRoute><AdminPending /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
