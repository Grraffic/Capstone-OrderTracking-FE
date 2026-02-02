import axios from "axios";
import { apiRateLimiter, authRateLimiter, writeRateLimiter } from "../utils/rateLimiter";

// Export API base URL for use in services that don't use axios
// Dev: fallback to local backend if VITE_API_URL not set. Prod: warn if missing (set in deployment e.g. Vercel).
let API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  if (import.meta.env.DEV) {
    API_BASE_URL = "http://localhost:5000/api";
  } else {
    console.warn(
      "VITE_API_URL is not set; API requests may fail. Set it in your deployment environment (e.g. Vercel)."
    );
    API_BASE_URL = "";
  }
}
export { API_BASE_URL };

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track if we're currently rate limited (from backend)
let isRateLimited = false;
let rateLimitResetTime = null;

// Add a request interceptor to attach auth token and check rate limits
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if we're still rate limited from backend
    if (isRateLimited && rateLimitResetTime) {
      const now = new Date();
      if (now < new Date(rateLimitResetTime)) {
        const error = new Error("Rate limit exceeded. Please wait before making another request.");
        error.code = "RATE_LIMIT_EXCEEDED";
        error.waitTime = new Date(rateLimitResetTime) - now;
        return Promise.reject(error);
      } else {
        // Rate limit expired
        isRateLimited = false;
        rateLimitResetTime = null;
      }
    }

    // Client-side rate limiting
    const url = config.url || "";
    const method = config.method?.toUpperCase() || "GET";
    
    // Determine which rate limiter to use
    let limiter;
    // Profile endpoints are GET requests, not auth attempts, so use general API limiter
    if (url.includes("/auth/profile") || url.includes("/auth/me") || url.includes("/auth/max-quantities")) {
      limiter = apiRateLimiter;
    } else if (url.includes("/auth") && method !== "GET") {
      // Only apply strict auth limiter to non-GET auth endpoints (login, register, etc.)
      limiter = authRateLimiter;
    } else if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      limiter = writeRateLimiter;
    } else {
      limiter = apiRateLimiter;
    }

    // Check if request can be made
    if (!limiter.canMakeRequest()) {
      const waitTime = limiter.getTimeUntilNextRequest();
      const error = new Error("Rate limit exceeded. Please wait before making another request.");
      error.waitTime = waitTime;
      error.code = "RATE_LIMIT_EXCEEDED";
      return Promise.reject(error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle quota / billing errors and rate limits
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // 429 Too Many Requests - Rate limit exceeded
    if (status === 429) {
      const retryAfter = error.response?.headers?.["retry-after"] || 
                        error.response?.headers?.["x-ratelimit-reset"] ||
                        error.response?.data?.retryAfter ||
                        "15 minutes";
      
      const resetTime = error.response?.data?.resetTime || null;
      const message = error.response?.data?.message || "Too many requests";
      
      // Set global rate limit state to prevent further requests
      isRateLimited = true;
      if (resetTime) {
        rateLimitResetTime = resetTime;
      } else {
        // Calculate reset time from retryAfter
        const minutes = parseInt(retryAfter) || 15;
        rateLimitResetTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      }
      
      console.warn(`Rate limit exceeded. Retry after: ${retryAfter}`, { resetTime: rateLimitResetTime });
      
      // Show user-friendly error message
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("rate-limit-exceeded", {
          detail: { 
            retryAfter, 
            message,
            resetTime: rateLimitResetTime,
          }
        }));
      }
    }

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
  confirmOrder: async (id) => {
    return api.patch(`/orders/${id}/confirm`);
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
