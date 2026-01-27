import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMaintenance } from "../context/MaintenanceContext";
import MaintenanceOverlay from "../components/common/MaintenanceOverlay";
import InactiveUserOverlay from "../components/common/InactiveUserOverlay";
// authAPI not required here; token is stored and profile will be fetched by AuthContext on reload

function parseJwt(token) {
  try {
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(
      atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload;
  } catch (err) {
    return null;
  }
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isActive, message, loading: maintenanceLoading } = useMaintenance();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");
    const email = params.get("email");

    if (error) {
      // Handle account_inactive error - show overlay instead of redirecting
      if (error === "account_inactive") {
        setProcessing(false);
        // Don't navigate, show inactive user overlay instead
        return;
      }
      
      // Show a friendly error and redirect to login for other errors
      const message =
        error === "domain_not_allowed"
          ? `Your email ${
              typeof email === "object"
                ? email.email || email.value || JSON.stringify(email)
                : email || ""
            } is not allowed.\nStudents must use @student.laverdad.edu.ph and admins must use @laverdad.edu.ph (or the approved admin email on file).`
          : "Authentication error";
      // Use alert for now; app can replace with modal/toast
      window.alert(message);
      navigate("/login", { replace: true });
      return;
    }
    if (!token) {
      // Nothing to do
      navigate("/login", { replace: true });
      return;
    }

    // Wait for maintenance status to load before processing
    if (maintenanceLoading) {
      return;
    }

    // Store token and redirect based on role in JWT
    try {
      localStorage.setItem("authToken", token);
      const payload = parseJwt(token);
      const role = payload?.role;

      // Block students if maintenance is active
      if (role === "student" && isActive) {
        setProcessing(false);
        // Don't navigate, show maintenance overlay instead
        return;
      }

      if (role === "system_admin") {
        navigate("/system-admin", { replace: true });
      } else if (role === "property_custodian" || role === "admin") {
        // Handle both new and old role names for backward compatibility
        navigate("/property-custodian", { replace: true });
      } else if (role === "student") {
        navigate("/all-products", { replace: true });
      } else {
        // fallback
        navigate("/", { replace: true });
      }
      setProcessing(false);
    } catch (error) {
      console.error("Auth callback handling error", error);
      navigate("/login", { replace: true });
      setProcessing(false);
    }
  }, [navigate, isActive, maintenanceLoading]);

  // Get params for rendering overlays
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const email = params.get("email");
  const token = params.get("token");

  // Show inactive user overlay if account is inactive
  if (error === "account_inactive") {
    const userName = email ? email.split("@")[0] : null;
    return <InactiveUserOverlay userName={userName} email={email} />;
  }

  // Show maintenance overlay if student tries to login during maintenance
  if (!maintenanceLoading && !processing && token) {
    const payload = parseJwt(token);
    if (payload?.role === "student" && isActive) {
      return <MaintenanceOverlay message={message} />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;
