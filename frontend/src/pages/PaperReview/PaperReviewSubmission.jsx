import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  LinearProgress,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  UploadFile,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  ExpandMore,
  Download,
  Refresh,
  Edit,
  AutoAwesome,
  Assignment,
  Spellcheck,
  FormatQuote,
  Psychology,
  School,
  FactCheck,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const steps = ['Submit Paper', 'AI Analysis', 'Review Results', 'Improvements'];

const sectionTypes = [
  { value: 'abstract', label: 'Abstract' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'literature_review', label: 'Literature Review' },
  { value: 'methodology', label: 'Methodology' },
  { value: 'results', label: 'Results' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'conclusion', label: 'Conclusion' },
  { value: 'references', label: 'References' },
];

export default function PaperReviewSubmission() {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
  
  // Paper data
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [sections, setSections] = useState([]);
  const [file, setFile] = useState(null);
  
  // Review data
  const [reviewId, setReviewId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState(false);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const addSection = () => {
    setSections([...sections, { type: 'introduction', content: '' }]);
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title) {
      toast.error('Please enter a title');
      return;
    }

    if (uploadMethod === 'file' && !file) {
      toast.error('Please select a file');
      return;
    }

    if (uploadMethod === 'text' && sections.length === 0) {
      toast.error('Please add at least one section');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      if (abstract) formData.append('abstract', abstract);
      
      if (uploadMethod === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('sections', JSON.stringify(sections));
      }

      const response = await api.post('/paper-review/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setReviewId(response.data.data._id);
      toast.success('Paper submitted successfully!');
      setActiveStep(1);
      
      // Auto-start analysis
      handleAnalyze(response.data.data._id);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit paper');
    }
  };

  const handleAnalyze = async (id = reviewId) => {
    try {
      setAnalyzing(true);
      setActiveStep(1);

      const response = await api.post(`/paper-review/analyze/${id}`, {
        analysisTypes: [
          'structure',
          'writing_quality',
          'citations',
          'plagiarism',
          'methodology',
          'clarity',
          'academic_tone'
        ]
      });

      setAnalysis(response.data.data);
      toast.success('Analysis complete!');
      setActiveStep(2);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle />;
    if (score >= 60) return <Warning />;
    return <ErrorIcon />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'error',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return colors[severity] || 'default';
  };

  const AnalysisCard = ({ title, icon: Icon, data, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon color={color} />
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {data?.score !== undefined && getScoreIcon(data.score)}
            <Typography 
              variant="h5" 
              fontWeight={700}
              color={`${getScoreColor(data.score)}.main`}
            >
              {data.score?.toFixed(0)}%
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={data?.score || 0}
          color={getScoreColor(data?.score || 0)}
          sx={{ mb: 2, height: 8, borderRadius: 4 }}
        />

        {data?.issues && data.issues.length > 0 && (
          <List dense>
            {data.issues.slice(0, 3).map((issue, idx) => (
              <ListItem key={idx} sx={{ px: 0 }}>
                <ListItemIcon>
                  <ErrorIcon fontSize="small" color={getSeverityColor(issue.severity)} />
                </ListItemIcon>
                <ListItemText 
                  primary={issue.message}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {data?.suggestions && data.suggestions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Suggestions:
            </Typography>
            {data.suggestions.slice(0, 2).map((suggestion, idx) => (
              <Chip
                key={idx}
                label={suggestion}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Research Paper Review & Improvement
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Submit your draft research paper and get comprehensive AI-powered feedback
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 1: Submit Paper */}
      {activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Submit Your Research Paper
          </Typography>

          <Tabs value={uploadMethod} onChange={(e, v) => setUploadMethod(v)} sx={{ mb: 3 }}>
            <Tab value="file" label="Upload File (PDF, DOC, TXT)" icon={<UploadFile />} />
            <Tab value="text" label="Enter Text Manually" icon={<Edit />} />
          </Tabs>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Paper Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Abstract (Optional)"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                multiline
                rows={4}
              />
            </Grid>

            {uploadMethod === 'file' ? (
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                  }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  
                  <UploadFile sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  
                  {file ? (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {file.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Click to upload file
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ) : (
              <Grid item xs={12}>
                {sections.map((section, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            select
                            fullWidth
                            label="Section Type"
                            value={section.type}
                            onChange={(e) => updateSection(index, 'type', e.target.value)}
                            SelectProps={{ native: true }}
                          >
                            {sectionTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={9}>
                          <TextField
                            fullWidth
                            label="Content"
                            value={section.content}
                            onChange={(e) => updateSection(index, 'content', e.target.value)}
                            multiline
                            rows={4}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeSection(index)}
                          >
                            Remove Section
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={addSection}
                  fullWidth
                >
                  Add Section
                </Button>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                fullWidth
                startIcon={<CheckCircle />}
              >
                Submit for AI Review
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Step 2: Analyzing */}
      {activeStep === 1 && analyzing && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={80} />
          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
            Analyzing your paper...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This may take 1-2 minutes. We're checking structure, quality, citations, plagiarism, and more.
          </Typography>
        </Box>
      )}

      {/* Step 3: Results */}
      {activeStep === 2 && analysis && (
        <Box>
          {/* Overall Score */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Overall Quality Score
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Based on 7 comprehensive criteria
                  </Typography>
                </Box>
                <Typography variant="h2" fontWeight={700}>
                  {analysis.overall_score?.toFixed(0)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Analysis Categories */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {analysis.structure && (
              <Grid item xs={12} md={6}>
                <AnalysisCard
                  title="Structure"
                  icon={Assignment}
                  data={analysis.structure}
                  color="primary"
                />
              </Grid>
            )}

            {analysis.writing_quality && (
              <Grid item xs={12} md={6}>
                <AnalysisCard
                  title="Writing Quality"
                  icon={Spellcheck}
                  data={analysis.writing_quality}
                  color="secondary"
                />
              </Grid>
            )}

            {analysis.citations && (
              <Grid item xs={12} md={6}>
                <AnalysisCard
                  title="Citations"
                  icon={FormatQuote}
                  data={analysis.citations}
                  color="info"
                />
              </Grid>
            )}

            {analysis.plagiarism && (
              <Grid item xs={12} md={6}>
                <AnalysisCard
                  title="Originality"
                  icon={FactCheck}
                  data={analysis.plagiarism}
                  color="success"
                />
              </Grid>
            )}

            {analysis.methodology && (
              <Grid item xs={12} md={6}>
                <AnalysisCard
                  title="Methodology"
                  icon={Psychology}
                  data={analysis.methodology}
                  color="warning"
                />
              </Grid>
            )}

            {analysis.clarity && (
              <Grid item xs={12} md={6}>
                <AnalysisCard
                  title="Clarity"
                  icon={Info}
                  data={analysis.clarity}
                  color="info"
                />
              </Grid>
            )}

            {analysis.academic_tone && (
              <Grid item xs={12} md={6}>
                <AnalysisCard
                  title="Academic Tone"
                  icon={School}
                  data={analysis.academic_tone}
                  color="primary"
                />
              </Grid>
            )}
          </Grid>

          {/* Improvement Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
                Improvement Suggestions
              </Typography>

              <List>
                {analysis.suggestions.map((suggestion, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Chip
                          label={suggestion.priority}
                          color={getSeverityColor(suggestion.priority)}
                          size="small"
                        />
                        <Typography fontWeight={600}>
                          {suggestion.title}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {suggestion.description}
                      </Typography>
                      
                      {suggestion.actions && suggestion.actions.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" fontWeight={600}>
                            Action Steps:
                          </Typography>
                          <List dense>
                            {suggestion.actions.map((action, idx) => (
                              <ListItem key={idx} sx={{ px: 0 }}>
                                <ListItemIcon>
                                  <CheckCircle fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText primary={action} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </List>
            </Paper>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              startIcon={<Refresh />}
              onClick={() => handleAnalyze()}
            >
              Re-analyze
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
              >
                Export Report
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
              >
                View Improvements
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
}