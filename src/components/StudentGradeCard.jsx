import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
} from '@mui/material';
import { EmojiEvents, CheckCircle } from '@mui/icons-material';

function StudentGradeCard({ quizResults }) {
  // Group results by quiz and get highest score for each
  const highestScores = quizResults.reduce((acc, result) => {
    const key = `${result.quiz.id}`;
    if (!acc[key] || result.score > acc[key].score) {
      acc[key] = result;
    }
    return acc;
  }, {});

  const bestResults = Object.values(highestScores);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        '& .MuiTableCell-root': {
          fontSize: '0.95rem',
        },
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontWeight: 'bold',
          color: 'primary.main',
        }}
      >
        <EmojiEvents />
        Boletim de Notas
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Curso</TableCell>
              <TableCell>Quiz</TableCell>
              <TableCell align="right">Melhor Nota</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bestResults.map((result) => (
              <TableRow 
                key={result.id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <TableCell>{result.quiz.course.title}</TableCell>
                <TableCell>{result.quiz.title}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                    <Typography>{result.score.toFixed(1)}%</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {result.score >= 70 ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Aprovado"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label="Em andamento"
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {bestResults.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={4} 
                  align="center"
                  sx={{ 
                    py: 4,
                    color: 'text.secondary',
                    fontStyle: 'italic',
                  }}
                >
                  Nenhuma nota disponível
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default StudentGradeCard;
