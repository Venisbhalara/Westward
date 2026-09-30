import React, { useState, useEffect, useCallback } from 'react';
import PinAuthModal from './components/PinAuthModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopHeader from './components/TopHeader.jsx';
import DashboardView from './components/DashboardView.jsx';
import OrdersView from './components/OrdersView.jsx';
import UsersView from './components/UsersView.jsx';
import ProductsView from './components/ProductsView.jsx';
import InquiriesView from './components/InquiriesView.jsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [currentView, setView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  // Check initial authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        setIsAuthenticated(!!data.authenticated);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch all administrative records from MySQL
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    try {
      const [statsRes, ordersRes, usersRes, prodRes, inqRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/orders'),
        fetch('/api/users'),
        fetch('/api/products'),
        fetch('/api/inquiries'),
      ]);

      if (statsRes.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const [statsData, ordersData, usersData, prodData, inqData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        usersRes.json(),
        prodRes.json(),
        inqRes.json(),
      ]);

      setStats(statsData);
      setOrders(ordersData.orders || []);
      setUsers(usersData.users || []);
      setProducts(prodData.products || []);
      setInquiries(inqData.inquiries || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
      // Auto-sync polling every 12 seconds
      const timer = setInterval(fetchAllData, 12000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, fetchAllData]);

  // Order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      // Update state locally & refresh
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
      fetchAllData();
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  };

  // Inquiry status update
  const handleUpdateInquiryStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/inquiries/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update ticket status');

      setInquiries((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      fetchAllData();
    } catch (err) {
      alert('Error updating ticket: ' + err.message);
    }
  };

  // Lock / Logout session
  const handleLockSession = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        Initializing WESTWARD Executive Security...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinAuthModal onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const titles = {
    dashboard: 'Executive Suite Overview',
    orders: 'Customer Orders Fulfillment',
    users: 'Registered Patrons Directory',
    products: 'Catalog & Garment Inventory',
    inquiries: 'Customer Support & Concierge Tickets',
  };

  return (
    <div className="admin-shell">
      <Sidebar
        currentView={currentView}
        setView={setView}
        stats={stats}
        onLock={handleLockSession}
      />

      <div className="admin-main-content">
        <TopHeader
          title={titles[currentView] || 'WESTWARD Administration'}
          onRefresh={fetchAllData}
          refreshing={refreshing}
        />

        {currentView === 'dashboard' && (
          <DashboardView
            stats={stats}
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setView('orders');
            }}
            onNavigate={setView}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            orders={orders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        )}

        {currentView === 'users' && <UsersView users={users} />}

        {currentView === 'products' && (
          <ProductsView products={products} onRefresh={fetchAllData} />
        )}

        {currentView === 'inquiries' && (
          <InquiriesView
            inquiries={inquiries}
            onUpdateStatus={handleUpdateInquiryStatus}
          />
        )}
      </div>
    </div>
  );
}
