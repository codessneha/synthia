import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Download,
  FormatQuote,
  Delete,
  Bookmark,
  BookmarkBorder,
  Share,
  Edit,
} from '@mui/icons-material';

export default function PaperCard({ 
  paper, 
  onView, 
  onDelete, 
  onGenerateCitation,
  onBookmark,
  variant = 'default' // 'default', 'compact', 'detailed'
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(paper.isBookmarked || false);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    if (onBookmark) onBookmark(paper._id, !isBookmarked);
  };

  const getAuthorString = () => {
    if (!paper.authors || paper.authors.length === 0) return 'Unknown Author';
    const authors = paper.authors.slice(0, 3).map(a => a.name || a);
    return authors.join(', ') + (paper.authors.length > 3 ? ' et al.' : '');
  };

  const getYearString = () => {
    if (!paper.publicationDate) return 'N/A';
    return new Date(paper.publicationDate).getFullYear();
  };

  // Compact variant - for lists
  if (variant === 'compact') {
    return (
      <Card 
        sx={{ 
          mb: 1, 
          cursor: 'pointer',
          '&:hover': { boxShadow: 2 },
          transition: 'box-shadow 0.2s'
        }}
        onClick={() => onView && onView(paper)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flexGrow: 1, mr: 2 }}>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {paper.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getAuthorString()} • {getYearString()}
              </Typography>
            </Box>
            <Chip label={paper.source} size="small" color="primary" />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Default variant - for grids
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': { boxShadow: 4 },
        transition: 'box-shadow 0.3s'
      }}
      onClick={() => onView && onView(paper)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Chip label={paper.source} size="small" color="primary" />
          <Box>
            <IconButton 
              size="small" 
              onClick={handleBookmark}
              color={isBookmarked ? 'primary' : 'default'}
            >
              {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Title */}
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.4,
            minHeight: '2.8em'
          }}
        >
          {paper.title}
        </Typography>

        {/* Authors */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {getAuthorString()}
        </Typography>

        {/* Year and Category */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {paper.publicationDate && (
            <Chip label={getYearString()} size="small" variant="outlined" />
          )}
          {paper.category && (
            <Chip label={paper.category} size="small" variant="outlined" />
          )}
        </Box>

        {/* Abstract */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mt: 1
          }}
        >
          {paper.abstract}
        </Typography>

        {/* Keywords */}
        {paper.keywords && paper.keywords.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {paper.keywords.slice(0, 3).map((keyword, idx) => (
              <Chip 
                key={idx} 
                label={keyword} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
            {paper.keywords.length > 3 && (
              <Chip 
                label={`+${paper.keywords.length - 3}`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        )}

        {/* Stats */}
        {(paper.citationCount || paper.viewCount) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            {paper.citationCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {paper.citationCount} citations
              </Typography>
            )}
            {paper.viewCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {paper.viewCount} views
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={(e) => {
            e.stopPropagation();
            onView && onView(paper);
          }}
        >
          Details
        </Button>
        {paper.pdfUrl && (
          <Button
            size="small"
            startIcon={<Download />}
            href={paper.pdfUrl}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            PDF
          </Button>
        )}
      </CardActions>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem 
          onClick={() => {
            onView && onView(paper);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem 
          onClick={() => {
            onGenerateCitation && onGenerateCitation(paper);
            handleMenuClose();
          }}
        >
          <FormatQuote sx={{ mr: 1 }} fontSize="small" />
          Generate Citation
        </MenuItem>
        <MenuItem 
          onClick={() => {
            navigator.share && navigator.share({
              title: paper.title,
              text: paper.abstract,
              url: paper.sourceUrl
            });
            handleMenuClose();
          }}
        >
          <Share sx={{ mr: 1 }} fontSize="small" />
          Share
        </MenuItem>
        {onDelete && (
          <MenuItem 
            onClick={() => {
              onDelete(paper._id);
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