import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Description,
  Chat,
  FormatQuote,
  TrendingUp,
  Add,
  Search,
  Article,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Components
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaperCard from '../../components/papers/PaperCard';
import SessionCard from '../../components/sessions/SessionCard';
import NotificationBadge from '../../components/common/NotificationBadge';
import PaperDetailsDialog from '../../components/papers/PaperDetailsDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPapers: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalCitations: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentPapers, setRecentPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const [paperStats, sessionStats] = await Promise.all([
        api.get('/papers/stats'),
        api.get('/sessions/stats'),
      ]);

      setStats({
        totalPapers: paperStats.data.data.totalPapers || 0,
        totalSessions: sessionStats.data.data.totalSessions || 0,
        activeSessions: sessionStats.data.data.activeSessions || 0,
        totalCitations: 0, // Can add this later
      });

      // Fetch recent sessions
      const sessionsRes = await api.get('/sessions', {
        params: { limit: 5, sortBy: '-updatedAt' },
      });
      setRecentSessions(sessionsRes.data.data.sessions || []);

      // Fetch recent papers
      const papersRes = await api.get('/papers', {
        params: { limit: 5, sortBy: '-createdAt', myPapers: true },
      });
      setRecentPapers(papersRes.data.data.papers || []);

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <LoadingSpinner fullScreen message="Preparing your dashboard..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {user?.name}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your research today
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Papers"
            value={stats.totalPapers}
            icon={Description}
            color="#1976d2"
            onClick={() => navigate('/papers')}
            trend="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Research Sessions"
            value={stats.totalSessions}
            icon={Chat}
            color="#9c27b0"
            onClick={() => navigate('/sessions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Today"
            value={stats.activeSessions}
            icon={TrendingUp}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Citations"
            value={stats.totalCitations}
            icon={FormatQuote}
            color="#ed6c02"
            onClick={() => navigate('/citations')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/sessions')}
              sx={{ py: 1.5 }}
            >
              New Session
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Search />}
              onClick={() => navigate('/papers')}
              sx={{ py: 1.5 }}
            >
              Search Papers
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Article />}
              onClick={() => navigate('/papers')}
              sx={{ py: 1.5 }}
            >
              Add Paper
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FormatQuote />}
              onClick={() => navigate('/citations')}
              sx={{ py: 1.5 }}
            >
              Generate Citation
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Sessions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Sessions
              </Typography>
              <Button size="small" onClick={() => navigate('/sessions')}>
                View All
              </Button>
            </Box>

            {recentSessions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Chat sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  No sessions yet. Create your first session to get started!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/sessions')}
                  sx={{ mt: 2 }}
                >
                  Create Session
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentSessions.map((session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    variant="compact"
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Papers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Papers
              </Typography>
              <Button size="small" onClick={() => navigate('/papers')}>
                View All
              </Button>
            </Box>

            {recentPapers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  No papers yet. Search and add papers to your library!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => navigate('/papers')}
                  sx={{ mt: 2 }}
                >
                  Search Papers
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentPapers.map((paper) => (
                  <PaperCard
                    key={paper._id}
                    paper={paper}
                    variant="compact"
                    onView={(p) => setSelectedPaper(p)}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Paper Details Dialog */}
      <PaperDetailsDialog
        open={Boolean(selectedPaper)}
        onClose={() => setSelectedPaper(null)}
        paper={selectedPaper}
      />
    </Container>
  );
}