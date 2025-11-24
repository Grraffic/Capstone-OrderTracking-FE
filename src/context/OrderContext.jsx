import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { orderAPI } from '../services/api';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

// Order reducer
const orderReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload,
        loading: false
      };
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders]
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? { ...order, ...action.payload } : order
        )
      };
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload)
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  orders: [],
  loading: false,
  error: null
};

export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, userRole]);

  const fetchOrders = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Build filters based on user role
      const filters = {};
      if (userRole === 'student' && user?.uid) {
        filters.student_id = user.uid;
      }

      // Fetch orders from backend API
      const response = await orderAPI.getOrders(filters, 1, 100); // Fetch up to 100 orders
      
      if (response.data.success) {
        // Transform backend data to match frontend format
        const transformedOrders = response.data.data.map(order => ({
          id: order.order_number || order.id,
          studentId: order.student_id,
          studentName: order.student_name,
          type: order.education_level || 'School Uniform',
          item: order.items?.[0]?.name || 'Order Items',
          size: order.items?.[0]?.size || 'N/A',
          quantity: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1,
          status: order.status,
          orderDate: order.created_at,
          expectedDate: order.expected_delivery_date,
          eligibility: order.eligibility || 'eligible',
          orderNumber: order.order_number,
          items: order.items || [],
          totalAmount: order.total_amount || 0,
          qrCodeData: order.qr_code_data,
          notes: order.notes,
          paymentDate: order.payment_date,
          claimedDate: order.claimed_date,
          statusHistory: []
        }));

        dispatch({ type: 'SET_ORDERS', payload: transformedOrders });
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      // Set empty array on error so UI doesn't break
      dispatch({ type: 'SET_ORDERS', payload: [] });
    }
  };

  const createOrder = async (orderData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call backend API to create order
      const response = await orderAPI.createOrder(orderData);
      
      if (response.data.success) {
        const newOrder = response.data.data;
        
        // Transform to frontend format
        const transformedOrder = {
          id: newOrder.order_number || newOrder.id,
          studentId: newOrder.student_id,
          studentName: newOrder.student_name,
          type: newOrder.education_level || 'School Uniform',
          item: newOrder.items?.[0]?.name || 'Order Items',
          size: newOrder.items?.[0]?.size || 'N/A',
          quantity: newOrder.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1,
          status: newOrder.status,
          orderDate: newOrder.created_at,
          expectedDate: newOrder.expected_delivery_date,
          orderNumber: newOrder.order_number,
          items: newOrder.items || [],
          totalAmount: newOrder.total_amount || 0,
          qrCodeData: newOrder.qr_code_data,
          notes: newOrder.notes,
          statusHistory: []
        };

        dispatch({ type: 'ADD_ORDER', payload: transformedOrder });
        dispatch({ type: 'SET_LOADING', payload: false });
        
        return transformedOrder;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Create order error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, status, message) => {
    try {
      const order = state.orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');

      const updatedOrder = {
        ...order,
        status,
        statusHistory: [
          ...order.statusHistory,
          {
            status,
            message,
            timestamp: new Date().toISOString()
          }
        ]
      };

      dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
      return updatedOrder;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const cancelOrder = async (orderId, reason) => {
    try {
      await updateOrderStatus(orderId, 'cancelled', `Order cancelled: ${reason}`);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const getOrdersByStatus = (status) => {
    return state.orders.filter(order => order.status === status);
  };

  const getOrdersByType = (type) => {
    return state.orders.filter(order => order.type === type);
  };

  const getOrderStats = () => {
    const total = state.orders.length;
    const pending = state.orders.filter(o => o.status === 'pending').length;
    const completed = state.orders.filter(o => o.status === 'completed').length;
    const cancelled = state.orders.filter(o => o.status === 'cancelled').length;

    return { total, pending, completed, cancelled };
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    orders: state.orders,
    loading: state.loading,
    error: state.error,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrdersByStatus,
    getOrdersByType,
    getOrderStats,
    fetchOrders,
    clearError
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
