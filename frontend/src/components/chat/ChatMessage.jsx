import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  SmartToy,
  Person,
  ContentCopy,
  ThumbUp,
  ThumbDown,
  MoreVert,
  Check,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

export default function ChatMessage({ 
  message, 
  onCopy,
  onFeedback,
  showAvatar = true,
  compact = false
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(message.feedback || null);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) onCopy(message);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = (type) => {
    setFeedback(type);
    if (onFeedback) onFeedback(message._id, type);
    handleMenuClose();
  };

  // System message (centered, minimal)
  if (isSystem) {
    return (
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Chip 
          label={message.content} 
          size="small" 
          sx={{ 
            backgroundColor: 'action.hover',
            maxWidth: '80%'
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: compact ? 1 : 2,
        px: compact ? 1 : 0,
      }}
    >
      {/* Avatar (left for assistant) */}
      {!isUser && showAvatar && (
        <Avatar 
          sx={{ 
            bgcolor: 'primary.main', 
            mr: 1.5,
            width: compact ? 32 : 40,
            height: compact ? 32 : 40
          }}
        >
          <SmartToy fontSize={compact ? 'small' : 'medium'} />
        </Avatar>
      )}

      {/* Message bubble */}
      <Box sx={{ maxWidth: compact ? '85%' : '70%' }}>
        <Paper
          elevation={isUser ? 3 : 1}
          sx={{
            p: compact ? 1.5 : 2,
            backgroundColor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            position: 'relative',
          }}
        >
          {/* Content */}
          {isUser ? (
            <Typography 
              variant={compact ? 'body2' : 'body1'}
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {message.content}
            </Typography>
          ) : (
            <Box 
              sx={{ 
                '& p': { mb: 1, mt: 0 },
                '& p:last-child': { mb: 0 },
                '& code': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  padding: '2px 6px',
                  borderRadius: 1,
                  fontSize: '0.9em',
                },
                '& pre': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  padding: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                },
                '& ul, & ol': {
                  pl: 3,
                  my: 1,
                },
                '& li': {
                  mb: 0.5,
                },
                fontSize: compact ? '0.875rem' : '1rem',
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          )}

          {/* Metadata */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              pt: 1,
              borderTop: 1,
              borderColor: isUser ? 'rgba(255,255,255,0.2)' : 'divider',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                opacity: isUser ? 0.8 : 0.6,
                fontSize: compact ? '0.65rem' : '0.7rem',
              }}
            >
              {message.timestamp 
                ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
                : 'Just now'
              }
            </Typography>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {/* Copy button */}
              <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{ 
                    color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                    p: 0.5
                  }}
                >
                  {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* Feedback (assistant only) */}
              {isAssistant && (
                <>
                  <Tooltip title="Helpful">
                    <IconButton
                      size="small"
                      onClick={() => handleFeedback('positive')}
                      sx={{ 
                        color: feedback === 'positive' ? 'success.main' : 'text.secondary',
                        p: 0.5
                      }}
                    >
                      <ThumbUp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Not helpful">
                    <IconButton
                      size="small"
                      onClick={() => handleFeedback('negative')}
                      sx={{ 
                        color: feedback === 'negative' ? 'error.main' : 'text.secondary',
                        p: 0.5
                      }}
                    >
                      <ThumbDown fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* More options */}
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ 
                  color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                  p: 0.5
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Model info (for assistant messages) */}
          {isAssistant && message.metadata?.model && !compact && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                opacity: 0.5,
                fontSize: '0.65rem',
              }}
            >
              {message.metadata.model}
              {message.metadata.tokens && ` • ${message.metadata.tokens} tokens`}
            </Typography>
          )}
        </Paper>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleCopy}>
            <ContentCopy sx={{ mr: 1 }} fontSize="small" />
            Copy Message
          </MenuItem>
          {isAssistant && (
            <>
              <MenuItem onClick={() => handleFeedback('positive')}>
                <ThumbUp sx={{ mr: 1 }} fontSize="small" />
                Mark as Helpful
              </MenuItem>
              <MenuItem onClick={() => handleFeedback('negative')}>
                <ThumbDown sx={{ mr: 1 }} fontSize="small" />
                Mark as Not Helpful
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>

      {/* Avatar (right for user) */}
      {isUser && showAvatar && (
        <Avatar 
          sx={{ 
            bgcolor: 'secondary.main', 
            ml: 1.5,
            width: compact ? 32 : 40,
            height: compact ? 32 : 40
          }}
        >
          <Person fontSize={compact ? 'small' : 'medium'} />
        </Avatar>
      )}
    </Box>
  );
}