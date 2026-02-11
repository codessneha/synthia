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
import ReactMarkdown from 'react-markdown';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage;
    setNewMessage('');
    setSending(true);

    // Add user message immediately
    const userMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await api.post(`/chat/${id}/message`, {
        content: messageContent,
      });

      // Add AI response
      const aiMessage = response.data.data.message;
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
      return (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Chip label={message.content} size="small" />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        {!isUser && (
          <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
            <SmartToy />
          </Avatar>
        )}

        <Paper
          sx={{
            p: 2,
            maxWidth: '70%',
            bgcolor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
          }}
        >
          {isUser ? (
            <Typography variant="body1">{message.content}</Typography>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
              fontSize: '0.7rem',
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Paper>

        {isUser && (
          <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>
            <Person />
          </Avatar>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
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
                <MessageBubble key={index} message={message} />
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
        <Paper sx={{ p: 2, borderRadius: 0 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              <Send />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Paper>
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
          <List>
            {session.papers && session.papers.length > 0 ? (
              session.papers.map((item) => (
                <ListItem key={item._id || item.paper?._id} sx={{ px: 0 }}>
                  <Description sx={{ mr: 1, color: 'primary.main' }} />
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {item.paper?.title || item.title || 'Untitled'}
                      </Typography>
                    }
                    secondary={
                      item.paper?.authors?.slice(0, 2).map(a => a.name).join(', ')
                    }
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No papers added yet
              </Typography>
            )}
          </List>

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
    </Box>
  );
}