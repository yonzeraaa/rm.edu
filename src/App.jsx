import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import theme from './theme';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseViewer from './components/CourseViewer';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

function PrivateRoute({ children, requireAdmin }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/student" />;
  }

  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100vw',
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          <Header />
          <Box
            component="main"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              mt: { xs: '56px', sm: '64px' },
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/student"
                element={
                  <PrivateRoute>
                    <Box sx={{ 
                      flex: 1, 
                      p: { xs: 1, sm: 2 },
                      overflow: 'auto',
                    }}>
                      <Container maxWidth="lg">
                        <StudentDashboard />
                      </Container>
                    </Box>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute requireAdmin>
                    <Box sx={{ 
                      flex: 1, 
                      p: { xs: 1, sm: 2 },
                      overflow: 'auto',
                    }}>
                      <Container maxWidth="lg">
                        <AdminDashboard />
                      </Container>
                    </Box>
                  </PrivateRoute>
                }
              />
              <Route
                path="/course/:courseId"
                element={
                  <PrivateRoute>
                    <Box sx={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}>
                      <CourseViewer />
                    </Box>
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    {user?.role === 'ADMIN' ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <Navigate to="/student" replace />
                    )}
                  </PrivateRoute>
                }
              />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
