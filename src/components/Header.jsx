import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';

function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate(user?.role === 'ADMIN' ? '/admin' : '/student');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        background: theme.palette.primary.main,
        boxShadow: 'none',
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Container maxWidth={false}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 56, sm: 64 },
            justifyContent: 'space-between',
            px: { xs: 1, sm: 2 },
            ...(isMobile && {
              flexDirection: 'column',
              py: 1,
              gap: 1
            })
          }}
        >
          <Typography
            variant="h6"
            noWrap
            component="div"
            onClick={handleLogoClick}
            sx={{
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              letterSpacing: '.1rem',
              color: 'white',
              textDecoration: 'none',
              flexGrow: 0,
            }}
          >
            MasettiEdu
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            ...(isMobile && {
              width: '100%',
              justifyContent: 'center'
            })
          }}>
            <UserMenu />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
