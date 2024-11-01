import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

const MobileMenu = ({ lessons, quizzes, courseTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleLessonClick = (lessonId) => {
    navigate(`/lesson/${lessonId}`);
    handleClose();
  };

  const handleQuizClick = (quizId) => {
    navigate(`/quiz/${quizId}`);
    handleClose();
  };

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={handleOpen}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={isOpen}
        onClose={handleClose}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: '80%', maxWidth: '300px' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div" sx={{ mb: 2 }}>
            {courseTitle}
          </Typography>

          {lessons?.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Aulas
              </Typography>
              <List>
                {lessons.map((lesson) => (
                  <ListItem 
                    button 
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson.id)}
                  >
                    <ListItemText primary={lesson.title} />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {quizzes?.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Quizzes
              </Typography>
              <List>
                {quizzes.map((quiz) => (
                  <ListItem 
                    button 
                    key={quiz.id}
                    onClick={() => handleQuizClick(quiz.id)}
                  >
                    <ListItemText primary={quiz.title} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default MobileMenu;
