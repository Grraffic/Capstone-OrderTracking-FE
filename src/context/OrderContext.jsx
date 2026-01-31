import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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
      
      console.log(`🔄 OrderContext: UPDATE_ORDER reducer called for order:`, {
        id: orderId,
        orderNumber: orderNumber,
        newStatus: newStatus,
        currentOrdersCount: state.orders.length
      });
      
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
        
        console.log(`🔄 OrderContext: Updating order ${updatedOrder.id} (${updatedOrder.orderNumber})`);
        console.log(`🔄 OrderContext: Status change: ${existingOrder.status} → ${updatedOrder.status}`);
        
        // Verify the status was actually updated
        if (updatedOrder.status !== newStatus && newStatus) {
          console.warn(`⚠️ OrderContext: Status mismatch! Expected ${newStatus}, got ${updatedOrder.status}`);
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
        console.warn('⚠️ OrderContext: UPDATE_ORDER - Order not found in state, adding as new:', {
          id: orderId,
          orderNumber: orderNumber,
          status: newStatus,
          currentOrders: state.orders.map(o => ({ id: o.id, orderNumber: o.orderNumber, status: o.status }))
        });
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
  const { user, userRole } = useAuth();
  const { on, off, isConnected } = useSocket();

  // Define fetchOrders first so it can be used in useEffect hooks
  const fetchOrders = useCallback(async () => {
    try {
      console.log(`🔍 OrderContext: fetchOrders called`, {
        userRole,
        userId: user?.uid || user?.id,
        hasUser: !!user
      });
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Build filters based on user role
      const filters = {};
      if (userRole === 'student' && user?.uid) {
        filters.student_id = user.uid;
        // Also include email to match orders with null student_id (legacy data)
        if (user?.email) {
          filters.student_email = user.email;
        }
        console.log(`🔍 OrderContext: Setting student_id filter:`, user.uid);
        console.log(`🔍 OrderContext: Setting student_email filter:`, user.email);
      } else if (userRole === 'student' && user?.id) {
        // Fallback to user.id if uid is not available
        filters.student_id = user.id;
        // Also include email to match orders with null student_id (legacy data)
        if (user?.email) {
          filters.student_email = user.email;
        }
        console.log(`🔍 OrderContext: Setting student_id filter (using user.id):`, user.id);
        console.log(`🔍 OrderContext: Setting student_email filter:`, user.email);
      } else {
        console.warn(`⚠️ OrderContext: Cannot fetch orders - missing user or userRole`, {
          userRole,
          hasUser: !!user,
          userId: user?.uid || user?.id
        });
        dispatch({ type: 'SET_ORDERS', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      console.log(`🔍 OrderContext: Fetching orders with filters:`, filters);
      
      // Fetch orders from backend API
      // For students, we need ALL orders including claimed/completed ones
      // So we don't pass a status filter - we'll filter on the frontend
      // Use a large page size to ensure we get all orders (students typically don't have hundreds of orders)
      // This ensures all claimed orders are visible, matching what finance/accounting sees
      // If a student has more than 500 orders, we'll need to implement pagination
      const response = await orderAPI.getOrders(filters, 1, 500);
      console.log(`🔍 OrderContext: API response received:`, {
        success: response.data?.success,
        dataLength: response.data?.data?.length,
        pagination: response.data?.pagination
      });
      
      if (response.data.success) {
        console.log(`✅ OrderContext: API call successful, processing ${response.data.data?.length || 0} orders`);
        
        // Transform backend data to match frontend format
        const transformedOrders = (response.data.data || []).map(order => {
          // Ensure we have a valid UUID - log warning if missing
          if (!order.id) {
            console.warn('Order missing UUID id field:', {
              order_number: order.order_number,
              order: order
            });
          }
          
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

        // Log order statuses for debugging
        const statusCounts = transformedOrders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});
        console.log(`📦 OrderContext: Fetched ${transformedOrders.length} orders. Status breakdown:`, statusCounts);
        const claimedCount = transformedOrders.filter(o => o.status === 'claimed' || o.status === 'completed').length;
        if (claimedCount > 0) {
          console.log(`✅ OrderContext: Found ${claimedCount} claimed/completed orders`);
          console.log(`✅ OrderContext: Claimed orders should match finance/accounting count`);
          // Log details of claimed orders
          const claimedOrders = transformedOrders.filter(o => o.status === 'claimed' || o.status === 'completed');
          console.log(`✅ OrderContext: Claimed order details:`, claimedOrders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            claimedDate: o.claimedDate,
            items: o.items?.map(i => i.name).join(", ") || "N/A"
          })));
        } else {
          console.log(`⚠️ OrderContext: No claimed/completed orders found. If finance/accounting shows claimed orders, check pagination limit.`);
          // Show what statuses we do have
          const availableStatuses = Object.keys(statusCounts);
          console.log(`⚠️ OrderContext: Available order statuses:`, availableStatuses);
        }
        
        // Log pagination info if available
        if (response.data.pagination) {
          console.log(`📦 OrderContext: Pagination info:`, {
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
            currentPage: response.data.pagination.page,
            limit: response.data.pagination.limit
          });
          if (response.data.pagination.totalPages > 1) {
            console.warn(`⚠️ OrderContext: There are more pages (${response.data.pagination.totalPages} total). Some orders may not be loaded.`);
            console.warn(`⚠️ OrderContext: Consider increasing limit or implementing pagination to fetch all orders.`);
          }
        }

        console.log(`✅ OrderContext: Dispatching ${transformedOrders.length} orders to state`);
        dispatch({ type: 'SET_ORDERS', payload: transformedOrders });
      } else {
        console.error('❌ OrderContext: API returned unsuccessful response:', response.data);
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('❌ OrderContext - Fetch orders error:', error);
      console.error('❌ OrderContext - Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      // Set empty array on error so UI doesn't break
      dispatch({ type: 'SET_ORDERS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log(`🔍 OrderContext: fetchOrders completed`);
    }
  }, [user, userRole]);

  // Initial fetch when user changes
  useEffect(() => {
    console.log(`🔍 OrderContext: useEffect triggered`, {
      hasUser: !!user,
      userRole,
      userId: user?.uid || user?.id
    });
    
    if (user && userRole) {
      console.log(`✅ OrderContext: Conditions met, calling fetchOrders`);
      fetchOrders();
    } else {
      console.warn(`⚠️ OrderContext: Conditions not met for fetchOrders`, {
        hasUser: !!user,
        userRole
      });
    }
  }, [user, userRole, fetchOrders]);

  // Listen for Socket.IO order updates
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleOrderUpdate = (data) => {
      console.log("📡 OrderContext - Real-time order update received:", data);
      console.log("📡 OrderContext - Order status:", data.status);
      console.log("📡 OrderContext - Order data:", data.order);
      console.log("📡 OrderContext - Current user:", user?.uid || user?.id);
      
      // If order status was updated, refresh the orders list
      if (data.status) {
        const orderId = data.order?.id || data.orderId;
        const orderStudentId = data.order?.student_id;
        const currentUserId = user?.uid || user?.id;
        
        // Only process if this order belongs to the current user (for students)
        if (userRole === 'student' && orderStudentId && currentUserId) {
          const orderBelongsToUser = String(orderStudentId) === String(currentUserId);
          if (!orderBelongsToUser) {
            console.log("📡 OrderContext - Order update ignored: order belongs to different user");
            return;
          }
        }
        
        if (orderId && data.order) {
          // Verify the order data structure
          if (!data.order.status && data.status) {
            console.warn("⚠️ OrderContext: Order data missing status, using event status:", data.status);
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
          
          console.log("📡 OrderContext - Transforming order for update:", {
            orderId: orderId,
            orderNumber: transformedOrder.orderNumber,
            eventStatus: data.status,
            orderStatus: data.order.status,
            finalStatus: transformedOrder.status,
            studentId: transformedOrder.studentId
          });
          
          // Verify status is set correctly
          if (!transformedOrder.status) {
            console.error("❌ OrderContext: Transformed order missing status!", transformedOrder);
          } else if (transformedOrder.status === "claimed") {
            console.log("✅ OrderContext: Order is being updated to CLAIMED status");
          }
          
          // Update the order in local state immediately
          dispatch({ 
            type: 'UPDATE_ORDER', 
            payload: transformedOrder
          });
        } else {
          console.error("❌ OrderContext: Missing orderId or order data:", {
            orderId: orderId,
            hasOrder: !!data.order,
            status: data.status
          });
        }
        
        // Always refetch orders to ensure we have the latest data from server
        // This is especially important for claimed orders to appear in the correct section
        // Use a delay to ensure backend has committed the change and local update is processed
        console.log("📡 OrderContext - Scheduling refetch after status update to:", data.status);
        setTimeout(() => {
          console.log("📡 OrderContext - Executing refetch...");
          fetchOrders()
            .then(() => {
              console.log("✅ OrderContext: Refetch completed successfully");
            })
            .catch(err => {
              console.error("❌ OrderContext - Error refetching orders after update:", err);
              // Retry once after a longer delay
              setTimeout(() => {
                console.log("📡 OrderContext - Retrying order refetch...");
                fetchOrders();
              }, 1000);
            });
        }, 300); // Increased delay to ensure backend commit
      }
    };

    on("order:updated", handleOrderUpdate);

    return () => {
      off("order:updated", handleOrderUpdate);
    };
  }, [isConnected, on, off, fetchOrders]);

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
