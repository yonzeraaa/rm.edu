import axios from 'axios';

const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const serverPort = '3001';
  const externalIP = process.env.EXTERNAL_IP || '187.67.178.233';
  
  // Log detailed information about the current environment
  console.log('Detailed environment info:', {
    hostname,
    fullUrl: window.location.href,
    port: window.location.port,
    protocol: window.location.protocol,
    search: window.location.search,
    hash: window.location.hash,
    externalIP
  });
  
  // Handle localhost variations and IP access
  const isLocalhost = hostname === 'localhost' || 
                     hostname === '127.0.0.1' || 
                     hostname.includes('192.168.') ||
                     hostname.includes('10.0.') ||
                     hostname.startsWith('172.16.') ||
                     hostname.startsWith('172.17.') ||
                     hostname.startsWith('172.18.') ||
                     hostname.startsWith('172.19.') ||
                     hostname.startsWith('172.20.') ||
                     hostname.startsWith('172.21.') ||
                     hostname.startsWith('172.22.') ||
                     hostname.startsWith('172.23.') ||
                     hostname.startsWith('172.24.') ||
                     hostname.startsWith('172.25.') ||
                     hostname.startsWith('172.26.') ||
                     hostname.startsWith('172.27.') ||
                     hostname.startsWith('172.28.') ||
                     hostname.startsWith('172.29.') ||
                     hostname.startsWith('172.30.') ||
                     hostname.startsWith('172.31.');
  
  let baseUrl;
  // If accessing through IP directly, use that IP
  if (hostname === externalIP) {
    baseUrl = `http://${hostname}:${serverPort}`;
  }
  // If local development
  else if (isLocalhost) {
    baseUrl = `http://localhost:${serverPort}`;
  }
  // If accessing through domain or other means, use external IP
  else {
    baseUrl = `http://${externalIP}:${serverPort}`;
  }
  
  console.log('API Base URL determined:', {
    isLocalhost,
    baseUrl,
    hostname,
    serverPort,
    externalIP
  });
  
  return baseUrl;
};

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: `${getBaseUrl()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000 // 15 second timeout
});

// Add request interceptor
api.interceptors.request.use((config) => {
  // Update baseURL on each request to ensure it's current
  config.baseURL = `${getBaseUrl()}/api`;
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Debug log for all requests
  console.log('API Request:', {
    url: config.url,
    baseURL: config.baseURL,
    method: config.method,
    headers: {
      ...config.headers,
      Authorization: config.headers.Authorization ? 'Bearer [TOKEN]' : 'none'
    }
  });

  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: {
        data: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      },
      request: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      }
    });

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('A requisição excedeu o tempo limite. Tente novamente.'));
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Sessão expirada. Por favor, faça login novamente.'));
    }

    if (error.message.includes('Network Error') || error.message.includes('CORS')) {
      return Promise.reject(new Error('Erro de conexão. Verifique sua conexão com a internet.'));
    }

    const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth service
export const authService = {
  login: async (credentials) => {
    try {
      console.log('Login attempt:', {
        email: credentials.email,
        baseUrl: getBaseUrl()
      });

      const response = await api.post('/auth/login', credentials);
      
      console.log('Login response:', {
        success: true,
        user: response.user,
        hasToken: !!response.token
      });

      return response;
    } catch (error) {
      console.error('Login error details:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.log('Register attempt:', {
        email: userData.email,
        baseUrl: getBaseUrl()
      });

      const response = await api.post('/auth/register', userData);
      
      console.log('Register response:', {
        success: true,
        user: response.user,
        hasToken: !!response.token
      });

      return response;
    } catch (error) {
      console.error('Register error details:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }
};

// Student service
export const studentService = {
  startActivity: async (data) => {
    try {
      console.log('Starting activity:', data);
      const response = await api.post('/student/activity/start', data);
      console.log('Activity started:', response);
      return response;
    } catch (error) {
      console.error('Error starting activity:', error);
      throw new Error('Erro ao iniciar atividade. Por favor, tente novamente.');
    }
  },

  endActivity: async (activityId) => {
    try {
      console.log('Ending activity:', activityId);
      const response = await api.post(`/student/activity/${activityId}/end`);
      console.log('Activity ended:', response);
      return response;
    } catch (error) {
      console.error('Error ending activity:', error);
      throw new Error('Erro ao finalizar atividade.');
    }
  },

  updateProgress: async (lessonId, completed) => {
    try {
      console.log('Updating lesson progress:', { lessonId, completed });
      const response = await api.put(`/student/progress/${lessonId}`, { completed });
      console.log('Progress updated:', response);
      return response;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new Error('Erro ao atualizar progresso da aula.');
    }
  },

  submitQuiz: async (quizId, answers) => {
    try {
      console.log('Submitting quiz:', { quizId, answers });
      const response = await api.post(`/student/quiz/${quizId}/submit`, { answers });
      console.log('Quiz submitted:', response);
      return response;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw new Error('Erro ao enviar questionário. Por favor, tente novamente.');
    }
  },

  getDashboard: async () => {
    const response = await api.get('/student/dashboard');
    return response;
  }
};

// Course service
export const courseService = {
  getCourses: async () => {
    const response = await api.get('/courses');
    return response;
  },

  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response;
  },

  createCourse: async (data) => {
    const response = await api.post('/courses', data);
    return response;
  },

  updateCourse: async (id, data) => {
    const response = await api.put(`/courses/${id}`, data);
    return response;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response;
  },

  getPublicCourses: async () => {
    const response = await api.get('/courses/public');
    return response;
  }
};

// Discipline service
export const disciplineService = {
  createDiscipline: async (courseId, data) => {
    const response = await api.post(`/courses/${courseId}/disciplines`, data);
    return response;
  },

  updateDiscipline: async (courseId, disciplineId, data) => {
    const response = await api.put(`/courses/${courseId}/disciplines/${disciplineId}`, data);
    return response;
  },

  deleteDiscipline: async (courseId, disciplineId) => {
    const response = await api.delete(`/courses/${courseId}/disciplines/${disciplineId}`);
    return response;
  },

  getDisciplines: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/disciplines`);
    return response;
  },

  getDiscipline: async (courseId, disciplineId) => {
    const response = await api.get(`/courses/${courseId}/disciplines/${disciplineId}`);
    return response;
  }
};

