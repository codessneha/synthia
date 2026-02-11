import { Typography, Box, Paper } from '@mui/material';

export default function Dashboard() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                Research Dashboard
            </Typography>
            <Paper sx={{ p: 4, mt: 2 }}>
                <Typography variant="body1">
                    Welcome to your research headquarters. Here you can manage your papers, analysis sessions, and citations.
                </Typography>
            </Paper>
        </Box>
    );
}
