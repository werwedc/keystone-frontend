import { Outlet, useNavigate, Link } from "react-router-dom"; // Import useNavigate and Link

export default function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear tokens from storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 h-screen p-4 border-r bg-muted/40">
        <h1 className="text-xl font-bold mb-4">Keystone</h1>
        <nav>
          <ul className="space-y-2">
          <li>
            <Link to="/applications" className="block p-2 hover:bg-muted rounded-md">
              Applications
            </Link>
          </li>
          <li>
            <Link to="/licenses" className="block p-2 hover:bg-muted rounded-md">
              Licenses
            </Link>
          </li>
          <li>
            <Link to="/machines" className="block p-2 hover:bg-muted rounded-md">
              Machines
            </Link>
          </li>
          <li>
            <button onClick={handleLogout} className="w-full text-left block p-2 hover:bg-muted rounded-md">
              Logout
            </button>
          </li>
        </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}