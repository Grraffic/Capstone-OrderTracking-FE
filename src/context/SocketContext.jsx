import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import socketClient from "../utils/socketClient";

const SocketContext = createContext();

/**
 * useSocket Hook
 * Access the shared Socket.IO connection
 * 
 * @returns {Object} Socket context with connection, status, and helper methods
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

/**
 * SocketProvider - Manages the single shared Socket.IO connection
 * 
 * This provider:
 * - Creates a single Socket.IO connection when a user is authenticated
 * - Provides the connection to all child components via context
 * - Handles connection lifecycle (connect/disconnect)
 * - Tracks connection status
 * - Automatically disconnects when user logs out
 * 
 * Usage:
 * - Wrap your app with <SocketProvider>
 * - Use the useSocket() hook in any component to access the connection
 */
export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  /**
   * Initialize Socket.IO connection when user is authenticated
   */
  useEffect(() => {
    if (!user?.uid) {
      // console.log("⚠️ SocketProvider: No authenticated user, skipping connection");
      
      // Disconnect if user logs out
      try {
        if (socketClient.isConnected()) {
          // console.log("🔌 SocketProvider: User logged out, disconnecting socket");
          socketClient.disconnect();
          setIsConnected(false);
        }
      } catch (error) {
        // console.error("Error disconnecting socket:", error);
      }
      return;
    }

    // console.log("🔌 SocketProvider: User authenticated, establishing connection for user:", user.uid);

    // Connect to Socket.IO server with error handling
    let socket;
    try {
      socket = socketClient.connect();
    } catch (error) {
      // console.error("❌ SocketProvider: Failed to initialize socket connection:", error);
      setConnectionError(error.message || "Failed to connect");
      setIsConnected(false);
      return;
    }

    // Set up connection event handlers
    const handleConnect = () => {
      // console.log("✅ SocketProvider: Socket connected successfully");
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = (reason) => {
      // console.log("❌ SocketProvider: Socket disconnected:", reason);
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      // console.error("❌ SocketProvider: Connection error:", error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    };

    // Add event listeners with error handling
    try {
      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);

      // Set initial connection state
      setIsConnected(socket.connected || false);
    } catch (error) {
      // console.error("❌ SocketProvider: Error setting up socket event listeners:", error);
      setConnectionError(error.message || "Failed to set up socket listeners");
    }

    // Cleanup on unmount or user change
    return () => {
      try {
        // console.log("🔌 SocketProvider: Cleaning up socket event listeners");
        if (socket) {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
        }
      } catch (error) {
        // console.error("Error cleaning up socket listeners:", error);
      }
    };
  }, [user?.uid]);

  /**
   * Subscribe to a Socket.IO event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  const on = useCallback((event, callback) => {
    if (!socketClient.socket) {
      // console.warn(`⚠️ SocketProvider: Cannot subscribe to "${event}" - socket not initialized`);
      return;
    }
    socketClient.on(event, callback);
  }, []);

  /**
   * Unsubscribe from a Socket.IO event
   * @param {string} event - Event name
   * @param {function} callback - Callback function (optional)
   */
  const off = useCallback((event, callback) => {
    if (!socketClient.socket) {
      return;
    }
    socketClient.off(event, callback);
  }, []);

  /**
   * Emit a Socket.IO event
   * @param {string} event - Event name
   * @param {any} data - Data to send
   */
  const emit = useCallback((event, data) => {
    if (!socketClient.socket) {
      // console.warn(`⚠️ SocketProvider: Cannot emit "${event}" - socket not initialized`);
      return;
    }
    socketClient.emit(event, data);
  }, []);

  /**
   * Get the raw socket instance (use sparingly)
   */
  const getSocket = useCallback(() => {
    return socketClient.socket;
  }, []);

  const value = {
    socket: socketClient.socket,
    isConnected,
    connectionError,
    on,
    off,
    emit,
    getSocket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

