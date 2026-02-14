import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning, Info, Error as ErrorIcon, CheckCircle } from '@mui/icons-material';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning', // 'warning', 'error', 'info', 'success'
  loading = false,
}) {
  const severityConfig = {
    warning: {
      icon: Warning,
      color: 'warning.main',
      buttonColor: 'warning',
    },
    error: {
      icon: ErrorIcon,
      color: 'error.main',
      buttonColor: 'error',
    },
    info: {
      icon: Info,
      color: 'info.main',
      buttonColor: 'primary',
    },
    success: {
      icon: CheckCircle,
      color: 'success.main',
      buttonColor: 'success',
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon sx={{ color: config.color }} />
          {title}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={config.buttonColor}
          variant="contained"
          disabled={loading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}