import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ContentCopy,
  ExpandMore,
  Lightbulb,
  FormatQuote,
  Compare,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PlagiarismChecker() {
  const [text, setText] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleCheck = async () => {
    if (text.length < 100) {
      toast.error('Please enter at least 100 characters');
      return;
    }

    try {
      setChecking(true);
      const response = await api.post('/plagiarism/check', { text });
      setResult(response.data.data);
      
      // Auto-load suggestions if plagiarism detected
      if (response.data.data.plagiarismScore > 10) {
        loadSuggestions(response.data.data.matches);
      }
    } catch (error) {
      console.error('Plagiarism check error:', error);
      toast.error('Failed to check plagiarism');
    } finally {
      setChecking(false);
    }
  };

  const loadSuggestions = async (matches) => {
    try {
      setLoadingSuggestions(true);
      const response = await api.post('/plagiarism/suggestions', {
        text,
        matches
      });
      setSuggestions(response.data.data);
    } catch (error) {
      console.error('Load suggestions error:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (suggestion.type === 'paraphrase') {
      // Replace original with suggestion
      const newText = text.replace(suggestion.original, suggestion.suggestion);
      setText(newText);
      toast.success('Suggestion applied');
    }
  };

  const getScoreColor = (score) => {
    if (score < 10) return 'success';
    if (score < 25) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score < 10) return <CheckCircle />;
    if (score < 25) return <Warning />;
    return <ErrorIcon />;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Plagiarism Checker
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Check your text for potential plagiarism and get suggestions for improvement
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Enter Your Text
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={15}
              placeholder="Paste your text here (minimum 100 characters)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {text.length} characters
              </Typography>
              {text.length >= 100 && (
                <Chip 
                  label="Ready to check" 
                  color="success" 
                  size="small" 
                />
              )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleCheck}
              disabled={checking || text.length < 100}
              startIcon={checking ? <CircularProgress size={20} /> : null}
            >
              {checking ? 'Checking...' : 'Check Plagiarism'}
            </Button>
          </Paper>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} lg={6}>
          {checking ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Analyzing your text...
              </Typography>
            </Box>
          ) : result ? (
            <Box>
              {/* Score Card */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Plagiarism Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getScoreIcon(result.plagiarismScore)}
                      <Typography 
                        variant="h4" 
                        fontWeight={700}
                        color={`${getScoreColor(result.plagiarismScore)}.main`}
                      >
                        {result.plagiarismScore.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(result.plagiarismScore, 100)}
                    color={getScoreColor(result.plagiarismScore)}
                    sx={{ mb: 2, height: 10, borderRadius: 5 }}
                  />

                  <Alert severity={result.summary.color} sx={{ mb: 2 }}>
                    {result.summary.message}
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Matches Found
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {result.totalMatches}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sources
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {result.matches.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Matches */}
              {result.matches.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Similar Content Found
                  </Typography>
                  
                  <List>
                    {result.matches.map((match, index) => (
                      <Box key={index}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {match.title}
                                </Typography>
                                <Chip 
                                  label={`${match.similarity.toFixed(1)}%`} 
                                  color={match.similarity > 50 ? 'error' : 'warning'}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Source: {match.source}
                                </Typography>
                                {match.matchedSegments && match.matchedSegments.length > 0 && (
                                  <Accordion sx={{ mt: 1 }}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                      <Typography variant="body2">
                                        {match.matchedSegments.length} matched segment(s)
                                      </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                      {match.matchedSegments.map((segment, idx) => (
                                        <Box key={idx} sx={{ mb: 2 }}>
                                          <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
                                            <Typography variant="body2">
                                              "{segment.originalText}"
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                              <Typography variant="caption" color="text.secondary">
                                                {segment.similarity.toFixed(1)}% match
                                              </Typography>
                                              <IconButton 
                                                size="small"
                                                onClick={() => copyToClipboard(segment.originalText)}
                                              >
                                                <ContentCopy fontSize="small" />
                                              </IconButton>
                                            </Box>
                                          </Paper>
                                        </Box>
                                      ))}
                                    </AccordionDetails>
                                  </Accordion>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < result.matches.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Suggestions */}
              {result.plagiarismScore > 10 && (
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lightbulb color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Suggestions for Improvement
                      </Typography>
                    </Box>
                    {loadingSuggestions && <CircularProgress size={20} />}
                  </Box>

                  {suggestions.length === 0 && !loadingSuggestions ? (
                    <Button
                      variant="outlined"
                      onClick={() => loadSuggestions(result.matches)}
                      startIcon={<Lightbulb />}
                    >
                      Generate Suggestions
                    </Button>
                  ) : (
                    <List>
                      {suggestions.map((suggestion, index) => (
                        <Box key={index}>
                          <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  {suggestion.type === 'paraphrase' ? (
                                    <Compare fontSize="small" color="primary" />
                                  ) : (
                                    <FormatQuote fontSize="small" color="secondary" />
                                  )}
                                  <Typography variant="body2" fontWeight={600}>
                                    {suggestion.type === 'paraphrase' ? 'Paraphrase Suggestion' : 'Citation Suggestion'}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    {suggestion.reason}
                                  </Typography>
                                  
                                  <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 1 }}>
                                    <Typography variant="body2">
                                      {suggestion.suggestion}
                                    </Typography>
                                  </Paper>

                                  {suggestion.type === 'paraphrase' && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => applySuggestion(suggestion)}
                                    >
                                      Apply Suggestion
                                    </Button>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < suggestions.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  )}
                </Paper>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Results Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your text and click "Check Plagiarism" to get started
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}