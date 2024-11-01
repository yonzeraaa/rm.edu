import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Paper,
  Collapse,
  Chip,
  alpha,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  PlayCircleOutline,
  QuizOutlined,
  CheckCircle,
  ArrowBack,
  MenuBook,
  OndemandVideo,
  ExpandMore,
  ExpandLess,
  School,
  Home,
} from '@mui/icons-material';
import LessonViewer from './LessonViewer';
import QuizViewer from './QuizViewer';
import { courseService } from '../services/api';

function CourseViewer() {
  const { courseId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDisciplines, setExpandedDisciplines] = useState({});

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await courseService.getCourses();
        const foundCourse = data.find(c => c.id === parseInt(courseId));
        if (foundCourse) {
          console.log('Found course:', foundCourse);
          setCourse(foundCourse);
          // Initialize expanded state for all disciplines
          const expanded = {};
          foundCourse.disciplines.forEach(d => {
            expanded[d.id] = true;
          });
          setExpandedDisciplines(expanded);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading course:', error);
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  const handleItemClick = (type, item) => {
    if (type === 'lesson') {
      setSelectedLesson(item);
      setSelectedQuiz(null);
      if (isMobile) {
        setActiveTab(1);
      }
    } else {
      setSelectedQuiz(item);
      setSelectedLesson(null);
      if (isMobile) {
        setActiveTab(1);
      }
    }
  };

  const handleBack = () => {
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setActiveTab(0);
  };

  const toggleDiscipline = (disciplineId) => {
    setExpandedDisciplines(prev => ({
      ...prev,
      [disciplineId]: !prev[disciplineId]
    }));
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        sx={{ 
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        sx={{ 
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
          p: 3,
        }}
      >
        <School sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" align="center" gutterBottom>
          Curso não encontrado
        </Typography>
        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Voltar ao Dashboard
        </Button>
      </Box>
    );
  }

  const calculateProgress = (discipline) => {
    if (!discipline.lessons || discipline.lessons.length === 0) return 0;
    const completed = discipline.lessons.filter(lesson => lesson.progress?.completed).length;
    return (completed / discipline.lessons.length) * 100;
  };

  const ContentList = () => (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%',
        overflow: 'auto',
        borderRadius: 2,
        bgcolor: 'background.paper',
        p: isMobile ? 1 : 2,
      }}
    >
      <List>
        {course.disciplines?.map((discipline) => {
          const progress = calculateProgress(discipline);
          return (
            <Box key={discipline.id} sx={{ mb: 2 }}>
              <Paper
                elevation={1}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[3],
                  },
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
                }}
              >
                <ListItemButton
                  onClick={() => toggleDiscipline(discipline.id)}
                  sx={{
                    py: 2,
                    px: 2,
                  }}
                >
                  <ListItemIcon>
                    <School color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={discipline.title}
                    secondary={`${discipline.lessons?.length || 0} aulas`}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      color: 'primary.main',
                    }}
                  />
                  {expandedDisciplines[discipline.id] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={expandedDisciplines[discipline.id]} timeout="auto">
                  <Divider sx={{ mx: 2 }} />
                  <Box sx={{ px: 2, py: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progresso
                      </Typography>
                      <Typography variant="body2" color={progress === 100 ? "success.main" : "primary.main"} fontWeight="bold">
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress}
                      sx={{ 
                        height: 6,
                        borderRadius: 3,
                        mb: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          backgroundColor: progress === 100 ? theme.palette.success.main : theme.palette.primary.main,
                        }
                      }}
                    />
                  </Box>

                  <List component="div" disablePadding>
                    {discipline.lessons?.map((lesson) => (
                      <ListItemButton
                        key={lesson.id}
                        onClick={() => handleItemClick('lesson', lesson)}
                        selected={selectedLesson?.id === lesson.id}
                        sx={{
                          pl: 4,
                          pr: 2,
                          py: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          },
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            },
                          },
                        }}
                      >
                        <ListItemIcon>
                          {lesson.progress?.completed ? (
                            <CheckCircle color="success" />
                          ) : (
                            <PlayCircleOutline color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={lesson.title}
                          primaryTypographyProps={{
                            style: {
                              fontWeight: selectedLesson?.id === lesson.id ? 600 : 400,
                            }
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Paper>
            </Box>
          );
        })}

        {course.quizzes?.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 3 }}>
              <Divider>
                <Chip 
                  label="Quizzes" 
                  color="primary" 
                  icon={<QuizOutlined />}
                  sx={{ px: 1 }}
                />
              </Divider>
            </Box>

            {course.quizzes.map((quiz) => (
              <Paper
                key={quiz.id}
                elevation={1}
                sx={{
                  mb: 2,
                  overflow: 'hidden',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[3],
                  },
                  background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
                }}
              >
                <ListItemButton
                  onClick={() => handleItemClick('quiz', quiz)}
                  selected={selectedQuiz?.id === quiz.id}
                  sx={{
                    py: 2,
                    px: 2,
                  }}
                >
                  <ListItemIcon>
                    {quiz.completed ? (
                      <CheckCircle color="success" />
                    ) : (
                      <QuizOutlined color="secondary" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={quiz.title}
                    primaryTypographyProps={{
                      fontWeight: selectedQuiz?.id === quiz.id ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </Paper>
            ))}
          </>
        )}
      </List>
    </Paper>
  );

  const Content = () => (
    <Box sx={{ height: '100%', overflow: 'auto', p: isMobile ? 1 : 2 }}>
      {!selectedLesson && !selectedQuiz ? (
        <Box 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            p: 3,
          }}
        >
          <School sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="primary.main" fontWeight="bold">
            Bem-vindo ao curso {course.title}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 600 }}>
            Selecione uma disciplina e uma aula no menu para começar seus estudos
          </Typography>
        </Box>
      ) : null}

      {selectedLesson && <LessonViewer lesson={selectedLesson} />}
      {selectedQuiz && <QuizViewer quiz={selectedQuiz} />}
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ 
        height: 'calc(100vh - 56px)', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}>
        <AppBar 
          position="static" 
          color="default" 
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            background: theme.palette.background.paper,
          }}
        >
          <Toolbar variant="dense">
            {activeTab === 1 && (
              <IconButton 
                edge="start" 
                onClick={handleBack}
                sx={{ 
                  mr: 2,
                  color: 'primary.main',
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
            )}
            <Typography 
              variant="subtitle1" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              {course.title}
            </Typography>
          </Toolbar>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ 
              bgcolor: 'background.paper',
              '& .MuiTab-root': {
                minHeight: 60,
                fontSize: '0.875rem',
              },
            }}
          >
            <Tab 
              icon={<MenuBook />} 
              label="Conteúdo"
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              }}
            />
            <Tab 
              icon={<OndemandVideo />} 
              label="Visualizar"
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              }}
            />
          </Tabs>
        </AppBar>
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        }}>
          {activeTab === 0 && <ContentList />}
          {activeTab === 1 && <Content />}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      display: 'flex',
      bgcolor: alpha(theme.palette.primary.main, 0.03),
      p: 2,
      gap: 2,
    }}>
      <Box
        sx={{
          width: 360,
          flexShrink: 0,
          height: '100%',
        }}
      >
        <ContentList />
      </Box>
      <Box
        sx={{
          flex: 1,
          height: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Content />
      </Box>
    </Box>
  );
}

export default CourseViewer;
