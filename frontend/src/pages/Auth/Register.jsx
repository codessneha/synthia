import { Typography, Box, Paper } from '@mui/material';

export default function Register() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
            <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                <Typography variant="h5" gutterBottom align="center">
                    Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    Registration is currently limited. Please contact your administrator.
                </Typography>
            </Paper>
        </Box>
    );
}
