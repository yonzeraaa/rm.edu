import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { courseService, disciplineService } from '../../services/api';
import CourseForm from './course/CourseForm';
import DisciplineForm from './course/DisciplineForm';
import LessonUploader from './course/LessonUploader';
import CourseItem from './course/CourseItem';

function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [openCourse, setOpenCourse] = useState(false);
  const [openDiscipline, setOpenDiscipline] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    code: '',
    title: '',
    description: '',
  });
  const [disciplineFormData, setDisciplineFormData] = useState({
    title: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [showLessonUploader, setShowLessonUploader] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourses();
      console.log('Loaded courses:', data);
      const coursesWithSelectedDiscipline = data.map(course => ({
        ...course,
        selectedDisciplineId: course.id === expandedCourse ? selectedDiscipline : null
      }));
      setCourses(coursesWithSelectedDiscipline);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, courseFormData);
      } else {
        await courseService.createCourse(courseFormData);
      }
      handleCloseCourse();
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      setError('Erro ao salvar curso');
    }
  };

  const handleSubmitDiscipline = async (e) => {
    e.preventDefault();
    try {
      if (editingDiscipline) {
        await disciplineService.updateDiscipline(selectedCourseId, editingDiscipline.id, disciplineFormData);
      } else {
        await disciplineService.createDiscipline(selectedCourseId, disciplineFormData);
      }
      handleCloseDiscipline();
      loadCourses();
    } catch (error) {
      console.error('Error saving discipline:', error);
      setError('Erro ao salvar disciplina');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este curso?')) {
      try {
        await courseService.deleteCourse(id);
        loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Erro ao excluir curso');
      }
    }
  };

  const handleDeleteDiscipline = async (courseId, disciplineId) => {
    if (window.confirm('Tem certeza que deseja excluir esta disciplina?')) {
      try {
        await disciplineService.deleteDiscipline(courseId, disciplineId);
        loadCourses();
      } catch (error) {
        console.error('Error deleting discipline:', error);
        setError('Erro ao excluir disciplina');
      }
    }
  };

  const handleOpenCourse = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseFormData({
        code: course.code,
        title: course.title,
        description: course.description,
      });
    } else {
      setEditingCourse(null);
      setCourseFormData({
        code: '',
        title: '',
        description: '',
      });
    }
    setOpenCourse(true);
  };

  const handleOpenDiscipline = (courseId, discipline = null) => {
    setSelectedCourseId(courseId);
    if (discipline) {
      setEditingDiscipline(discipline);
      setDisciplineFormData({
        title: discipline.title,
        description: discipline.description,
      });
    } else {
      setEditingDiscipline(null);
      setDisciplineFormData({
        title: '',
        description: '',
      });
    }
    setOpenDiscipline(true);
  };

  const handleCloseCourse = () => {
    setOpenCourse(false);
    setEditingCourse(null);
    setCourseFormData({
      code: '',
      title: '',
      description: '',
    });
  };

  const handleCloseDiscipline = () => {
    setOpenDiscipline(false);
    setEditingDiscipline(null);
    setDisciplineFormData({
      title: '',
      description: '',
    });
  };

  const handleLessonUploadComplete = () => {
    loadCourses();
    setShowLessonUploader(false);
    setSelectedDiscipline(null);
  };

  const handleUploadLesson = (courseId, disciplineId) => {
    // If the uploader is already shown for this discipline, hide it
    if (showLessonUploader && selectedDiscipline === disciplineId) {
      setShowLessonUploader(false);
      setSelectedDiscipline(null);
    } else {
      // Show the uploader for the selected discipline
      setShowLessonUploader(true);
      setSelectedDiscipline(disciplineId);
      setExpandedCourse(courseId);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Typography variant="h5" component="h2" sx={{ mb: isMobile ? 1 : 0 }}>
          Gerenciamento de Cursos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenCourse()}
          fullWidth={isMobile}
          className="button-3d"
          sx={{
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            },
          }}
        >
          Novo Curso
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {courses.map((course) => (
        <CourseItem
          key={course.id}
          course={{
            ...course,
            selectedDisciplineId: selectedDiscipline
          }}
          expanded={expandedCourse === course.id}
          onExpand={(id) => setExpandedCourse(expandedCourse === id ? null : id)}
          onEdit={handleOpenCourse}
          onDelete={handleDeleteCourse}
          onAddDiscipline={(courseId) => handleOpenDiscipline(courseId)}
          onEditDiscipline={(discipline) => handleOpenDiscipline(course.id, discipline)}
          onDeleteDiscipline={handleDeleteDiscipline}
          onUploadLesson={handleUploadLesson}
        >
          {showLessonUploader && selectedDiscipline && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <LessonUploader
                disciplineId={selectedDiscipline}
                onUploadComplete={handleLessonUploadComplete}
              />
            </Box>
          )}
        </CourseItem>
      ))}

      <CourseForm
        open={openCourse}
        onClose={handleCloseCourse}
        onSubmit={handleSubmitCourse}
        editingCourse={editingCourse}
        courseFormData={courseFormData}
        setCourseFormData={setCourseFormData}
        isMobile={isMobile}
      />

      <DisciplineForm
        open={openDiscipline}
        onClose={handleCloseDiscipline}
        onSubmit={handleSubmitDiscipline}
        editingDiscipline={editingDiscipline}
        disciplineFormData={disciplineFormData}
        setDisciplineFormData={setDisciplineFormData}
        isMobile={isMobile}
      />
    </Box>
  );
}

export default CourseManager;
