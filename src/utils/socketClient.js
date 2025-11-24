import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

/**
 * Socket.IO Client Instance
 * Manages real-time connection to the backend server
 */
class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to the Socket.IO server
   */
  connect() {
    if (this.socket?.connected) {
      console.log("🔌 Socket already connected");
      return this.socket;
    }

    console.log("🔌 Connecting to Socket.IO server...", SOCKET_URL);

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
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log("🔌 Socket.IO disconnected");
    }
  }

  /**
   * Listen to a Socket.IO event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      this.connect();
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
      this.connect();
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

// Export a singleton instance
const socketClient = new SocketClient();
export default socketClient;
