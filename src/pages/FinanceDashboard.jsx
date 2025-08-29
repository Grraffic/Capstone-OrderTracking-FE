import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  QrCode,
  BarChart3,
  Download
} from 'lucide-react';

const FinanceDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInventory: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    totalStudents: 0,
    monthlyOrders: 0,
    completedOrders: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data - replace with actual API calls
    setStats({
      totalInventory: 1250,
      lowStockItems: 8,
      pendingOrders: 23,
      totalStudents: 450,
      monthlyOrders: 156,
      completedOrders: 133
    });

    setLowStockItems([
      { id: 1, name: 'PE Uniform - Size M', currentStock: 5, minStock: 20, category: 'PE Uniform' },
      { id: 2, name: 'Regular Uniform - Size L', currentStock: 3, minStock: 15, category: 'Regular Uniform' },
      { id: 3, name: 'PE Uniform - Size S', currentStock: 8, minStock: 20, category: 'PE Uniform' },
    ]);

    setRecentOrders([
      {
        id: 'ORD-045',
        studentName: 'Juan Dela Cruz',
        studentId: 'STU-2024-001',
        item: 'PE Uniform - Size M',
        status: 'pending',
        orderDate: '2024-01-18',
        eligibility: 'eligible'
      },
      {
        id: 'ORD-046',
        studentName: 'Maria Santos',
        studentId: 'STU-2024-002',
        item: 'Regular Uniform - Size S',
        status: 'ready',
        orderDate: '2024-01-18',
        eligibility: 'eligible'
      },
      {
        id: 'ORD-047',
        studentName: 'Pedro Garcia',
        studentId: 'STU-2024-003',
        item: 'PE Uniform - Size L',
        status: 'pending_approval',
        orderDate: '2024-01-17',
        eligibility: 'needs_approval'
      }
    ]);

    setInventoryAlerts([
      {
        id: 1,
        type: 'low_stock',
        message: 'PE Uniform Size M is running low (5 remaining)',
        severity: 'high',
        timestamp: '2024-01-18T09:30:00Z'
      },
      {
        id: 2,
        type: 'restock_needed',
        message: 'Regular Uniform Size L needs immediate restocking',
        severity: 'critical',
        timestamp: '2024-01-18T08:15:00Z'
      }
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'pending_approval':
        return 'text-orange-600 bg-orange-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Finance Department Dashboard</h1>
        <p className="mt-2 text-green-100">
          Manage school uniform inventory and student orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Inventory</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalInventory}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.lowStockItems}</dd>
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
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {lowStockItems.length} items
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {lowStockItems.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-xs text-red-600">
                        {item.currentStock} remaining
                      </span>
                      <span className="text-xs text-gray-400">
                        (Min: {item.minStock})
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <QrCode className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{order.studentName}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{order.item}</p>
                    <p className="text-xs text-gray-400">
                      {order.studentId} • {new Date(order.orderDate).toLocaleDateString()}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="btn-outline p-4 flex flex-col items-center space-y-2">
            <Package className="h-8 w-8 text-green-600" />
            <span>Manage Inventory</span>
          </button>
          <button className="btn-outline p-4 flex flex-col items-center space-y-2">
            <QrCode className="h-8 w-8 text-green-600" />
            <span>Generate QR Codes</span>
          </button>
          <button className="btn-outline p-4 flex flex-col items-center space-y-2">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <span>View Reports</span>
          </button>
          <button className="btn-outline p-4 flex flex-col items-center space-y-2">
            <Download className="h-8 w-8 text-green-600" />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
