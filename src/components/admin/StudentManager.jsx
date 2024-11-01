import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { studentService, courseService, adminService } from '../../services/api';

function StudentManager() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (editDialogOpen) {
      loadCourses();
    }
  }, [editDialogOpen]);

  const loadStudents = async () => {
    try {
      setPageLoading(true);
      const data = await adminService.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      setError(error.message || 'Erro ao carregar alunos');
    } finally {
      setPageLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError(error.message || 'Erro ao carregar cursos');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este aluno?')) {
      return;
    }

    try {
      setLoading(true);
      await adminService.deleteStudent(id);
      setStudents(students.filter(student => student.id !== id));
    } catch (error) {
      console.error('Error deleting student:', error);
      setError(error.message || 'Erro ao excluir aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (student) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setSelectedStudent(null);
    setSelectedCourse('');
    setEditDialogOpen(false);
    setError('');
  };

  const handleAddCourse = async () => {
    if (!selectedStudent || !selectedCourse) return;

    try {
      setLoading(true);
      await adminService.enrollStudentInCourse(selectedStudent.id, selectedCourse);
      
      // Update the local state to reflect the new enrollment
      const updatedStudents = students.map(student => {
        if (student.id === selectedStudent.id) {
          const enrolledCourse = courses.find(course => course.id === parseInt(selectedCourse));
          return {
            ...student,
            enrollments: [
              ...(student.enrollments || []),
              { course: enrolledCourse }
            ]
          };
        }
        return student;
      });
      
      setStudents(updatedStudents);
      setSelectedCourse('');
      setError('');
    } catch (error) {
      console.error('Error enrolling student:', error);
      setError(error.message || 'Erro ao matricular aluno no curso');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCourse = async (courseId) => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      await adminService.unenrollStudentFromCourse(selectedStudent.id, courseId);
      
      // Update the local state to reflect the removal of enrollment
      const updatedStudents = students.map(student => {
        if (student.id === selectedStudent.id) {
          return {
            ...student,
            enrollments: student.enrollments.filter(enrollment => enrollment.course.id !== courseId)
          };
        }
        return student;
      });
      
      setStudents(updatedStudents);
      setError('');
    } catch (error) {
      console.error('Error unenrolling student:', error);
      setError(error.message || 'Erro ao remover aluno do curso');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Gerenciamento de Alunos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>WhatsApp</TableCell>
              <TableCell>Cursos</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.fullName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.whatsapp}</TableCell>
                  <TableCell>
                    {student.enrollments?.length > 0 
                      ? student.enrollments.map(enrollment => enrollment.course.title).join(', ')
                      : 'Nenhum curso'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenEditDialog(student)}
                      title="Editar aluno"
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteStudent(student.id)}
                      title="Excluir aluno"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Editar Aluno: {selectedStudent?.fullName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Cursos Matriculados:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {selectedStudent?.enrollments?.length > 0 ? (
                selectedStudent.enrollments.map((enrollment) => (
                  <Chip
                    key={enrollment.course.id}
                    label={enrollment.course.title}
                    onDelete={() => handleRemoveCourse(enrollment.course.id)}
                    color="primary"
                    disabled={loading}
                  />
                ))
              ) : (
                <Typography color="textSecondary">Nenhum curso matriculado</Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Adicionar Curso</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  label="Adicionar Curso"
                  disabled={loading}
                >
                  {courses
                    .filter(course => !selectedStudent?.enrollments?.some(e => e.course.id === course.id))
                    .map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Button
                onClick={handleAddCourse}
                variant="contained"
                disabled={!selectedCourse || loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Adicionando...' : 'Adicionar Curso'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={loading}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentManager;