// Lesson service
export const lessonService = {
  getAll: async (courseId) => {
    const response = await api.get(`/lessons?courseId=${courseId}`);
    return response;
  },

  getOne: async (id) => {
    const response = await api.get(`/lessons/${id}`);
    return response;
  },

  create: async (data) => {
    const response = await api.post('/lessons', data);
    return response;
  },

  update: async (id, data) => {
    const response = await api.put(`/lessons/${id}`, data);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/lessons/${id}`);
    return response;
  },

  createLesson: async (disciplineId, formData) => {
    try {
      console.log('Creating lesson:', { disciplineId, formData });
      const response = await api.post(`/lessons/${disciplineId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // Increase timeout for file uploads
      });
      console.log('Lesson created:', response);
      return response;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw new Error('Erro ao criar aula. Por favor, tente novamente.');
    }
  }
};

// Quiz service
export const quizService = {
  getQuizzes: async (courseId) => {
    const response = await api.get(`/quizzes/${courseId}`);
    return response;
  },

  getQuiz: async (courseId, quizId) => {
    const response = await api.get(`/quizzes/${courseId}/${quizId}`);
    return response;
  },

  createQuiz: async (courseId, data) => {
    const response = await api.post(`/quizzes/${courseId}`, data);
    return response;
  },

  updateQuiz: async (courseId, quizId, data) => {
    const response = await api.put(`/quizzes/${courseId}/${quizId}`, data);
    return response;
  },

  deleteQuiz: async (courseId, quizId) => {
    const response = await api.delete(`/quizzes/${courseId}/${quizId}`);
    return response;
  },

  submitQuiz: async (courseId, quizId, data) => {
    const response = await api.post(`/quizzes/${courseId}/${quizId}/submit`, data);
    return response;
  },

  getQuizResults: async (courseId, quizId) => {
    const response = await api.get(`/quizzes/${courseId}/${quizId}/results`);
    return response;
  }
};

// Video service
export const videoService = {
  getVideo: async (url, retryCount = 3) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url}`;
      console.log('Fetching video from:', fullUrl);

      let lastError;
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          const response = await api.get(fullUrl, {
            responseType: 'blob',
            headers: {
              'Range': 'bytes=0-'
            },
            timeout: 30000
          });

          if (!response || response.size === 0) {
            throw new Error('Empty response');
          }

          return URL.createObjectURL(response);
        } catch (error) {
          lastError = error;
          console.warn(`Video fetch attempt ${attempt} failed:`, error);
          
          if (!error.response || error.response.status < 500) {
            throw error;
          }
          
          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      throw lastError || new Error('Failed to load video after retries');
    } catch (error) {
      console.error('Video fetch error:', error);
      throw new Error(`Error loading video: ${error.message}`);
    }
  }
};

// Admin service
export const adminService = {
  getStudents: async () => {
    const response = await api.get('/admin/students');
    return response;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/admin/students/${id}`);
    return response;
  },

  enrollStudentInCourse: async (studentId, courseId) => {
    const response = await api.post(`/admin/students/${studentId}/enroll/${courseId}`);
    return response;
  },

  unenrollStudentFromCourse: async (studentId, courseId) => {
    const response = await api.delete(`/admin/students/${studentId}/enroll/${courseId}`);
    return response;
  }
};

export default api;
