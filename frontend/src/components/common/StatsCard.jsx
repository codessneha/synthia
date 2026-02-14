import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
  trendValue,
  loading = false,
  onClick,
  subtitle,
}) {
  const colorMap = {
    primary: 'primary.main',
    secondary: 'secondary.main',
    success: 'success.main',
    error: 'error.main',
    warning: 'warning.main',
    info: 'info.main',
  };

  const bgColorMap = {
    primary: 'primary.light',
    secondary: 'secondary.light',
    success: 'success.light',
    error: 'error.light',
    warning: 'warning.light',
    info: 'info.light',
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Skeleton width={100} />
              <Skeleton width={80} height={40} />
            </Box>
            <Skeleton variant="circular" width={56} height={56} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {},
        transition: 'box-shadow 0.3s',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              color="text.secondary"
              variant="body2"
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ mb: 0.5 }}
            >
              {value}
            </Typography>
            
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}

            {/* Trend indicator */}
            {trend && trendValue && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 1,
                }}
              >
                {trend === 'up' ? (
                  <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ color: 'error.main' }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: trend === 'up' ? 'success.main' : 'error.main',
                    fontWeight: 600,
                  }}
                >
                  {trendValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last period
                </Typography>
              </Box>
            )}
          </Box>

          {Icon && (
            <Box
              sx={{
                backgroundColor: `${bgColorMap[color]}20`,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                sx={{
                  color: colorMap[color],
                  fontSize: 32,
                }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}