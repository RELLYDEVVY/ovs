import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'user')[];
  requireFingerprint?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['user', 'admin'],
  requireFingerprint = false 
}: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated } = useAuth(); 
  const location = useLocation();
  const navigate = useNavigate();

  // Handle all navigation logic in a single useEffect
  useEffect(() => {
    if (loading) return; // Don't do anything if still loading auth state

    if (!isAuthenticated) { // Primary condition for redirecting to login
      if (location.pathname !== '/login') {
        navigate('/login', { state: { from: location }, replace: true });
      }
      return; // Stop further checks if not authenticated
    }

    // At this point, user is authenticated (isAuthenticated is true)
    // Now check for user object presence for further role/fingerprint checks
    if (!user) {
      // This is the critical state: authenticated but user object is not yet available.
      // This should be transient. If it persists, it's an issue in state update.
      console.warn("ProtectedRoute: Authenticated but user object is still null/undefined. Waiting for user data...");
      return; // Wait for user object to be populated, useEffect will re-run
    }

    // User is authenticated and user object exists. Perform role and fingerprint checks.
    const hasRequiredRole = allowedRoles.includes(user.role);
    if (!hasRequiredRole && location.pathname !== '/unauthorized') {
      navigate('/unauthorized', { replace: true });
      return;
    }

    if (requireFingerprint && !user.isFingerPrintVerified && location.pathname !== '/fingerprint-required') {
      navigate('/fingerprint-required', { replace: true });
      return;
    }

  }, [isAuthenticated, user, loading, navigate, location, allowedRoles, requireFingerprint]);

  // Render logic based on auth state
  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading Auth...</div>;
  }

  // If not loading, but not yet authenticated (and useEffect is about to redirect to /login)
  if (!isAuthenticated && location.pathname !== '/login') {
    return <div className="w-full h-screen flex items-center justify-center">Redirecting to Login...</div>;
  }

  // If authenticated, but user object is not yet populated (useEffect has a console.warn for this)
  // This state should be transient. The useEffect will re-run when 'user' populates.
  if (isAuthenticated && !user) {
    return <div className="w-full h-screen flex items-center justify-center">Loading User Details...</div>;
  }

  // If all checks passed in useEffect (or no redirect was needed) and user is available:
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Fallback: Should ideally not be reached if logic is air-tight.
  // This could happen if on '/login' page itself while not authenticated.
  if (location.pathname === '/login' && !isAuthenticated) {
     return <>{children}</>; // Allow rendering login page if not authenticated
  }
  
  return <div className="w-full h-screen flex items-center justify-center">Verifying Access...</div>;
};

export default ProtectedRoute;
