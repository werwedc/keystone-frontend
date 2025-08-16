import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts & Route Guards
import MainLayout from './components/shared/MainLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Pages
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ApplicationsPage from './pages/Applications';
import LicensesPage from './pages/Licenses';
import MachinesPage from './pages/Machines';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- Protected Routes --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<ApplicationsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            
            {/* --- THIS IS THE NEW LINE --- */}
            <Route path="/licenses" element={<LicensesPage />} />
            <Route path="/machines" element={<MachinesPage />} />

            <Route path="/licenses/:licenseId/machines" element={<MachinesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App; 