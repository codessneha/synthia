import { Typography, Box, Paper } from '@mui/material';

export default function Sessions() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                Analysis Sessions
            </Typography>
            <Paper sx={{ p: 4, mt: 2 }}>
                <Typography variant="body1">
                    View your past and active AI-powered research analysis sessions.
                </Typography>
            </Paper>
        </Box>
    );
}
