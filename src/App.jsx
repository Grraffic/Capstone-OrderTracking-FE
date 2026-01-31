import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { MaintenanceProvider } from "./context/MaintenanceContext";
import { SocketProvider } from "./context/SocketContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { ActivityProvider } from "./context/ActivityContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import { NotificationProvider } from "./context/NotificationContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import AppRoutes from "./routes";

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
      <MaintenanceProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <ActivityProvider>
                <CartProvider>
                  <CheckoutProvider>
                    <OrderProvider>
                      <BrowserRouter>
                        <Toaster
                          position="top-right"
                          containerStyle={{
                            top: "100px", // Add spacing below header (header is ~64-80px)
                          }}
                          containerClassName="toast-container"
                          gutter={6}
                          toastOptions={{
                            duration: 3000,
                            style: {
                              background: "#363636",
                              color: "#fff",
                              marginBottom: "0px",
                            },
                            className: "custom-toast",
                            success: {
                              duration: 3000,
                              iconTheme: {
                                primary: "#e68b00",
                                secondary: "#fff",
                              },
                            },
                            error: {
                              duration: 4000,
                              iconTheme: {
                                primary: "#ef4444",
                                secondary: "#fff",
                              },
                            },
                          }}
                        />
                        <AppRoutes />
                      </BrowserRouter>
                    </OrderProvider>
                  </CheckoutProvider>
                </CartProvider>
              </ActivityProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
        </MaintenanceProvider>
      </div>
    </ErrorBoundary>
  );
}
