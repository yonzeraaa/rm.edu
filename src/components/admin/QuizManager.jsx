import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { courseService, quizService } from '../../services/api';
import QuizForm from './quiz/QuizForm';
import QuestionForm from './quiz/QuestionForm';
import QuestionList from './quiz/QuestionList';

function QuizManager() {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    answer: 0,
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [testCode, setTestCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await courseService.getCourses();
        setCourses(data);
      } catch (error) {
        console.error('Error loading courses:', error);
        setError('Erro ao carregar cursos. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadQuizzes();
    } else {
      setExistingQuizzes([]);
    }
  }, [selectedCourse]);

  const loadQuizzes = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoadingQuizzes(true);
      setError('');
      const quizzes = await quizService.getQuizzes(parseInt(selectedCourse));
      setExistingQuizzes(quizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setError('Erro ao carregar questionários. Por favor, tente novamente.');
      setExistingQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    try {
      setEditingQuiz(quiz);
      setQuestions(quiz.questions.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options)
      })));
      setTestCode(quiz.code.split('-')[1]);
      setError('');
    } catch (error) {
      console.error('Error editing quiz:', error);
      setError('Erro ao editar questionário');
    }
  };

  const handleCancelEdit = () => {
    setEditingQuiz(null);
    setQuestions([]);
    setTestCode('');
    setError('');
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Tem certeza que deseja excluir este questionário?')) {
      return;
    }

    try {
      setError('');
      await quizService.deleteQuiz(parseInt(selectedCourse), quizId);
      await loadQuizzes();
      if (editingQuiz?.id === quizId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setError('Erro ao excluir questionário');
    }
  };

  const validateTestCode = (code) => {
    return /^\d{2}$/.test(code);
  };

  const handleOpenDialog = (questionIndex = null) => {
    try {
      if (questionIndex !== null) {
        const question = questions[questionIndex];
        setCurrentQuestion({
          text: question.text,
          options: Array.isArray(question.options) ? question.options : JSON.parse(question.options),
          answer: question.answer,
        });
        setEditingIndex(questionIndex);
      } else {
        setCurrentQuestion({
          text: '',
          options: ['', '', '', ''],
          answer: 0,
        });
        setEditingIndex(null);
      }
      setOpenDialog(true);
      setError('');
    } catch (error) {
      console.error('Error opening dialog:', error);
      setError('Erro ao abrir o formulário de questão');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      answer: 0,
    });
    setEditingIndex(null);
    setError('');
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setError('A pergunta não pode estar vazia');
      return;
    }

    if (currentQuestion.options.some(option => !option.trim())) {
      setError('Todas as opções devem ser preenchidas');
      return;
    }

    try {
      const newQuestion = {
        text: currentQuestion.text.trim(),
        options: currentQuestion.options.map(opt => opt.trim()),
        answer: currentQuestion.answer,
      };

      if (editingIndex !== null) {
        const newQuestions = [...questions];
        newQuestions[editingIndex] = newQuestion;
        setQuestions(newQuestions);
      } else {
        setQuestions([...questions, newQuestion]);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving question:', error);
      setError('Erro ao salvar questão');
    }
  };

  const handleDeleteQuestion = (index) => {
    try {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Erro ao excluir questão');
    }
  };

  const getFullTestCode = () => {
    try {
      const course = courses.find(c => c.id === parseInt(selectedCourse));
      return course ? `${course.code}-${testCode}` : '';
    } catch (error) {
      console.error('Error getting test code:', error);
      return '';
    }
  };

  const validateQuiz = () => {
    if (!selectedCourse) {
      setError('Selecione o curso');
      return false;
    }

    if (!validateTestCode(testCode)) {
      setError('Código do questionário inválido. Use dois dígitos numéricos.');
      return false;
    }

    if (questions.length === 0) {
      setError('Adicione pelo menos uma questão ao questionário');
      return false;
    }

    return true;
  };

  const handleSaveQuiz = async () => {
    if (!validateQuiz()) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      const quizData = {
        title: `Questionário ${getFullTestCode()}`,
        code: getFullTestCode(),
        description: `Questionário para o curso ${courses.find(c => c.id === parseInt(selectedCourse))?.title}`,
        questions: questions.map(q => ({
          ...q,
          options: JSON.stringify(q.options)
        })),
      };

      if (editingQuiz) {
        await quizService.updateQuiz(parseInt(selectedCourse), editingQuiz.id, quizData);
      } else {
        await quizService.createQuiz(parseInt(selectedCourse), quizData);
      }

      await loadQuizzes();
      setQuestions([]);
      setTestCode('');
      setEditingQuiz(null);
    } catch (error) {
      console.error('Error saving quiz:', error);
      setError('Erro ao salvar questionário');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !courses.length) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <QuizForm
        courses={courses}
        selectedCourse={selectedCourse}
        testCode={testCode}
        error={error}
        onCourseChange={(e) => {
          setSelectedCourse(e.target.value);
          setQuestions([]);
          setTestCode('');
          setError('');
          setEditingQuiz(null);
        }}
        onTestCodeChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 2);
          setTestCode(value);
          setError('');
        }}
        getFullTestCode={getFullTestCode}
      />

      {selectedCourse && (
        <>
          {/* Existing Questionários Section */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Questionários Existentes
            </Typography>
            {loadingQuizzes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : existingQuizzes.length > 0 ? (
              <List>
                {existingQuizzes.map((quiz, index) => (
                  <div key={quiz.id}>
                    <ListItem>
                      <ListItemText
                        primary={quiz.title}
                        secondary={`${quiz.questions?.length || 0} questões`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => handleEditQuiz(quiz)}
                          sx={{ mr: 1 }}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < existingQuizzes.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary">
                Nenhum questionário encontrado para este curso.
              </Typography>
            )}
          </Paper>

          {/* Edit/New Questionário Section */}
          {testCode && validateTestCode(testCode) && (
            <>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {editingQuiz ? `Editar Questionário: ${editingQuiz.title}` : `Novo Questionário: ${getFullTestCode()}`}
                  </Typography>
                  {editingQuiz && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleCancelEdit}
                      sx={{ ml: 2 }}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Nova Questão
                  </Button>

                  {questions.length > 0 && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveQuiz}
                      disabled={saving}
                    >
                      {saving ? 'Salvando...' : editingQuiz ? 'Atualizar Questionário' : 'Salvar Questionário'}
                    </Button>
                  )}
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <QuestionList
                  questions={questions}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteQuestion}
                />
              </Paper>
            </>
          )}
        </>
      )}

      <QuestionForm
        open={openDialog}
        onClose={handleCloseDialog}
        currentQuestion={currentQuestion}
        setCurrentQuestion={setCurrentQuestion}
        handleSaveQuestion={handleSaveQuestion}
        editingIndex={editingIndex}
        error={error}
        handleOptionChange={handleOptionChange}
      />
    </Box>
  );
}

export default QuizManager;
