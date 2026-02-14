import { Box, Typography, Button } from '@mui/material';

export default function EmptyState({ 
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  size = 'medium' // 'small', 'medium', 'large'
}) {
  const iconSizes = {
    small: 48,
    medium: 80,
    large: 120,
  };

  const titleVariants = {
    small: 'body1',
    medium: 'h6',
    large: 'h5',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: size === 'small' ? 4 : size === 'medium' ? 8 : 12,
        px: 3,
      }}
    >
      {Icon && (
        <Icon
          sx={{
            fontSize: iconSizes[size],
            color: 'text.disabled',
            mb: 2,
          }}
        />
      )}
      
      <Typography
        variant={titleVariants[size]}
        color="text.secondary"
        fontWeight={600}
        gutterBottom
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {description}
        </Typography>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actionLabel && onAction && (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outlined" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}