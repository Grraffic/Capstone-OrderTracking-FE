import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

export default api;
