import { useEffect } from "react";
import { useSocket } from "../../context/SocketContext";

/**
 * useSocketStudentUpdates Hook
 *
 * Listens for real-time student updates via the shared Socket.IO connection
 * Handles student:created, student:updated, student:deleted, and students:bulk-updated events
 *
 * @param {function} onStudentUpdated - Callback function when a student is created, updated, deleted, or bulk updated
 * @returns {Object} - Socket connection status
 */
export const useSocketStudentUpdates = (onStudentUpdated) => {
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) {
      // console.log("⚠️ useSocketStudentUpdates: Socket not connected, skipping event setup");
      return;
    }

    // Listen for student created
    const handleStudentCreated = (data) => {
      // console.log("📡 Received student:created event:", data);
      if (onStudentUpdated) {
        onStudentUpdated({ type: "created", data });
      }
    };

    // Listen for student updated
    const handleStudentUpdated = (data) => {
      // console.log("📡 Received student:updated event:", data);
      if (onStudentUpdated) {
        onStudentUpdated({ type: "updated", data });
      }
    };

    // Listen for student deleted
    const handleStudentDeleted = (data) => {
      // console.log("📡 Received student:deleted event:", data);
      if (onStudentUpdated) {
        onStudentUpdated({ type: "deleted", data });
      }
    };

    // Listen for bulk student updates
    const handleBulkUpdated = (data) => {
      // console.log("📡 Received students:bulk-updated event:", data);
      if (onStudentUpdated) {
        onStudentUpdated({ type: "bulk-updated", data });
      }
    };

    // Register all event listeners
    on("student:created", handleStudentCreated);
    on("student:updated", handleStudentUpdated);
    on("student:deleted", handleStudentDeleted);
    on("students:bulk-updated", handleBulkUpdated);

    // Cleanup on unmount
    return () => {
      off("student:created", handleStudentCreated);
      off("student:updated", handleStudentUpdated);
      off("student:deleted", handleStudentDeleted);
      off("students:bulk-updated", handleBulkUpdated);
    };
  }, [onStudentUpdated, isConnected, on, off]);

  return {
    isConnected,
  };
};

export default useSocketStudentUpdates;
