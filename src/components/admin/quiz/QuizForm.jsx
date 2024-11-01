import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
} from '@mui/material';

function QuizForm({ 
  courses, 
  selectedCourse,
  testCode,
  error,
  onCourseChange,
  onTestCodeChange,
  getFullTestCode,
}) {
  return (
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
        Gerenciar Questionários
      </Typography>
      <Box sx={{ mt: 2 }}>
        <TextField
          select
          fullWidth
          id="course-select"
          name="course-select"
          label="Selecione o Curso"
          value={selectedCourse}
          onChange={onCourseChange}
          margin="normal"
          aria-label="Selecione o Curso"
        >
          {courses.map((course) => (
            <MenuItem key={course.id} value={course.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                  }}
                >
                  {course.code}
                </Typography>
                {course.title}
              </Box>
            </MenuItem>
          ))}
        </TextField>

        {selectedCourse && (
          <TextField
            fullWidth
            id="test-code"
            name="test-code"
            label="Código do Questionário (DD)"
            value={testCode}
            onChange={onTestCodeChange}
            margin="normal"
            required
            error={!!error}
            helperText={error || `Código completo: ${getFullTestCode()}`}
            inputProps={{
              maxLength: 2,
              style: { fontFamily: 'monospace' },
              'aria-label': 'Código do Questionário',
            }}
          />
        )}
      </Box>
    </Paper>
  );
}

export default QuizForm;
