import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, PixProvider } from './context';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  PixGenerationPage,
  PixConfirmationPage,
} from './pages';

function App() {
  return (
    <AuthProvider>
      <PixProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pix/generate"
              element={
                <ProtectedRoute>
                  <PixGenerationPage />
                </ProtectedRoute>
              }
            />
            <Route path="/pix/:token" element={<PixConfirmationPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </PixProvider>
    </AuthProvider>
  );
}

export default App;
