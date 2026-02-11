import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  Lock,
  Delete,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    institution: user?.institution || '',
    researchInterests: user?.researchInterests?.join(', ') || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deletePassword, setDeletePassword] = useState('');

  const [preferences, setPreferences] = useState({
    citationFormat: user?.preferences?.citationFormat || 'IEEE',
    theme: user?.preferences?.theme || 'light',
    emailNotifications: user?.preferences?.notifications?.email ?? true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const updateData = {
        ...formData,
        researchInterests: formData.researchInterests
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };

      const response = await api.put('/users/profile', updateData);
      updateUser(response.data.data.user);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      await api.put('/users/preferences', preferences);
      toast.success('Preferences updated!');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      await api.delete('/users/account', {
        data: { password: deletePassword }
      });
      toast.success('Account deleted');
      await logout();
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account settings and preferences
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Profile Information
                </Typography>
                {!editing ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user?.name || '',
                          email: user?.email || '',
                          institution: user?.institution || '',
                          researchInterests: user?.researchInterests?.join(', ') || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Institution (Optional)"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Research Interests"
                    name="researchInterests"
                    value={formData.researchInterests}
                    onChange={handleChange}
                    disabled={!editing}
                    helperText="Separate with commas (e.g., AI, Machine Learning, NLP)"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Preferences
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Default Citation Format"
                    name="citationFormat"
                    value={preferences.citationFormat}
                    onChange={handlePreferenceChange}
                  >
                    <MenuItem value="IEEE">IEEE</MenuItem>
                    <MenuItem value="APA">APA</MenuItem>
                    <MenuItem value="MLA">MLA</MenuItem>
                    <MenuItem value="Chicago">Chicago</MenuItem>
                    <MenuItem value="Harvard">Harvard</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Theme"
                    name="theme"
                    value={preferences.theme}
                    onChange={handlePreferenceChange}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark (Coming Soon)</MenuItem>
                    <MenuItem value="auto">Auto (Coming Soon)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                onClick={handleSavePreferences}
                disabled={loading}
                sx={{ mt: 3 }}
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Avatar Card */}
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  mb: 2,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Member since {new Date(user?.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Security
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => setPasswordDialogOpen(true)}
                sx={{ mb: 2 }}
              >
                Change Password
              </Button>
              <Divider sx={{ my: 2 }} />
              <Alert severity="warning" sx={{ mb: 2 }}>
                Deleting your account is permanent and cannot be undone.
              </Alert>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            margin="normal"
            helperText="At least 8 characters"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <TextField
            fullWidth
            type="password"
            label="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={loading || !deletePassword}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}