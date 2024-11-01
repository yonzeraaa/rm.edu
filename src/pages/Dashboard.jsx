import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === 'STUDENT') {
        navigate('/student');
      } else if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        setIsLoading(false);
      }
    }, 2000); // 2 second delay for demonstration

    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box 
        className="card-3d"
        sx={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: isMobile ? '20px' : '40px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ color: 'primary.main' }}>
          Bem-vindo ao MasettiEdu
        </Typography>
        {isLoading ? (
          <>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              Redirecionando para sua área...
            </Typography>
            <CircularProgress />
          </>
        ) : (
          <Typography variant="body1" paragraph>
            Por favor, faça login para acessar sua área.
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default Dashboard;
