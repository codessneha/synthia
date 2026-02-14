import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  Chat,
  Article,
  PushPin,
  Edit,
  Delete,
  Share,
  Archive,
  Unarchive,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

export default function SessionCard({ 
  session, 
  onPin,
  onDelete,
  onArchive,
  onShare,
  variant = 'default' // 'default', 'compact', 'detailed'
}) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    navigate(`/sessions/${session._id}`);
  };

  const paperCount = session.papers?.length || session.paperCount || 0;
  const messageCount = session.messages?.length || session.messageCount || 0;
  const lastActivity = session.stats?.lastActivityAt || session.updatedAt;

  const getStatusColor = () => {
    switch (session.status) {
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getProgressValue = () => {
    if (session.stats?.completionPercentage) {
      return session.stats.completionPercentage;
    }
    // Estimate based on messages
    if (messageCount === 0) return 0;
    if (messageCount < 10) return 30;
    if (messageCount < 50) return 60;
    return 100;
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card 
        sx={{ 
          mb: 1,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          transition: 'background-color 0.2s'
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" fontWeight={600}>
                {session.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {paperCount} papers • {messageCount} messages
              </Typography>
            </Box>
            {session.isPinned && <PushPin fontSize="small" color="primary" />}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        '&:hover': { boxShadow: 4 },
        transition: 'box-shadow 0.3s',
        position: 'relative',
        overflow: 'visible'
      }}
      onClick={handleCardClick}
    >
      {/* Pinned indicator */}
      {session.isPinned && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: 16,
            zIndex: 1
          }}
        >
          <PushPin 
            sx={{ 
              fontSize: 24,
              color: 'primary.main',
              transform: 'rotate(45deg)'
            }} 
          />
        </Box>
      )}

      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {session.name}
            </Typography>
            {session.description && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {session.description}
              </Typography>
            )}
          </Box>
          <IconButton 
            size="small" 
            onClick={handleMenuOpen}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<Article />} 
            label={`${paperCount} paper${paperCount !== 1 ? 's' : ''}`} 
            size="small"
            variant="outlined"
          />
          <Chip 
            icon={<Chat />} 
            label={`${messageCount} message${messageCount !== 1 ? 's' : ''}`} 
            size="small"
            variant="outlined"
          />
          {session.status && (
            <Chip 
              label={session.status} 
              size="small"
              color={getStatusColor()}
            />
          )}
        </Box>

        {/* Progress bar (if applicable) */}
        {variant === 'detailed' && session.status === 'active' && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getProgressValue()}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getProgressValue()} 
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>
        )}

        {/* Tags */}
        {session.tags && session.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {session.tags.slice(0, 4).map((tag, idx) => (
              <Chip 
                key={idx} 
                label={tag} 
                size="small" 
                variant="filled"
                sx={{ 
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  fontSize: '0.7rem'
                }}
              />
            ))}
            {session.tags.length > 4 && (
              <Chip 
                label={`+${session.tags.length - 4}`} 
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        )}

        {/* Collaborators */}
        {session.sharedWith && session.sharedWith.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Shared with:
            </Typography>
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
              {session.sharedWith.map((user, idx) => (
                <Tooltip key={idx} title={user.name || user.email}>
                  <Avatar>{user.name?.[0] || user.email?.[0]}</Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            {lastActivity 
              ? `Updated ${formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}`
              : 'No activity yet'
            }
          </Typography>
          {session.isPinned && (
            <Chip 
              icon={<PushPin sx={{ fontSize: '0.9rem' }} />}
              label="Pinned" 
              size="small" 
              color="primary"
              sx={{ height: 20 }}
            />
          )}
        </Box>
      </CardContent>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          handleCardClick();
          handleMenuClose();
        }}>
          <Chat sx={{ mr: 1 }} fontSize="small" />
          Open Session
        </MenuItem>
        <MenuItem onClick={() => {
          onPin && onPin(session._id, !session.isPinned);
          handleMenuClose();
        }}>
          <PushPin sx={{ mr: 1 }} fontSize="small" />
          {session.isPinned ? 'Unpin' : 'Pin'}
        </MenuItem>
        {onShare && (
          <MenuItem onClick={() => {
            onShare(session);
            handleMenuClose();
          }}>
            <Share sx={{ mr: 1 }} fontSize="small" />
            Share
          </MenuItem>
        )}
        {session.status !== 'archived' && onArchive && (
          <MenuItem onClick={() => {
            onArchive(session._id);
            handleMenuClose();
          }}>
            <Archive sx={{ mr: 1 }} fontSize="small" />
            Archive
          </MenuItem>
        )}
        {session.status === 'archived' && onArchive && (
          <MenuItem onClick={() => {
            onArchive(session._id);
            handleMenuClose();
          }}>
            <Unarchive sx={{ mr: 1 }} fontSize="small" />
            Unarchive
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem 
            onClick={() => {
              onDelete(session._id);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}