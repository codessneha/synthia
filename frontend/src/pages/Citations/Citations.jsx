import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
  Autocomplete,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add,
  ContentCopy,
  Delete,
  Download,
  FormatQuote,
  Check,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CITATION_FORMATS = [
  'IEEE',
  'APA',
  'MLA',
  'Chicago',
  'Harvard',
  'Vancouver',
  'ACS',
  'AMA',
  'ASA',
  'AAA',
  'Springer',
  'Elsevier',
  'Nature',
  'Science',
  'ACM',
];

export default function Citations() {
  const [citations, setCitations] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('IEEE');
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchCitations();
    fetchPapers();
  }, []);

  const fetchCitations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/citations');
      setCitations(response.data.data.citations || []);
    } catch (error) {
      console.error('Fetch citations error:', error);
      toast.error('Failed to load citations');
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

  const handleGenerateCitation = async () => {
    if (!selectedPaper) {
      toast.error('Please select a paper');
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post('/citations', {
        paperId: selectedPaper._id,
        format: selectedFormat,
      });

      const newCitation = response.data.data.citation;
      setCitations([newCitation, ...citations]);
      toast.success('Citation generated!');
      setGenerateDialogOpen(false);
      setSelectedPaper(null);
    } catch (error) {
      console.error('Generate citation error:', error);
      toast.error('Failed to generate citation');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCitation = async (citation) => {
    try {
      await navigator.clipboard.writeText(citation.formattedCitation);
      setCopiedId(citation._id);
      toast.success('Citation copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy citation');
    }
  };

  const handleDeleteCitation = async (citationId) => {
    if (!window.confirm('Are you sure you want to delete this citation?')) {
      return;
    }

    try {
      await api.delete(`/citations/${citationId}`);
      setCitations(citations.filter(c => c._id !== citationId));
      toast.success('Citation deleted');
    } catch (error) {
      toast.error('Failed to delete citation');
    }
  };

  const handleExportAll = async () => {
    try {
      const response = await api.get('/citations/export', {
        params: { format: 'bibtex' },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/x-bibtex' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'citations.bib';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Citations exported!');
    } catch (error) {
      toast.error('Failed to export citations');
    }
  };

  const CitationCard = ({ citation }) => {
    const isCopied = copiedId === citation._id;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label={citation.format} size="small" color="primary" />
                {citation.isFavorite && <Chip label="Favorite" size="small" />}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {citation.paper?.title || 'Manual Entry'}
              </Typography>
            </Box>
            <Box>
              <Tooltip title={isCopied ? 'Copied!' : 'Copy citation'}>
                <IconButton
                  size="small"
                  onClick={() => handleCopyCitation(citation)}
                  color={isCopied ? 'success' : 'default'}
                >
                  {isCopied ? <Check /> : <ContentCopy />}
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => handleDeleteCitation(citation._id)}
              >
                <Delete />
              </IconButton>
            </Box>
          </Box>

          <Paper
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {citation.formattedCitation}
          </Paper>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(citation.createdAt).toLocaleDateString()}
            </Typography>
            {citation.project && (
              <Chip label={citation.project} size="small" variant="outlined" />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Group citations by format
  const citationsByFormat = citations.reduce((acc, citation) => {
    const format = citation.format;
    if (!acc[format]) acc[format] = [];
    acc[format].push(citation);
    return acc;
  }, {});

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Citations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and manage citations in multiple formats
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {citations.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportAll}
            >
              Export All
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate Citation
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      {citations.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {citations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Citations
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {Object.keys(citationsByFormat).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formats Used
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {new Set(citations.map(c => c.paper?._id).filter(Boolean)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Papers
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {citations.filter(c => c.isFavorite).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Favorites
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Citations List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : citations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FormatQuote sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No citations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate your first citation from your papers
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate Citation
          </Button>
        </Box>
      ) : (
        <Box>
          {Object.entries(citationsByFormat).map(([format, formatCitations]) => (
            <Box key={format} sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {format} ({formatCitations.length})
              </Typography>
              {formatCitations.map((citation) => (
                <CitationCard key={citation._id} citation={citation} />
              ))}
            </Box>
          ))}
        </Box>
      )}

      {/* Generate Citation Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Citation</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Autocomplete
              options={papers}
              getOptionLabel={(option) => option.title}
              value={selectedPaper}
              onChange={(e, newValue) => setSelectedPaper(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Paper"
                  placeholder="Search papers..."
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.authors?.slice(0, 2).map(a => a.name).join(', ')}
                      {option.authors?.length > 2 && ' et al.'}
                    </Typography>
                  </Box>
                </li>
              )}
              sx={{ mb: 3 }}
            />

            <TextField
              select
              fullWidth
              label="Citation Format"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              {CITATION_FORMATS.map((format) => (
                <MenuItem key={format} value={format}>
                  {format}
                </MenuItem>
              ))}
            </TextField>

            {selectedPaper && (
              <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Paper Preview:
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedPaper.title}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedPaper.authors?.map(a => a.name).join(', ')}
                  {' • '}
                  {selectedPaper.publicationDate 
                    ? new Date(selectedPaper.publicationDate).getFullYear()
                    : 'N/A'}
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateCitation}
            disabled={!selectedPaper || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <FormatQuote />}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}