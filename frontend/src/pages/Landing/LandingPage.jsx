import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Science } from '@mui/icons-material';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                color: 'white',
                textAlign: 'center'
            }}
        >
            <Container maxWidth="md">
                <Science sx={{ fontSize: 80, mb: 4 }} />
                <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
                    Welcome to Synthia
                </Typography>
                <Typography variant="h5" sx={{ mb: 6, opacity: 0.9 }}>
                    Your AI-powered research assistant for faster scientific discovery.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/login')}
                        sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                        Sign In
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/register')}
                        sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#f5f5f5', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        Get Started
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}
