import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('accessToken');

  // If a token exists, render the child route (e.g., ApplicationsPage).
  // The <Outlet /> component does this.
  if (token) {
    return <Outlet />;
  }

  // If no token, redirect to the login page.
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;