import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Chat,
  MoreVert,
  Delete,
  Edit,
  PushPin,
  Article,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Components
import SessionCard from '../../components/sessions/SessionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    papers: [],
    tags: [],
  });

  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchSessions();
    fetchPapers();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sessions');
      setSessions(response.data.data.sessions || []);
    } catch (error) {
      console.error('Fetch sessions error:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      const response = await api.get('/papers', {
        params: { myPapers: true, limit: 100 }
      });
      setPapers(response.data.data.papers || []);
    } catch (error) {
      console.error('Fetch papers error:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    try {
      const sessionData = {
        name: formData.name,
        description: formData.description,
        papers: formData.papers.map(p => p._id),
        tags: formData.tags,
      };

      const response = await api.post('/sessions', sessionData);
      toast.success('Session created!');
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '', papers: [], tags: [] });
      setSessions([response.data.data.session, ...sessions]);

      // Navigate to the new session
      navigate(`/sessions/${response.data.data.session._id}`);
    } catch (error) {
      console.error('Create session error:', error);
      toast.error('Failed to create session');
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/sessions/${deleteId}`);
      toast.success('Session deleted');
      setSessions(sessions.filter(s => s._id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const handlePinSession = async (sessionId, isPinned) => {
    try {
      await api.put(`/sessions/${sessionId}`, { isPinned: !isPinned });
      setSessions(sessions.map(s =>
        s._id === sessionId ? { ...s, isPinned: !isPinned } : s
      ));
      toast.success(isPinned ? 'Unpinned' : 'Pinned');
    } catch (error) {
      toast.error('Failed to update session');
    }
  };


  // Sort sessions: pinned first, then by date
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Research Sessions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize and chat about your research papers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
          onClick={() => setCreateDialogOpen(true)}
        >
          New Session
        </Button>
      </Box>

      {/* Sessions Grid */}
      {loading ? (
        <LoadingSpinner message="Loading sessions..." />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Chat}
          title="No sessions yet"
          description="Create your first research session to start chatting with AI about papers"
          actionLabel="Create Session"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <Grid container spacing={3}>
          {sortedSessions.map((session) => (
            <Grid item xs={12} md={6} lg={4} key={session._id}>
              <SessionCard
                session={session}
                onPin={handlePinSession}
                onDelete={(id) => setDeleteId(id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Session Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Session</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Session Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            autoFocus
            placeholder="e.g., Transformer Architecture Papers"
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            placeholder="Brief description of this session"
          />

          <Autocomplete
            multiple
            options={papers}
            getOptionLabel={(option) => option.title}
            value={formData.papers}
            onChange={(e, newValue) => setFormData({ ...formData, papers: newValue })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Papers (Optional)"
                placeholder="Select papers"
                margin="normal"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.title.substring(0, 30) + (option.title.length > 30 ? '...' : '')}
                    {...tagProps}
                    size="small"
                  />
                );
              })
            }
          />

          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formData.tags}
            onChange={(e, newValue) => setFormData({ ...formData, tags: newValue })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags (Optional)"
                placeholder="Add tags"
                margin="normal"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSession}>
            Create Session
          </Button>
        </DialogActions>
      </Dialog>
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteSession}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        confirmText="Delete"
        severity="error"
      />
    </Container>
  );
}