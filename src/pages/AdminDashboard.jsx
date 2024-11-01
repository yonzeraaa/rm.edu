import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  QuestionAnswer as QuizIcon,
} from '@mui/icons-material';
import CourseManager from '../components/admin/CourseManager';
import StudentManager from '../components/admin/StudentManager';
import QuizManager from '../components/admin/QuizManager';
import ErrorBoundary from '../components/ErrorBoundary';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <ErrorBoundary key={index}>
            {children}
          </ErrorBoundary>
        </Box>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Painel Administrativo
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
        >
          <Tab
            icon={<SchoolIcon />}
            label="Cursos"
            iconPosition="start"
            sx={{ minHeight: 'auto' }}
          />
          <Tab
            icon={<PeopleIcon />}
            label="Alunos"
            iconPosition="start"
            sx={{ minHeight: 'auto' }}
          />
          <Tab
            icon={<QuizIcon />}
            label="Avaliações"
            iconPosition="start"
            sx={{ minHeight: 'auto' }}
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <CourseManager />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <StudentManager />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <QuizManager />
      </TabPanel>
    </Container>
  );
}

export default AdminDashboard;
