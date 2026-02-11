import { Typography, Box, Paper } from '@mui/material';

export default function Profile() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                User Profile
            </Typography>
            <Paper sx={{ p: 4, mt: 2 }}>
                <Typography variant="body1">
                    Manage your account settings and research preferences.
                </Typography>
            </Paper>
        </Box>
    );
}
