import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
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
      // Find order by id (support both UUID and order_number matching)
      const orderId = action.payload.id;
      const orderNumber = action.payload.orderNumber;
      const newStatus = action.payload.status;
      
      const orderIndex = state.orders.findIndex(order => {
        // Try multiple matching strategies
        if (order.id && orderId && String(order.id) === String(orderId)) return true;
        if (order.orderNumber && orderNumber && String(order.orderNumber) === String(orderNumber)) return true;
        if (order.id === orderId) return true;
        if (order.orderNumber === orderNumber) return true;
        return false;
      });
      
      if (orderIndex >= 0) {
        // Update existing order - ensure status is properly merged
        const existingOrder = state.orders[orderIndex];
        const updatedOrder = { 
          ...existingOrder, 
          ...action.payload,
          // Ensure status is explicitly set from payload
          status: newStatus || action.payload.status || existingOrder.status
        };
        
        // Verify the status was actually updated
        if (updatedOrder.status !== newStatus && newStatus) {
          updatedOrder.status = newStatus; // Force the correct status
        }
        
        return {
          ...state,
          orders: state.orders.map((order, index) =>
            index === orderIndex ? updatedOrder : order
          )
        };
      } else {
        // Add new order if it doesn't exist (shouldn't happen, but handle gracefully)
        return {
          ...state,
          orders: [action.payload, ...state.orders]
        };
      }
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
  const { user, userRole, loading: authLoading } = useAuth();
  const { on, off, isConnected } = useSocket();
  
  // Track if fetch is in progress to prevent duplicate calls
  const fetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const hasInitialFetchRef = useRef(false); // Track if we've done initial fetch
  const DEBOUNCE_MS = 1000; // Minimum time between fetches (1 second)

  // Define fetchOrders first so it can be used in useEffect hooks
  const fetchOrders = useCallback(async (skipDebounce = false) => {
    // Prevent duplicate simultaneous fetches
    if (fetchingRef.current) {
      return;
    }
    
    // Get current time for debouncing and tracking
    const now = Date.now();
    
    // Debounce: don't fetch if we just fetched recently (skip for initial fetch or when explicitly requested)
    const isInitialFetch = !hasInitialFetchRef.current;
    if (!skipDebounce && !isInitialFetch) {
      if (now - lastFetchTimeRef.current < DEBOUNCE_MS) {
        return;
      }
    }
    
    try {
      fetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Build filters based on user role
      // IMPORTANT: Orders are created with students.id (from getStudentIdForUser),
      // but JWT contains users.id. The backend query uses .or() to match by either
      // student_id OR (null student_id AND matching email), so we always pass email
      // to ensure orders are found regardless of which ID was used.
      const filters = {};
      if (userRole === 'student') {
        // Always pass student_id (JWT id = users.id, which might differ from students.id used in orders)
        // But more importantly, always pass email so backend can match orders created with students.id
        if (user?.uid) {
          filters.student_id = user.uid;
        } else if (user?.id) {
          filters.student_id = user.id;
        }
        
        // CRITICAL: Always include email to match orders regardless of student_id mismatch
        // Backend query: student_id.eq.X OR (student_id.is.null AND student_email.eq.Y)
        // This ensures orders created with students.id are found even if JWT has users.id
        if (user?.email) {
          filters.student_email = user.email;
        } else {
          console.warn('OrderContext: No email available for order filtering');
        }
      } else {
        dispatch({ type: 'SET_ORDERS', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        fetchingRef.current = false;
        return;
      }
      
      // Fetch orders from backend API
      // For students, we need ALL orders including claimed/completed ones
      // So we don't pass a status filter - we'll filter on the frontend
      // Use a large page size to ensure we get all orders (students typically don't have hundreds of orders)
      // This ensures all claimed orders are visible, matching what finance/accounting sees
      // If a student has more than 500 orders, we'll need to implement pagination
      const response = await orderAPI.getOrders(filters, 1, 500);
      
      if (response.data.success) {
        // Transform backend data to match frontend format
        const transformedOrders = (response.data.data || []).map(order => {
          return {
            id: order.id, // Keep the actual UUID from database (required for API calls)
            studentId: order.student_id,
            studentName: order.student_name,
            type: order.education_level || 'School Uniform',
            item: order.items?.[0]?.name || 'Order Items',
            size: order.items?.[0]?.size || 'N/A',
            quantity: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1,
            status: order.status,
            order_type: order.order_type || 'regular', // Add order type
            orderDate: order.created_at,
            expectedDate: order.expected_delivery_date,
            eligibility: order.eligibility || 'eligible',
            orderNumber: order.order_number, // Keep order_number separate for display
            items: order.items || [],
            totalAmount: order.total_amount || 0,
            qrCodeData: order.qr_code_data,
            notes: order.notes,
            paymentDate: order.payment_date,
            claimedDate: order.claimed_date,
            statusHistory: [],
            // Keep original order data for debugging
            _original: order
          };
        });

        dispatch({ type: 'SET_ORDERS', payload: transformedOrders });
      } else {
        console.error('❌ OrderContext: API returned unsuccessful response:', response.data);
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('OrderContext - Fetch orders error:', error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      // Set empty array on error so UI doesn't break
      dispatch({ type: 'SET_ORDERS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      fetchingRef.current = false;
      hasInitialFetchRef.current = true; // Mark that we've done at least one fetch
    }
  }, [user?.uid, user?.id, user?.email, userRole]);

  // Initial fetch when user changes (only once when user/userRole changes)
  useEffect(() => {
    // Wait for auth to finish loading before attempting to fetch
    if (authLoading) {
      return;
    }
    
    if (user && userRole) {
      // Skip debounce for initial fetch
      fetchOrders(true);
    } else {
      // Clear orders when user logs out
      dispatch({ type: 'SET_ORDERS', payload: [] });
      hasInitialFetchRef.current = false; // Reset flag when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid, user?.id, userRole]); // Wait for auth to load

  // Listen for Socket.IO order updates
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleOrderUpdate = (data) => {
      // If order status was updated, refresh the orders list
      if (data.status) {
        const orderId = data.order?.id || data.orderId;
        const orderStudentId = data.order?.student_id;
        const currentUserId = user?.uid || user?.id;
        
        // Only process if this order belongs to the current user (for students)
        if (userRole === 'student' && orderStudentId && currentUserId) {
          const orderBelongsToUser = String(orderStudentId) === String(currentUserId);
          if (!orderBelongsToUser) {
            return;
          }
        }
        
        if (orderId && data.order) {
          // Verify the order data structure
          if (!data.order.status && data.status) {
            data.order.status = data.status;
          }
          
          // Transform the order data to match frontend format
          const transformedOrder = {
            id: data.order.id || orderId,
            studentId: data.order.student_id,
            studentName: data.order.student_name,
            type: data.order.education_level || 'School Uniform',
            item: data.order.items?.[0]?.name || 'Order Items',
            size: data.order.items?.[0]?.size || 'N/A',
            quantity: data.order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1,
            status: data.status || data.order.status, // Prioritize event status, fallback to order status
            order_type: data.order.order_type || 'regular',
            orderDate: data.order.created_at,
            expectedDate: data.order.expected_delivery_date,
            orderNumber: data.order.order_number,
            items: data.order.items || [],
            totalAmount: data.order.total_amount || 0,
            qrCodeData: data.order.qr_code_data,
            notes: data.order.notes,
            paymentDate: data.order.payment_date,
            claimedDate: data.order.claimed_date,
            statusHistory: [],
            _original: data.order
          };
          
          // Update the order in local state immediately
          dispatch({ 
            type: 'UPDATE_ORDER', 
            payload: transformedOrder
          });
        }
        
        // Debounced refetch - only refetch if not already fetching and enough time has passed
        const now = Date.now();
        if (!fetchingRef.current && (now - lastFetchTimeRef.current > DEBOUNCE_MS)) {
          setTimeout(() => {
            fetchOrders();
          }, 500); // Delay to ensure backend commit
        }
      }
    };

    on("order:updated", handleOrderUpdate);

    return () => {
      off("order:updated", handleOrderUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, on, off, user?.uid, user?.id, userRole]); // Don't include fetchOrders to avoid recreating handler

  const createOrder = async (orderData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call backend API to create order
      const response = await orderAPI.createOrder(orderData);
      
      if (response.data.success) {
        const newOrder = response.data.data;
        
        // Transform to frontend format
        const transformedOrder = {
          id: newOrder.id, // Keep the actual UUID from database
          studentId: newOrder.student_id,
          studentName: newOrder.student_name,
          type: newOrder.education_level || 'School Uniform',
          item: newOrder.items?.[0]?.name || 'Order Items',
          size: newOrder.items?.[0]?.size || 'N/A',
          quantity: newOrder.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1,
          status: newOrder.status,
          order_type: newOrder.order_type || 'regular', // Add order type
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
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
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
