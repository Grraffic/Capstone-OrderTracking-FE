import { io } from "socket.io-client";

// Extract base URL from VITE_API_URL (remove /api suffix if present)
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  // Remove trailing /api if present, otherwise use as-is
  if (apiUrl.endsWith("/api")) {
    return apiUrl.slice(0, -4);
  }
  // If it doesn't end with /api, assume it's already the base URL
  return apiUrl.replace(/\/api\/?$/, "");
};

const SOCKET_URL = getSocketURL();

/**
 * Socket.IO Client Instance (Singleton)
 * Manages a single real-time connection to the backend server
 *
 * This class ensures only ONE Socket.IO connection exists across the entire application.
 * It should be used via the SocketContext provider, not directly in components.
 */
class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionCount = 0; // Track connection attempts for debugging
  }

  /**
   * Connect to the Socket.IO server
   * Note: This should only be called once by the SocketProvider
   */
  connect() {
    // Prevent multiple connections
    if (this.socket?.connected) {
      console.log("🔌 Socket already connected (ID:", this.socket.id + ")");
      return this.socket;
    }

    // If socket exists but is disconnected, try to reconnect
    if (this.socket && !this.socket.connected) {
      console.log("🔌 Socket exists but disconnected, attempting to reconnect...");
      this.socket.connect();
      return this.socket;
    }

    this.connectionCount++;
    console.log(`🔌 Connecting to Socket.IO server... (Attempt #${this.connectionCount})`, SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket.IO connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error.message);
    });

    return this.socket;
  }

  /**
   * Disconnect from the Socket.IO server
   * Note: This should only be called by the SocketProvider on cleanup
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting Socket.IO...");
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log("✅ Socket.IO disconnected and cleaned up");
    }
  }

  /**
   * Listen to a Socket.IO event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn(`⚠️ Cannot listen to "${event}" - socket not initialized. Use SocketProvider.`);
      return;
    }

    // Store the callback for cleanup later
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
    console.log(`👂 Listening to event: ${event}`);
  }

  /**
   * Stop listening to a Socket.IO event
   * @param {string} event - Event name
   * @param {function} callback - Callback function (optional)
   */
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from listeners map
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }

    console.log(`🔇 Stopped listening to event: ${event}`);
  }

  /**
   * Emit a Socket.IO event
   * @param {string} event - Event name
   * @param {any} data - Data to send
   */
  emit(event, data) {
    if (!this.socket) {
      console.warn(`⚠️ Cannot emit "${event}" - socket not initialized. Use SocketProvider.`);
      return;
    }

    this.socket.emit(event, data);
    console.log(`📤 Emitted event: ${event}`, data);
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

/**
 * Export a singleton instance
 *
 * IMPORTANT: This should only be used by the SocketProvider.
 * Components should use the useSocket() hook from SocketContext instead.
 */
const socketClient = new SocketClient();
export default socketClient;
