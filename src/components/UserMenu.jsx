import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleAdminPanel = () => {
    handleClose();
    navigate('/admin');
  };

  const handleCourses = () => {
    handleClose();
    navigate('/courses');
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const menuItems = [
    ...(user?.role !== 'ADMIN' ? [{
      label: 'Meus Cursos',
      icon: <SchoolIcon fontSize="small" />,
      onClick: handleCourses,
      color: theme.palette.primary.main,
    }] : []),
    ...(user?.role === 'ADMIN' ? [{
      label: 'Painel Admin',
      icon: <AdminIcon fontSize="small" />,
      onClick: handleAdminPanel,
      color: theme.palette.secondary.main,
    }] : []),
    {
      label: 'Sair',
      icon: <LogoutIcon fontSize="small" />,
      onClick: handleLogout,
      color: theme.palette.error.main,
      divider: true,
    },
  ];

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: '1rem',
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            border: '2px solid transparent',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              transform: 'scale(1.05)',
            },
          }}
        >
          {getInitials()}
        </Avatar>
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 320,
            overflow: 'visible',
            mt: 1.5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                fontSize: '1.2rem',
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            >
              {getInitials()}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  lineHeight: 1.2,
                }}
              >
                {user?.fullName || 'Usuário'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.875rem',
                }}
              >
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {menuItems.map((item, index) => (
          <Box key={item.label}>
            {item.divider && <Divider sx={{ my: 0.5 }} />}
            <MenuItem
              onClick={item.onClick}
              sx={{
                py: 1.5,
                px: 2.5,
                '&:hover': {
                  backgroundColor: alpha(item.color, 0.08),
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ListItemIcon sx={{ color: item.color }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {item.label}
                  </Typography>
                }
              />
            </MenuItem>
          </Box>
        ))}
      </Menu>
    </>
  );
}

export default UserMenu;
