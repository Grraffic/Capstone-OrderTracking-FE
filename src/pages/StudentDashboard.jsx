import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  QrCode
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    availableUniforms: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch student dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data - replace with actual API calls
    setStats({
      totalOrders: 5,
      pendingOrders: 2,
      completedOrders: 3,
      availableUniforms: 12
    });

    setRecentOrders([
      {
        id: 'ORD-001',
        type: 'School Uniform',
        item: 'PE Uniform - Size M',
        status: 'pending',
        orderDate: '2024-01-15',
        expectedDate: '2024-01-20'
      },
      {
        id: 'ORD-002',
        type: 'Event Merchandise',
        item: 'Foundation Week Shirt - Size L',
        status: 'ready',
        orderDate: '2024-01-10',
        expectedDate: '2024-01-18'
      },
      {
        id: 'ORD-003',
        type: 'School Uniform',
        item: 'Regular Uniform - Size M',
        status: 'completed',
        orderDate: '2024-01-05',
        expectedDate: '2024-01-12'
      }
    ]);

    setNotifications([
      {
        id: 1,
        type: 'order_ready',
        message: 'Your Foundation Week Shirt is ready for pickup',
        timestamp: '2024-01-18T10:30:00Z'
      },
      {
        id: 2,
        type: 'uniform_available',
        message: 'New PE Uniforms are now available in stock',
        timestamp: '2024-01-17T14:15:00Z'
      }
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <Package className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.displayName}!</h1>
        <p className="mt-2 text-primary-100">
          Manage your uniform orders and track your merchandise requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalOrders}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.pendingOrders}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.completedOrders}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Available Items</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.availableUniforms}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              <button className="btn-primary px-3 py-1 text-sm flex items-center space-x-1">
                <Plus className="h-4 w-4" />
                <span>New Order</span>
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{order.item}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{order.type} • Order #{order.id}</p>
                    <p className="text-xs text-gray-400">
                      Ordered: {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <QrCode className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="px-6 py-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-primary-600 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-outline p-4 flex flex-col items-center space-y-2">
            <ShoppingCart className="h-8 w-8 text-primary-600" />
            <span>Order School Uniform</span>
          </button>
          <button className="btn-outline p-4 flex flex-col items-center space-y-2">
            <Package className="h-8 w-8 text-primary-600" />
            <span>Browse Merchandise</span>
          </button>
          <button className="btn-outline p-4 flex flex-col items-center space-y-2">
            <QrCode className="h-8 w-8 text-primary-600" />
            <span>Scan QR Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
