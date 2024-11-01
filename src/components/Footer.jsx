import React from 'react';
import { Box, Container, Typography, Link, useTheme } from '@mui/material';

function Footer() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} MasettiEdu. Todos os direitos reservados.
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          <Link color="inherit" href="#" sx={{ mx: 1 }}>
            Termos de Uso
          </Link>
          |
          <Link color="inherit" href="#" sx={{ mx: 1 }}>
            Política de Privacidade
          </Link>
          |
          <Link color="inherit" href="#" sx={{ mx: 1 }}>
            Contato
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
