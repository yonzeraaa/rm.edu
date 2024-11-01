import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Divider,
  alpha,
} from '@mui/material';
import { PlayArrow, School, Timer, Assessment } from '@mui/icons-material';
import { studentService } from '../services/api';
import StudentGradeCard from '../components/StudentGradeCard';

function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await studentService.getDashboard();
        setDashboard(dashboardData);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Erro ao carregar o dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const calculateProgress = (course) => {
    let totalLessons = 0;
    let completedLessons = 0;
    
    course.disciplines.forEach(discipline => {
      if (discipline.lessons && discipline.lessons.length > 0) {
        totalLessons += discipline.lessons.length;
        completedLessons += discipline.lessons.filter(lesson => 
          lesson.progress && lesson.progress.completed
        ).length;
      }
    });
    
    return totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100;
  };

  const getTotalLessons = (course) => {
    return course.disciplines.reduce((total, discipline) => 
      total + (discipline.lessons?.length || 0), 0);
  };

  const formatCompletedTime = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="calc(100vh - 64px)"
        sx={{ p: 2 }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.error.main, 0.1)
          }}
        >
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!dashboard) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" color="textSecondary">
            Nenhum dado disponível
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: isMobile ? 2 : 4, 
        mb: isMobile ? 2 : 4,
        px: isMobile ? 1 : 3
      }}
    >
      {dashboard.quizResults && dashboard.quizResults.length > 0 && (
        <Box mb={isMobile ? 2 : 4}>
          <StudentGradeCard quizResults={dashboard.quizResults} />
        </Box>
      )}

      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom 
        sx={{ 
          mb: 3,
          fontWeight: 'bold',
          color: theme.palette.primary.main
        }}
      >
        Meus Cursos
      </Typography>

      <Grid container spacing={isMobile ? 2 : 3}>
        {dashboard.courses?.map((course) => {
          const progress = calculateProgress(course);
          return (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Paper 
                elevation={3}
                sx={{
                  p: isMobile ? 2 : 3,
                  borderRadius: 2,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[8],
                  },
                  '&:active': {
                    transform: isMobile ? 'scale(0.98)' : 'translateY(-5px)',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
                }}
                onClick={() => handleCourseClick(course.id)}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    gutterBottom
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.primary.main
                    }}
                  >
                    {course.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {course.description}
                  </Typography>
                </Box>

                <Box sx={{ mt: 'auto' }}>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Progresso do Curso
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={progress === 100 ? "success.main" : "primary.main"}
                        fontWeight="bold"
                      >
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={progress}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: progress === 100 ? 
                            theme.palette.success.main : 
                            theme.palette.primary.main,
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <School sx={{ fontSize: 20, mr: 1 }} />
                        <Typography variant="body2">
                          {course.disciplines.length} disciplinas
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <Timer sx={{ fontSize: 20, mr: 1 }} />
                        <Typography variant="body2">
                          {formatCompletedTime(course.completedTime)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <PlayArrow sx={{ fontSize: 20, mr: 1 }} />
                        <Typography variant="body2">
                          {getTotalLessons(course)} aulas
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}>
                        <Assessment sx={{ fontSize: 20, mr: 1 }} />
                        <Typography variant="body2">
                          {course.quizzes?.length || 0} quizzes
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Button 
                    variant="contained" 
                    fullWidth
                    sx={{ 
                      mt: 2,
                      height: 48,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: theme.shadows[4],
                      '&:active': {
                        transform: 'scale(0.98)',
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(course.id);
                    }}
                  >
                    Continuar
                  </Button>
                </Box>
              </Paper>
            </Grid>
          );
        })}

        {(!dashboard.courses || dashboard.courses.length === 0) && (
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }}
            >
              <School 
                sx={{ 
                  fontSize: 48, 
                  color: theme.palette.primary.main,
                  mb: 2
                }} 
              />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Você ainda não está matriculado em nenhum curso
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Entre em contato com o administrador para se matricular em um curso
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default StudentDashboard;
