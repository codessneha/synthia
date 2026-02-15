import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  AutoAwesome,
  CheckCircle,
  Error as ErrorIcon,
  Lightbulb,
  Spellcheck,
  Psychology,
  School,
  ContentCopy,
  Refresh,
  ExpandMore,
  TrendingUp,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function WritingSuggestions({ text, onTextChange }) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    grammar: [],
    style: [],
    clarity: [],
    academic: [],
    improvements: []
  });

  const analyzeTabs = [
    { label: 'Grammar', icon: Spellcheck, key: 'grammar' },
    { label: 'Style', icon: AutoAwesome, key: 'style' },
    { label: 'Clarity', icon: Psychology, key: 'clarity' },
    { label: 'Academic', icon: School, key: 'academic' },
  ];

  const handleAnalyze = async () => {
    if (!text || text.length < 50) {
      toast.error('Please enter at least 50 characters');
      return;
    }

    try {
      setLoading(true);
      
      // Call AI service for analysis
      const response = await api.post('/ai/analyze-writing', {
        text,
        analysisTypes: ['grammar', 'style', 'clarity', 'academic']
      });

      setSuggestions(response.data.data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze text');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (suggestion.replacement) {
      const newText = text.replace(suggestion.original, suggestion.replacement);
      onTextChange(newText);
      toast.success('Suggestion applied');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <ErrorIcon color="warning" />;
      case 'info': return <Lightbulb color="info" />;
      default: return <CheckCircle color="success" />;
    }
  };

  const SuggestionItem = ({ suggestion }) => (
    <ListItem
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        mb: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexGrow: 1 }}>
          <Box sx={{ mt: 0.5 }}>
            {getSeverityIcon(suggestion.severity)}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              {suggestion.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {suggestion.description}
            </Typography>

            {/* Original text */}
            {suggestion.original && (
              <Paper sx={{ p: 1.5, bgcolor: 'error.50', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Current:
                </Typography>
                <Typography variant="body2">
                  "{suggestion.original}"
                </Typography>
              </Paper>
            )}

            {/* Suggested replacement */}
            {suggestion.replacement && (
              <Paper sx={{ p: 1.5, bgcolor: 'success.50', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Suggested:
                </Typography>
                <Typography variant="body2">
                  "{suggestion.replacement}"
                </Typography>
              </Paper>
            )}

            {/* Explanation */}
            {suggestion.explanation && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {suggestion.explanation}
              </Alert>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <Chip 
            label={suggestion.category} 
            size="small" 
            color={getSeverityColor(suggestion.severity)}
            variant="outlined"
          />
          {suggestion.replacement && (
            <Tooltip title="Apply suggestion">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => applySuggestion(suggestion)}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </ListItem>
  );

  const currentSuggestions = suggestions[analyzeTabs[activeTab]?.key] || [];

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Writing Suggestions
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={loading || !text || text.length < 50}
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
        >
          {loading ? 'Analyzing...' : 'Analyze Text'}
        </Button>
      </Box>

      {/* Stats Summary */}
      {Object.values(suggestions).some(arr => arr.length > 0) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {analyzeTabs.map((tab) => {
            const count = suggestions[tab.key]?.length || 0;
            return (
              <Grid item xs={6} sm={3} key={tab.key}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <tab.icon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700}>
                    {count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tab.label}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {analyzeTabs.map((tab, index) => (
          <Tab 
            key={tab.key}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <tab.icon fontSize="small" />
                {tab.label}
                {suggestions[tab.key]?.length > 0 && (
                  <Chip 
                    label={suggestions[tab.key].length} 
                    size="small" 
                    color="primary"
                  />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Suggestions List */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Analyzing your writing...
          </Typography>
        </Box>
      ) : currentSuggestions.length > 0 ? (
        <List sx={{ maxHeight: 500, overflow: 'auto' }}>
          {currentSuggestions.map((suggestion, index) => (
            <SuggestionItem key={index} suggestion={suggestion} />
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {Object.values(suggestions).some(arr => arr.length > 0) ? (
            <>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No {analyzeTabs[activeTab]?.label.toLowerCase()} issues found
              </Typography>
            </>
          ) : (
            <>
              <Lightbulb sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No suggestions yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Analyze Text" to get AI-powered writing suggestions
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Tips */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp fontSize="small" />
            <Typography variant="body2" fontWeight={600}>
              Writing Tips
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Be concise"
                secondary="Remove unnecessary words and phrases"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Use active voice"
                secondary="Makes your writing more direct and engaging"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Vary sentence structure"
                secondary="Mix short and long sentences for better flow"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Cite your sources"
                secondary="Always attribute ideas and quotes properly"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}