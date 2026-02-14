import { Badge, IconButton, Tooltip } from '@mui/material';
import { Notifications } from '@mui/icons-material';

export default function NotificationBadge({ 
  count = 0, 
  onClick,
  showZero = false,
  max = 99,
  color = 'error',
  size = 'medium',
}) {
  return (
    <Tooltip title={`${count} notification${count !== 1 ? 's' : ''}`}>
      <IconButton onClick={onClick} size={size}>
        <Badge
          badgeContent={count}
          color={color}
          max={max}
          showZero={showZero}
        >
          <Notifications />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}