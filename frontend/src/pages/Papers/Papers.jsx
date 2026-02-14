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

// Components
import PaperCard from '../../components/papers/PaperCard';
import PaperDetailsDialog from '../../components/papers/PaperDetailsDialog';
import SearchBar from '../../components/papers/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function Papers() {
  const [activeTab, setActiveTab] = useState(0);
  const [papers, setPapers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('arxiv');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

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

  const handleSearch = async (filters) => {
    try {
      setLoading(true);
      const response = await api.get(`/search/${filters.source}`, {
        params: { q: filters.query, max: 20, ...filters }
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

  const handleDeletePaper = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/papers/${deleteId}`);
      toast.success('Paper deleted');
      setPapers(papers.filter(p => p._id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete paper');
    }
  };

  const handleViewDetails = (paper) => {
    setSelectedPaper(paper);
    setDetailsOpen(true);
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
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`My Papers (${papers.length})`} />
          <Tab label={`Search Results (${searchResults.length})`} />
        </Tabs>
      </Box>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Searching for papers..." />
      ) : (
        <>
          {/* My Papers Tab */}
          {activeTab === 0 && (
            papers.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No papers in your library yet"
                description="Search for papers and add them to your library to build your research collection"
                actionLabel="Search Papers"
                onAction={() => setActiveTab(1)}
              />
            ) : (
              <Grid container spacing={3}>
                {papers.map((paper) => (
                  <Grid item xs={12} md={6} lg={4} key={paper._id}>
                    <PaperCard
                      paper={paper}
                      onView={(p) => setSelectedPaper(p)}
                      onDelete={(id) => setDeleteId(id)}
                    />
                  </Grid>
                ))}
              </Grid>
            )
          )}

          {/* Search Results Tab */}
          {activeTab === 1 && (
            searchResults.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No search results"
                description="Try searching with different keywords or source to find research papers"
              />
            ) : (
              <Grid container spacing={3}>
                {searchResults.map((paper, idx) => (
                  <Grid item xs={12} md={6} lg={4} key={idx}>
                    <PaperCard
                      paper={paper}
                      onView={(p) => setSelectedPaper(p)}
                      onAddToSession={(p) => handleAddPaper(p)}
                    />
                  </Grid>
                ))}
              </Grid>
            )
          )}
        </>
      )}

      {/* Paper Details Dialog */}
      <PaperDetailsDialog
        open={Boolean(selectedPaper)}
        onClose={() => setSelectedPaper(null)}
        paper={selectedPaper}
        onAddToSession={activeTab === 1 ? handleAddPaper : null}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeletePaper}
        title="Delete Paper"
        message="Are you sure you want to delete this paper from your library? Any associated sessions will still refer to it by ID but may not show full details."
        confirmText="Delete"
        severity="error"
      />
    </Container>
  );
}