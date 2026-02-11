import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Delete,
  Visibility,
  Download,
  FormatQuote,
  FilterList,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Papers() {
  const [activeTab, setActiveTab] = useState(0);
  const [papers, setPapers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('arxiv');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 0) {
      fetchMyPapers();
    }
  }, [activeTab]);

  const fetchMyPapers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/papers', {
        params: { myPapers: true, limit: 50 }
      });
      setPapers(response.data.data.papers || []);
    } catch (error) {
      console.error('Fetch papers error:', error);
      toast.error('Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/search/${searchSource}`, {
        params: { q: searchQuery, max: 20 }
      });
      setSearchResults(response.data.data.papers || []);
      setActiveTab(1);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaper = async (paper) => {
    try {
      const paperData = {
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        keywords: paper.keywords || [],
        publicationDate: paper.publicationDate,
        source: paper.source,
        sourceUrl: paper.sourceUrl,
        arxivId: paper.arxivId,
        pubmedId: paper.pubmedId,
        doi: paper.doi,
        pdfUrl: paper.pdfUrl,
        category: paper.category || 'Other',
      };

      await api.post('/papers', paperData);
      toast.success('Paper added to your library!');
      fetchMyPapers();
      setActiveTab(0);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add paper';
      toast.error(message);
    }
  };

  const handleDeletePaper = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) {
      return;
    }

    try {
      await api.delete(`/papers/${paperId}`);
      toast.success('Paper deleted');
      setPapers(papers.filter(p => p._id !== paperId));
    } catch (error) {
      toast.error('Failed to delete paper');
    }
  };

  const handleViewDetails = (paper) => {
    setSelectedPaper(paper);
    setDetailsOpen(true);
  };

  const PaperCard = ({ paper, isSearchResult = false }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Chip label={paper.source} size="small" color="primary" />
            {!isSearchResult && (
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontWeight: 600,
            fontSize: '1rem',
          }}>
            {paper.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {paper.authors?.slice(0, 3).map(a => a.name || a).join(', ')}
            {paper.authors?.length > 3 && ' et al.'}
          </Typography>

          {paper.publicationDate && (
            <Typography variant="caption" color="text.secondary">
              {new Date(paper.publicationDate).getFullYear()}
            </Typography>
          )}

          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {paper.abstract}
          </Typography>

          {paper.keywords && paper.keywords.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {paper.keywords.slice(0, 3).map((keyword, idx) => (
                <Chip key={idx} label={keyword} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => handleViewDetails(paper)}
          >
            Details
          </Button>
          {isSearchResult ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleAddPaper(paper)}
            >
              Add
            </Button>
          ) : (
            paper.pdfUrl && (
              <Button
                size="small"
                startIcon={<Download />}
                href={paper.pdfUrl}
                target="_blank"
              >
                PDF
              </Button>
            )
          )}
        </CardActions>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleViewDetails(paper);
            handleMenuClose();
          }}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View Details
          </MenuItem>
          <MenuItem onClick={() => {
            // TODO: Generate citation
            handleMenuClose();
          }}>
            <FormatQuote sx={{ mr: 1 }} fontSize="small" />
            Generate Citation
          </MenuItem>
          <MenuItem onClick={() => {
            handleDeletePaper(paper._id);
            handleMenuClose();
          }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Papers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search and manage your research papers
        </Typography>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search papers by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              value={searchSource}
              onChange={(e) => setSearchSource(e.target.value)}
              label="Source"
            >
              <MenuItem value="arxiv">arXiv</MenuItem>
              <MenuItem value="pubmed">PubMed</MenuItem>
              <MenuItem value="all">All Sources</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`My Papers (${papers.length})`} />
          <Tab label={`Search Results (${searchResults.length})`} />
        </Tabs>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* My Papers Tab */}
          {activeTab === 0 && (
            papers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Search sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No papers in your library yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Search for papers and add them to your library
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => setActiveTab(1)}
                >
                  Search Papers
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {papers.map((paper) => (
                  <Grid item xs={12} md={6} lg={4} key={paper._id}>
                    <PaperCard paper={paper} />
                  </Grid>
                ))}
              </Grid>
            )
          )}

          {/* Search Results Tab */}
          {activeTab === 1 && (
            searchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Search sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No search results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try searching with different keywords
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {searchResults.map((paper, idx) => (
                  <Grid item xs={12} md={6} lg={4} key={idx}>
                    <PaperCard paper={paper} isSearchResult />
                  </Grid>
                ))}
              </Grid>
            )
          )}
        </>
      )}

      {/* Paper Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPaper && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ flexGrow: 1, pr: 2 }}>
                  {selectedPaper.title}
                </Typography>
                <Chip label={selectedPaper.source} color="primary" />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Authors
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedPaper.authors?.map(a => a.name || a).join(', ')}
              </Typography>

              {selectedPaper.publicationDate && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Publication Date
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {new Date(selectedPaper.publicationDate).toLocaleDateString()}
                  </Typography>
                </>
              )}

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Abstract
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedPaper.abstract}
              </Typography>

              {selectedPaper.keywords && selectedPaper.keywords.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {selectedPaper.keywords.map((keyword, idx) => (
                      <Chip key={idx} label={keyword} size="small" />
                    ))}
                  </Box>
                </>
              )}

              {selectedPaper.doi && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    DOI
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedPaper.doi}
                  </Typography>
                </>
              )}
            </DialogContent>
            <DialogActions>
              {selectedPaper.pdfUrl && (
                <Button
                  startIcon={<Download />}
                  href={selectedPaper.pdfUrl}
                  target="_blank"
                >
                  Download PDF
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}