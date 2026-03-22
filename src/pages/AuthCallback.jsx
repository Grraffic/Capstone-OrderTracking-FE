import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const { isActive, message, loading: maintenanceLoading } = useMaintenance();
  const [processing, setProcessing] = useState(true);

  const error = searchParams.get("error");
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    const params = searchParams;
    const tokenParam = params.get("token");
    const errorParam = params.get("error");
    const emailParam = params.get("email");

    if (errorParam) {
      // Handle account_inactive error - show overlay instead of redirecting
      if (errorParam === "account_inactive") {
        try {
          localStorage.removeItem("authToken");
        } catch (_) {
          /* ignore */
        }
        setProcessing(false);
        // Don't navigate, show inactive user overlay instead
        return;
      }
      
      // Send user back to login with query params — LoginPage shows an inline banner
      // (avoids window.alert popping on every repeated OAuth attempt).
      {
        const next = new URLSearchParams();
        next.set("error", errorParam);
        const rawEmail =
          typeof emailParam === "object" && emailParam !== null
            ? emailParam.email || emailParam.value || ""
            : emailParam || "";
        if (rawEmail) next.set("email", String(rawEmail));
        navigate(`/login?${next.toString()}`, { replace: true });
      }
      return;
    }
    if (!tokenParam) {
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
      localStorage.setItem("authToken", tokenParam);
      const payload = parseJwt(tokenParam);
      const role = payload?.role;

      // Block students if maintenance is active
      if (role === "student" && isActive) {
        setProcessing(false);
        // Don't navigate, show maintenance overlay instead
        return;
      }

      if (role === "system_admin") {
        navigate("/system-admin", { replace: true });
      } else if (
        role === "property_custodian" || 
        role === "admin" ||
        role === "finance_staff" ||
        role === "accounting_staff" ||
        role === "department_head"
      ) {
        // Handle both new and old role names for backward compatibility
        // Include all staff roles that can access property custodian pages
        navigate("/property-custodian", { replace: true });
      } else if (role === "student") {
        // Students are always redirected to /all-products
        // StudentOnboardingGuard will handle redirecting to /student/settings if onboarding is incomplete
        // If admin created the student account, onboarding_completed is already true, so they can access /all-products
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
  }, [navigate, isActive, maintenanceLoading, searchParams]);

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
