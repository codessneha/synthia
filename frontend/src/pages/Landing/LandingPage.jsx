import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Science,
  Chat,
  Search,
  Description,
  AutoAwesome,
  TrendingUp,
  FormatQuote,
  Group,
} from '@mui/icons-material';

const features = [
  {
    icon: Chat,
    title: 'AI-Powered Chat',
    description: 'Discuss research papers with AI. Ask questions, get insights, and understand complex topics easily.',
  },
  {
    icon: Search,
    title: 'Multi-Source Search',
    description: 'Search across arXiv, PubMed, Semantic Scholar, and more. Find papers from all major sources in one place.',
  },
  {
    icon: Description,
    title: 'Paper Management',
    description: 'Organize your research library. Tag, categorize, and easily access all your papers.',
  },
  {
    icon: AutoAwesome,
    title: 'Smart Analysis',
    description: 'Compare papers, identify research gaps, extract methodologies, and generate comprehensive summaries.',
  },
  {
    icon: FormatQuote,
    title: 'Citation Generator',
    description: 'Generate citations in 15+ formats instantly. Export to BibTeX, RIS, or copy formatted citations.',
  },
  {
    icon: Group,
    title: 'Collaboration',
    description: 'Share sessions with team members. Collaborate on research projects and exchange insights.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Science sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Synthia Research
          </Typography>
          <Button color="inherit" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="contained" onClick={() => navigate('/register')} sx={{ ml: 2 }}>
            Get Started
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 12,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Science sx={{ fontSize: 80, mb: 3 }} />
            <Typography variant="h2" fontWeight={700} gutterBottom>
              AI-Powered Research Assistant
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              Search, analyze, and understand academic papers with the power of AI
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Everything You Need for Research
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Powerful tools to accelerate your research workflow
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-8px)' } }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                      mb: 2,
                    }}
                  >
                    <feature.icon sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ textAlign: 'center' }}>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" fontWeight={700} color="primary">
                1M+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Papers Indexed
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" fontWeight={700} color="primary">
                50K+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Researchers
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" fontWeight={700} color="primary">
                100K+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Sessions Created
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Ready to Transform Your Research?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Join thousands of researchers using Synthia to accelerate their work
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 6, py: 2 }}
            >
              Get Started for Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Science sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  Synthia Research
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Making research smarter with AI
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Product
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>Features</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>Pricing</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Resources
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>Documentation</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>API</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Company
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>About</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>Contact</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Legal
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>Privacy</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>Terms</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: 1, borderColor: 'grey.800', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © 2026 Synthia Research. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}