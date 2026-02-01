import React, { useEffect, useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * StudentOnboardingGuard
 *
 * Blocks student shopping routes until onboarding is completed.
 * - If onboarding is incomplete, redirect to /student/settings
 * - Allow /student/settings so the student can finish required fields
 *
 * Note: onboardingCompleted is persisted in the DB and returned by GET /auth/profile.
 */
const StudentOnboardingGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isStudent = user?.role === "student";
  // Use truthy check to handle boolean true values properly
  const onboardingCompleted = Boolean(user?.onboardingCompleted);
  const isSettingsRoute = location.pathname.startsWith("/student/settings");

  const shouldGate = useMemo(() => {
    if (!isStudent) return false;
    if (onboardingCompleted) return false;
    if (isSettingsRoute) return false;
    return true;
  }, [isStudent, onboardingCompleted, isSettingsRoute]);

  useEffect(() => {
    if (!shouldGate) return;
    // preserve intended destination so we can restore later if needed
    navigate("/student/settings", { replace: true, state: { from: location } });
  }, [shouldGate, navigate, location]);

  if (loading) return children;
  if (shouldGate) {
    return <Navigate to="/student/settings" replace state={{ from: location }} />;
  }

  return children;
};

export default StudentOnboardingGuard;

