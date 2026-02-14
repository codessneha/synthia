import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Drawer,
} from '@mui/material';
import {
  Send,
  ArrowBack,
  Info,
  SmartToy,
  Person,
  Description,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Components
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import PaperCard from '../../components/papers/PaperCard';
import PaperDetailsDialog from '../../components/papers/PaperDetailsDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  useEffect(() => {
    fetchSession();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${id}`);
      const sessionData = response.data.data.session;
      setSession(sessionData);
      setMessages(sessionData.messages || []);
    } catch (error) {
      console.error('Fetch session error:', error);
      toast.error('Failed to load session');
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content) => {
    setSending(true);

    // Add user message immediately
    const userMessage = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content: content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await api.post(`/chat/${id}/message`, {
        content: content,
      });

      // Add AI response
      const aiMessage = response.data.data.message;
      setMessages(prev => [...prev, aiMessage]);

      // Update session stats/context in background if needed
      // (The new message is already in state, so we don't strictly need fetchSession immediately for the chat UI)
      // fetchSession(); 
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(m => m._id !== userMessage._id));
    } finally {
      setSending(false);
    }
  };


  if (loading) {
    return <LoadingSpinner fullScreen message="Loading session details..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ p: 2, borderRadius: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => navigate('/sessions')}>
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {session.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {session.papers?.length || 0} paper(s) • {messages.length} message(s)
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDrawerOpen(true)}>
              <Info />
            </IconButton>
          </Box>
        </Paper>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 3,
            bgcolor: 'background.default',
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SmartToy sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Start a conversation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ask me anything about the papers in this session
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={message._id || index}
                  message={message}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {sending && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SmartToy />
              </Avatar>
              <Paper sx={{ p: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                  Thinking...
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2 }}>
          <ChatInput
            onSend={handleSendMessage}
            disabled={sending}
            placeholder="Ask a question about your research..."
          />
        </Box>
      </Box>

      {/* Info Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Session Info
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            {session.description || 'No description'}
          </Typography>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Papers in Session
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {session.papers && session.papers.length > 0 ? (
              session.papers.map((item) => (
                <PaperCard
                  key={item._id || item.paper?._id}
                  paper={item.paper || item}
                  variant="compact"
                  onView={(p) => setSelectedPaper(p)}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No papers added yet
              </Typography>
            )}
          </Box>

          {session.tags && session.tags.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {session.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} size="small" />
                ))}
              </Box>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Statistics
          </Typography>
          <Typography variant="body2">
            Messages: {messages.length}
          </Typography>
          <Typography variant="body2">
            Created: {new Date(session.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="body2">
            Last updated: {new Date(session.updatedAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Drawer>

      {/* Paper Details Dialog */}
      <PaperDetailsDialog
        open={Boolean(selectedPaper)}
        onClose={() => setSelectedPaper(null)}
        paper={selectedPaper}
      />
    </Box>
  );
}