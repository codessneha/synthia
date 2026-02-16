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
import PlagiarismChecker from './pages/Plagiarism/PlagiarismChecker';
import PaperReviewSubmission from './pages/PaperReview/PaperReviewSubmission';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layout
import MainLayout from './components/layout/MainLayout';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2563eb', // Indigo 600
            light: '#60a5fa', // Blue 400
            dark: '#1d4ed8', // Blue 700
        },
        secondary: {
            main: '#7c3aed', // Violet 600
            light: '#a78bfa', // Violet 400
            dark: '#5b21b6', // Violet 700
        },
        background: {
            default: '#f8fafc', // Slate 50
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b', // Slate 800
            secondary: '#64748b', // Slate 500
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 16px',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    '&:hover': {
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    },
                    transition: 'box-shadow 0.3s ease-in-out',
                },
            },
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <ErrorBoundary>
                    <BrowserRouter
                        future={{
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }}
                    >
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Routes */}
                            <Route
                                path="/plagiarism"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <PlagiarismChecker />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/paper-review"
                                element={
                                    <ProtectedRoute>
                                        <MainLayout>
                                            <PaperReviewSubmission />
                                        </MainLayout>
                                    </ProtectedRoute>
                                }
                            />
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
                </ErrorBoundary>

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