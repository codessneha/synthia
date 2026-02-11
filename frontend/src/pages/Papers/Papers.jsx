import { Typography, Box, Paper } from '@mui/material';

export default function Papers() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                Research Papers
            </Typography>
            <Paper sx={{ p: 4, mt: 2 }}>
                <Typography variant="body1">
                    Access and manage your library of research papers here.
                </Typography>
            </Paper>
        </Box>
    );
}
