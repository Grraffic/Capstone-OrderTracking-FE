import axios from "axios";

// Export API base URL for use in services that don't use axios
export const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle quota / billing errors (e.g., Supabase 402)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // 402 Payment Required - often returned when the backend/Supabase hits plan limits
    if (status === 402) {
      // Replace this with your own UI (toast, modal, redirect) as needed
      alert(
        "The service has temporarily hit its plan limits (Supabase quota). Please try again later or contact support."
      );
    }

    return Promise.reject(error);
  }
);

// Auth related API calls
export const authAPI = {
  loginWithGoogle: async (token) => {
    return api.post("/auth/google", { token });
  },
  logout: async () => {
    return api.post("/auth/logout");
  },
  getProfile: async () => {
    return api.get("/auth/profile");
  },
  getMaxQuantities: async () => {
    return api.get("/auth/max-quantities");
  },
  updateProfile: async (profileData) => {
    return api.put("/auth/profile", profileData);
  },
  refreshProfilePicture: async () => {
    return api.post("/auth/profile/refresh-picture");
  },
};

// Contact form API calls
export const contactAPI = {
  submitContact: async (contactData) => {
    return api.post("/contact", contactData);
  },
  getContacts: async () => {
    return api.get("/contact");
  },
  getContactById: async (id) => {
    return api.get(`/contact/${id}`);
  },
  updateContact: async (id, data) => {
    return api.put(`/contact/${id}`, data);
  },
  deleteContact: async (id) => {
    return api.delete(`/contact/${id}`);
  },
};

// Cart related API calls
export const cartAPI = {
  getCartItems: async (userId) => {
    return api.get(`/cart/${userId}`);
  },
  getCartCount: async (userId) => {
    return api.get(`/cart/count/${userId}`);
  },
  addToCart: async (cartData) => {
    return api.post("/cart", cartData);
  },
  updateCartItem: async (cartItemId, userId, quantity) => {
    return api.put(`/cart/${cartItemId}`, { userId, quantity });
  },
  removeFromCart: async (cartItemId, userId) => {
    return api.delete(`/cart/${cartItemId}`, { params: { userId } });
  },
  clearCart: async (userId) => {
    return api.delete(`/cart/clear/${userId}`);
  },
};

// Order related API calls
export const orderAPI = {
  getOrders: async (filters = {}, page = 1, limit = 10) => {
    return api.get("/orders", {
      params: {
        ...filters,
        page,
        limit,
      },
    });
  },
  getOrderById: async (id) => {
    return api.get(`/orders/${id}`);
  },
  getOrderByNumber: async (orderNumber) => {
    return api.get(`/orders/number/${orderNumber}`);
  },
  createOrder: async (orderData) => {
    return api.post("/orders", orderData);
  },
  updateOrderStatus: async (id, status) => {
    return api.patch(`/orders/${id}/status`, { status });
  },
  updateOrder: async (id, orderData) => {
    return api.put(`/orders/${id}`, orderData);
  },
  deleteOrder: async (id) => {
    return api.delete(`/orders/${id}`);
  },
  getOrderStats: async () => {
    return api.get("/orders/stats");
  },
  convertPreOrderToRegular: async (orderId) => {
    return api.post(`/orders/${orderId}/convert-pre-order`);
  },
};

// Items related API calls
export const itemsAPI = {
  getPreOrderCount: async (itemId) => {
    return api.get(`/items/${itemId}/pre-order-count`);
  },
  getAvailableSizes: async (name, educationLevel) => {
    // URL encode the parameters to handle special characters and spaces
    const encodedName = encodeURIComponent(name);
    const encodedEducationLevel = encodeURIComponent(educationLevel);
    return api.get(`/items/sizes/${encodedName}/${encodedEducationLevel}`);
  },
  getNameSuggestions: async ({ educationLevel, search, limit } = {}) => {
    return api.get("/items/name-suggestions", {
      params: {
        ...(educationLevel ? { educationLevel } : {}),
        ...(search ? { search } : {}),
        ...(limit ? { limit } : {}),
      },
    });
  },
};

export default api;
