import { Typography, Box, Paper, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

export default function SessionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <Box>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/sessions')}
                sx={{ mb: 4 }}
            >
                Back to Sessions
            </Button>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                Session Details: {id}
            </Typography>
            <Paper sx={{ p: 4, mt: 2 }}>
                <Typography variant="body1">
                    Session analysis and chat history for this specific research task.
                </Typography>
            </Paper>
        </Box>
    );
}
