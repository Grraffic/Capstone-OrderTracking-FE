import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Detect iOS device
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isIOSChrome = isIOS && /CriOS/.test(navigator.userAgent);
const isIOSBrave = isIOS && /Brave/.test(navigator.userAgent);

// Log device info for debugging
console.log("🔍 Device Detection:", {
  userAgent: navigator.userAgent,
  isIOS,
  isIOSChrome,
  isIOSBrave,
  platform: navigator.platform,
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
});

// Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: #ef4444; margin-bottom: 10px;">Error: Root element not found</h1>
        <p style="color: #666;">The application cannot start because the root element is missing.</p>
      </div>
    </div>
  `;
} else {
  try {
    console.log("✅ Root element found, initializing React app...");
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    console.log("✅ React app rendered successfully");
  } catch (error) {
    console.error("❌ Error initializing React app:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Show error message to user
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px;">
        <div style="text-align: center; max-width: 500px;">
          <h1 style="color: #ef4444; margin-bottom: 10px; font-size: 24px;">Application Error</h1>
          <p style="color: #666; margin-bottom: 20px;">Failed to initialize the application. Please try reloading the page.</p>
          <button 
            onclick="window.location.reload()" 
            style="background: #003363; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;"
          >
            Reload Page
          </button>
          ${process.env.NODE_ENV === "development" ? `
            <details style="margin-top: 20px; text-align: left;">
              <summary style="cursor: pointer; color: #666; margin-bottom: 10px;">Error Details</summary>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">${error.toString()}\n${error.stack}</pre>
            </details>
          ` : ""}
        </div>
      </div>
    `;
  }
}
