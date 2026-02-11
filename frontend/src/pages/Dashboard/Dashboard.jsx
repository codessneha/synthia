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

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {},
        transition: 'box-shadow 0.3s',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: 2,
              p: 1.5,
            }}
          >
            <Icon sx={{ color, fontSize: 32 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
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
          <StatCard
            title="Total Papers"
            value={stats.totalPapers}
            icon={Description}
            color="#1976d2"
            onClick={() => navigate('/papers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Research Sessions"
            value={stats.totalSessions}
            icon={Chat}
            color="#9c27b0"
            onClick={() => navigate('/sessions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={stats.activeSessions}
            icon={TrendingUp}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Citations"
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
              <List>
                {recentSessions.map((session) => (
                  <ListItem
                    key={session._id}
                    button
                    onClick={() => navigate(`/sessions/${session._id}`)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon>
                      <Chat color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={session.name}
                      secondary={`${session.paperCount || 0} papers • Updated ${new Date(session.updatedAt).toLocaleDateString()}`}
                    />
                    {session.isPinned && <Chip label="Pinned" size="small" color="primary" />}
                  </ListItem>
                ))}
              </List>
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
              <List>
                {recentPapers.map((paper) => (
                  <ListItem
                    key={paper._id}
                    button
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {paper.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          {paper.authors?.slice(0, 2).map(a => a.name).join(', ')}
                          {paper.authors?.length > 2 && ' et al.'}
                          {' • '}
                          {paper.publicationDate ? new Date(paper.publicationDate).getFullYear() : 'N/A'}
                        </>
                      }
                    />
                    <Chip label={paper.source} size="small" />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}