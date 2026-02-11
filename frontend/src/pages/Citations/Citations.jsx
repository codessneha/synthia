import { Typography, Box, Paper } from '@mui/material';

export default function Citations() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                My Citations
            </Typography>
            <Paper sx={{ p: 4, mt: 2 }}>
                <Typography variant="body1">
                    Export and manage your research citations in BIBTEX or RIS formats.
                </Typography>
            </Paper>
        </Box>
    );
}
