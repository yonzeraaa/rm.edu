import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      mobile: 480,
      tablet: 768,
      laptop: 1024,
      desktop: 1200,
      highRes: 1600
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
          '@media (max-width: 600px)': {
            minHeight: 56,
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            minHeight: 56,
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            padding: '6px 16px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            padding: 8,
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      '@media (max-width: 600px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      '@media (max-width: 600px)': {
        fontSize: '1.75rem',
      },
    },
    h3: {
      '@media (max-width: 600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      '@media (max-width: 600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      '@media (max-width: 600px)': {
        fontSize: '1.1rem',
      },
    },
    h6: {
      '@media (max-width: 600px)': {
        fontSize: '1rem',
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
