import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Papers from './pages/Papers/Papers';
import Sessions from './pages/Sessions/Sessions';
import SessionDetail from './pages/Sessions/SessionDetail';
import Citations from './pages/Citations/Citations';
import Profile from './pages/Profile/Profile';

// Layout
import MainLayout from './components/layout/MainLayout';

// Theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
        },
        secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

// Protected Route Component
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <MainLayout>
                                        <Dashboard />
                                    </MainLayout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/papers"
                            element={
                                <ProtectedRoute>
                                    <MainLayout>
                                        <Papers />
                                    </MainLayout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/sessions"
                            element={
                                <ProtectedRoute>
                                    <MainLayout>
                                        <Sessions />
                                    </MainLayout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/sessions/:id"
                            element={
                                <ProtectedRoute>
                                    <MainLayout>
                                        <SessionDetail />
                                    </MainLayout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/citations"
                            element={
                                <ProtectedRoute>
                                    <MainLayout>
                                        <Citations />
                                    </MainLayout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <MainLayout>
                                        <Profile />
                                    </MainLayout>
                                </ProtectedRoute>
                            }
                        />

                        {/* 404 */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>

                {/* Toast Notifications */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: '#4caf50',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            duration: 4000,
                            iconTheme: {
                                primary: '#f44336',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;