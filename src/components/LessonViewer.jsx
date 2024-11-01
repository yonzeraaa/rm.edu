import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Snackbar,
  alpha,
  Fade,
  LinearProgress,
} from '@mui/material';
import { PlayCircleOutline, CheckCircle } from '@mui/icons-material';
import { studentService } from '../services/api';
import LessonContent from './lesson/LessonContent';

function LessonViewer({ lesson, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (lesson) {
      startActivity();
      setCompleted(lesson.progress?.some(p => p.completed) || false);
    }
    return () => {
      if (activity) {
        endActivity();
      }
    };
  }, [lesson]);

  const startActivity = async () => {
    try {
      const result = await studentService.startActivity({
        type: 'LESSON',
        resourceId: lesson.id,
      });
      setActivity(result);
      setLoading(false);
    } catch (error) {
      console.error('Error starting activity:', error);
      setError('Erro ao iniciar atividade');
      setLoading(false);
    }
  };

  const endActivity = async () => {
    try {
      if (activity) {
        await studentService.endActivity(activity.id);
      }
    } catch (error) {
      console.error('Error ending activity:', error);
    }
  };

  const handleComplete = async () => {
    try {
      setError('');
      await studentService.updateProgress(lesson.id, true);
      setCompleted(true);
      setShowSuccess(true);
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Erro ao marcar aula como concluída. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
        }}
      >
        <CircularProgress size={48} />
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mt: 2 }}
        >
          Carregando aula...
        </Typography>
        <LinearProgress 
          sx={{ 
            width: '200px', 
            mt: 2,
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
            }
          }} 
        />
      </Box>
    );
  }

  return (
    <Fade in={!loading}>
      <Box 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          ...(isMobile && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
          }),
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: isMobile ? 0 : 2,
            bgcolor: 'background.paper',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError('')}
              sx={{
                borderRadius: 0,
                '& .MuiAlert-message': {
                  flex: 1,
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ 
            p: isMobile ? 2 : 3,
            borderBottom: 1,
            borderColor: 'divider',
            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {completed ? (
                <CheckCircle color="success" sx={{ mr: 1 }} />
              ) : (
                <PlayCircleOutline color="primary" sx={{ mr: 1 }} />
              )}
              <Typography 
                variant={isMobile ? "subtitle1" : "h5"} 
                component="h1"
                sx={{ 
                  fontWeight: 'bold',
                  color: completed ? 'success.main' : 'primary.main',
                }}
              >
                {lesson.title}
              </Typography>
            </Box>
            {lesson.description && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  ml: 4,
                  borderLeft: 2,
                  borderColor: completed ? 'success.main' : 'primary.main',
                  pl: 2,
                }}
              >
                {lesson.description}
              </Typography>
            )}
          </Box>

          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <LessonContent
              lesson={lesson}
              onComplete={handleComplete}
              completed={completed}
            />
          </Box>
        </Paper>

        <Snackbar
          open={showSuccess}
          autoHideDuration={4000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ 
            vertical: isMobile ? 'top' : 'bottom', 
            horizontal: 'center' 
          }}
        >
          <Alert 
            onClose={() => setShowSuccess(false)} 
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            Aula concluída com sucesso!
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
}

export default LessonViewer;
