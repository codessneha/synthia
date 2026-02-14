import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Link,
} from '@mui/material';
import {
  Close,
  Download,
  FormatQuote,
  OpenInNew,
  Share,
} from '@mui/icons-material';

export default function PaperDetailsDialog({
  open,
  onClose,
  paper,
  onGenerateCitation,
  onAddToSession,
}) {
  if (!paper) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: paper.title,
          text: paper.abstract,
          url: paper.sourceUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: 5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {paper.title}
            </Typography>
            <Chip label={paper.source} color="primary" size="small" />
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Authors */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Authors
          </Typography>
          <Typography variant="body2">
            {paper.authors?.map(a => a.name || a).join(', ') || 'Unknown'}
          </Typography>
        </Box>

        {/* Publication Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Publication Information
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {paper.publicationDate && (
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(paper.publicationDate).toLocaleDateString()}
              </Typography>
            )}
            {paper.journal?.name && (
              <Typography variant="body2">
                <strong>Journal:</strong> {paper.journal.name}
              </Typography>
            )}
            {paper.category && (
              <Typography variant="body2">
                <strong>Category:</strong> {paper.category}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Abstract */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Abstract
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'justify' }}>
            {paper.abstract}
          </Typography>
        </Box>

        {/* Keywords */}
        {paper.keywords && paper.keywords.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Keywords
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {paper.keywords.map((keyword, idx) => (
                <Chip key={idx} label={keyword} size="small" />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Identifiers */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Identifiers
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {paper.doi && (
              <Typography variant="body2">
                <strong>DOI:</strong>{' '}
                <Link href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener">
                  {paper.doi}
                </Link>
              </Typography>
            )}
            {paper.arxivId && (
              <Typography variant="body2">
                <strong>arXiv ID:</strong>{' '}
                <Link href={`https://arxiv.org/abs/${paper.arxivId}`} target="_blank" rel="noopener">
                  {paper.arxivId}
                </Link>
              </Typography>
            )}
            {paper.pubmedId && (
              <Typography variant="body2">
                <strong>PubMed ID:</strong>{' '}
                <Link href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pubmedId}`} target="_blank" rel="noopener">
                  {paper.pubmedId}
                </Link>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Stats */}
        {(paper.citationCount || paper.viewCount) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Statistics
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {paper.citationCount > 0 && (
                <Typography variant="body2">
                  <strong>Citations:</strong> {paper.citationCount}
                </Typography>
              )}
              {paper.viewCount > 0 && (
                <Typography variant="body2">
                  <strong>Views:</strong> {paper.viewCount}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {paper.sourceUrl && (
          <Button
            startIcon={<OpenInNew />}
            href={paper.sourceUrl}
            target="_blank"
          >
            View Source
          </Button>
        )}
        {paper.pdfUrl && (
          <Button
            startIcon={<Download />}
            href={paper.pdfUrl}
            target="_blank"
          >
            Download PDF
          </Button>
        )}
        {navigator.share && (
          <Button startIcon={<Share />} onClick={handleShare}>
            Share
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {onGenerateCitation && (
          <Button
            variant="outlined"
            startIcon={<FormatQuote />}
            onClick={() => onGenerateCitation(paper)}
          >
            Generate Citation
          </Button>
        )}
        {onAddToSession && (
          <Button
            variant="contained"
            onClick={() => onAddToSession(paper)}
          >
            Add to Session
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}