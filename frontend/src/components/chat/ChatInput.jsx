import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Clear,
} from '@mui/icons-material';

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 5000,
  multiline = true,
  showAttachment = false,
  onAttachment,
}) {
  const [message, setMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSend(message.trim());
    setMessage('');

    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const insertTemplate = (template) => {
    setMessage(template);
    handleMenuClose();
    inputRef.current?.focus();
  };

  const templates = [
    'Summarize this paper',
    'What are the key findings?',
    'Compare these papers',
    'What methodology did they use?',
    'What are the limitations?',
  ];

  const characterCount = message.length;
  const isOverLimit = characterCount > maxLength;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        {/* Optional attachment button */}
        {showAttachment && onAttachment && (
          <Tooltip title="Attach file">
            <IconButton
              size="small"
              onClick={onAttachment}
              disabled={disabled}
            >
              <AttachFile />
            </IconButton>
          </Tooltip>
        )}

        {/* Text input */}
        <TextField
          fullWidth
          multiline={multiline}
          maxRows={4}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          inputRef={inputRef}
          error={isOverLimit}
          helperText={
            characterCount > 0 && (
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {isOverLimit && 'Message too long. '}
                  Press Enter to send, Shift+Enter for new line
                </span>
                <span style={{ color: isOverLimit ? 'error.main' : 'inherit' }}>
                  {characterCount}/{maxLength}
                </span>
              </Box>
            )
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              paddingRight: 0,
            },
          }}
        />

        {/* Clear button (when there's text) */}
        {message && (
          <Tooltip title="Clear">
            <IconButton
              size="small"
              onClick={() => setMessage('')}
              disabled={disabled}
            >
              <Clear />
            </IconButton>
          </Tooltip>
        )}

        {/* Templates menu */}
        <Tooltip title="Templates">
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            disabled={disabled}
          >
            <MoreVert />
          </IconButton>
        </Tooltip>

        {/* Send button */}
        <Tooltip title="Send message">
          <span>
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!message.trim() || disabled || isOverLimit}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                },
              }}
            >
              <Send />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Templates menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
          Quick Templates
        </MenuItem>
        {templates.map((template, idx) => (
          <MenuItem
            key={idx}
            onClick={() => insertTemplate(template)}
            sx={{ fontSize: '0.875rem' }}
          >
            {template}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}