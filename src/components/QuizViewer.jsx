import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  NavigateNext,
  NavigateBefore,
  EmojiEvents,
} from '@mui/icons-material';
import { studentService } from '../services/api';

function QuizViewer({ quiz, onComplete, previousScore }) {
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [activity, setActivity] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (quiz) {
      setAnswers(new Array(quiz.questions.length).fill(null));
      startActivity();
    }
    return () => {
      if (activity) {
        endActivity();
      }
    };
  }, [quiz]);

  const startActivity = async () => {
    try {
      const result = await studentService.startActivity({
        type: 'QUIZ',
        resourceId: quiz.id,
      });
      setActivity(result);
      setLoading(false);
    } catch (error) {
      console.error('Error starting activity:', error);
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

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await studentService.submitQuiz(quiz.id, answers);
      setResult(result);
      setShowResult(true);
      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleTryAgain = async () => {
    setLoading(true);
    await endActivity();
    setCurrentQuestion(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setShowResult(false);
    setResult(null);
    startActivity();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentQuestionData = quiz.questions[currentQuestion];

  return (
    <>
      <Paper 
        elevation={3}
        className="card-3d"
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3,
          borderRadius: 2,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              color: 'primary.main',
              fontWeight: 'bold',
            }}
          >
            Questionário: {quiz.title}
          </Typography>
          {previousScore !== undefined && (
            <Chip
              icon={<EmojiEvents />}
              label={`Melhor nota: ${Math.round(previousScore)}%`}
              color="primary"
              variant="outlined"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          paragraph
          sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
        >
          {quiz.description}
        </Typography>

        <Stepper
          activeStep={currentQuestion}
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ 
            mb: 4,
            '& .MuiStepLabel-label': {
              fontSize: isMobile ? '0.75rem' : '0.875rem',
            },
          }}
        >
          {quiz.questions.map((_, index) => (
            <Step key={index}>
              <StepLabel>Questão {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Questão {currentQuestion + 1} de {quiz.questions.length}
          </Typography>
          <Typography 
            variant="body1" 
            paragraph
            sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
          >
            {currentQuestionData.text}
          </Typography>

          <RadioGroup
            value={answers[currentQuestion]}
            onChange={(e) => handleAnswer(parseInt(e.target.value))}
          >
            {JSON.parse(currentQuestionData.options).map((option, index) => (
              <FormControlLabel
                key={index}
                value={index}
                control={<Radio />}
                label={
                  <Typography sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    {option}
                  </Typography>
                }
                sx={{
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateX(4px)',
                  },
                }}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            startIcon={<NavigateBefore />}
            fullWidth={isMobile}
            className="button-3d"
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            Anterior
          </Button>

          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={answers.includes(null)}
              fullWidth={isMobile}
              className="button-3d"
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Finalizar Questionário
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={answers[currentQuestion] === null}
              endIcon={<NavigateNext />}
              fullWidth={isMobile}
              className="button-3d"
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Próxima
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog
        open={showResult}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'card-3d',
          sx: {
            borderRadius: 2,
            m: isMobile ? 2 : 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: 'bold',
          pt: 3,
        }}>
          Resultado do Questionário
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 3,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                mb: 2,
              }}
            >
              <CircularProgress
                variant="determinate"
                value={result?.score || 0}
                size={isMobile ? 100 : 120}
                thickness={4}
                sx={{
                  color: (result?.score || 0) >= 70 ? 'success.main' : 'error.main',
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  component="div"
                  sx={{ fontWeight: 'bold' }}
                >
                  {Math.round(result?.score || 0)}%
                </Typography>
              </Box>
            </Box>

            {previousScore !== undefined && result?.score > previousScore && (
              <Chip
                icon={<EmojiEvents />}
                label="Nova melhor nota!"
                color="success"
                sx={{ mb: 2 }}
              />
            )}

            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              {(result?.score || 0) >= 70 ? 'Parabéns!' : 'Continue tentando!'}
            </Typography>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              align="center"
              sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            >
              {result?.isNewHighScore
                ? 'Você alcançou uma nova melhor nota!'
                : previousScore !== undefined
                  ? `Sua melhor nota continua sendo ${Math.round(previousScore)}%`
                  : (result?.score || 0) >= 70
                    ? 'Você completou o questionário com sucesso!'
                    : 'Você pode tentar novamente para melhorar sua nota.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
          <Button 
            onClick={() => setShowResult(false)}
            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
          >
            Fechar
          </Button>
          {(result?.score || 0) < 70 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleTryAgain}
              className="button-3d"
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
                fontSize: isMobile ? '0.875rem' : '1rem',
              }}
            >
              Tentar Novamente
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default QuizViewer;
