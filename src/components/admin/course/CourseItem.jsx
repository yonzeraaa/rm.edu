import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import DisciplineItem from './DisciplineItem';

function CourseItem({ 
  course, 
  expanded, 
  onExpand, 
  onEdit, 
  onDelete,
  onAddDiscipline,
  onEditDiscipline,
  onDeleteDiscipline,
  onUploadLesson,
  children 
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={{ mb: 2, overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div">
              {course.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Código: {course.code}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end'
          }}>
            <IconButton 
              onClick={() => onEdit(course)}
              size="small"
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              onClick={() => onDelete(course.id)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
            <IconButton
              onClick={() => onExpand(course.id)}
              size="small"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" paragraph>
              {course.description}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={() => onAddDiscipline(course.id)}
              fullWidth={isMobile}
              sx={{ mb: 2 }}
            >
              Adicionar Disciplina
            </Button>

            {course.disciplines && course.disciplines.map((discipline) => (
              <DisciplineItem
                key={discipline.id}
                discipline={discipline}
                onEdit={onEditDiscipline}
                onDelete={(disciplineId) => onDeleteDiscipline(course.id, disciplineId)}
                onUploadLesson={(disciplineId) => onUploadLesson(course.id, disciplineId)}
              >
                {children && discipline.id === course.selectedDisciplineId && children}
              </DisciplineItem>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default CourseItem;
