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
import LightPillar from '../../components/LightPillar';
import PatternText from '../../components/PatternText';

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
    <Box sx={{ bgcolor: 'black', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <AppBar position="absolute" color="transparent" elevation={0} sx={{ py: 1, zIndex: 10 }}>
        <Toolbar>
          <Science sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, color: 'white' }}>
            Synthia 
          </Typography>
          <Button sx={{ color: 'white' }} onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="contained" onClick={() => navigate('/register')} sx={{ ml: 2, borderRadius: 2 }}>
            Get Started
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'radial-gradient(circle at top, rgba(118, 75, 162, 0.4) 0%, rgba(0,0,0,1) 80%)',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        {/* Light Pillar Background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <LightPillar
            topColor="#8a243d"
            bottomColor="#f3bfec"
            intensity={0.8}
            rotationSpeed={0.7}
            interactive={false}
            glowAmount={0.004}
            pillarWidth={2}
            pillarHeight={0.8}
            noiseIntensity={0.6}
            pillarRotation={60}
          />
        </Box>

        {/* Radial gradient overlay for visual depth */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(ellipse at center, rgba(118, 75, 162, 0.1), transparent 50%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Science sx={{ fontSize: 80, mb: 3 }} />
            
            {/* PatternText Heading */}
            <Box sx={{ mb: 2, overflow: 'hidden' }}>
              <PatternText 
                text="Synthia" 
                sx={{ color: 'white' }}
              />
            </Box>

            <Typography variant="h4" fontWeight={600} sx={{ mb: 4, opacity: 0.95 }}>
              AI-Powered Research Assistant
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 6, opacity: 0.7, maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}>
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
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { 
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
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
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { 
                    borderColor: 'white', 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
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
          <Typography variant="h3" fontWeight={700} gutterBottom sx={{ color: 'white' }}>
            Everything You Need for Research
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Powerful tools to accelerate your research workflow
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(118, 75, 162, 0.15)',
                      color: 'primary.light',
                      mb: 3,
                    }}
                  >
                    <feature.icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'white' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', py: 10, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ textAlign: 'center' }}>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'primary.light', mb: 1 }}>
                1M+
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                Papers Indexed
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'primary.light', mb: 1 }}>
                50K+
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                Researchers
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'primary.light', mb: 1 }}>
                100K+
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                Sessions Created
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 15 }}>
        <Container maxWidth="md">
          <Box sx={{
            textAlign: 'center',
            p: 8,
            borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.2) 0%, rgba(0,0,0,0) 100%)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <Typography variant="h3" fontWeight={700} gutterBottom sx={{ color: 'white' }}>
              Ready to Transform Your Research?
            </Typography>
            <Typography variant="h6" sx={{ mb: 6, color: 'rgba(255,255,255,0.6)' }}>
              Join thousands of researchers using Synthia to accelerate their work
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 8, py: 2, borderRadius: 2, fontSize: '1.1rem', textTransform: 'none' }}
            >
              Get Started for Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'black', color: 'white', py: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Science sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700}>
                  Synthia Research
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.5, lineHeight: 1.8 }}>
                Synthia utilizes state-of-the-art AI to help researchers navigate the vast landscape of academic literature with ease and precision.
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={4}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                    Product
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Features</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Pricing</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                    Resources
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Documentation</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>API Reference</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                    Company
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>About Us</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Contact</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                    Legal
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Privacy Policy</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Terms of Service</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', mt: 8, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.4 }}>
              © 2026 Synthia Research. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}