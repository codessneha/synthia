import { Box, Container, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Science, Dashboard, Book, History, Bookmark, Person, ExitToApp } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function MainLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
        { label: 'Papers', path: '/papers', icon: <Book /> },
        { label: 'Sessions', path: '/sessions', icon: <History /> },
        { label: 'Citations', path: '/citations', icon: <Bookmark /> },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Science sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                        Synthia
                    </Typography>
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.path}
                                color="inherit"
                                startIcon={item.icon}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    ml: 2,
                                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent'
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>
                    <IconButton color="inherit" onClick={() => navigate('/profile')} sx={{ ml: 2 }}>
                        <Person />
                    </IconButton>
                    <IconButton color="inherit" onClick={logout} sx={{ ml: 1 }}>
                        <ExitToApp />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                {children}
            </Container>
        </Box>
    );
}
