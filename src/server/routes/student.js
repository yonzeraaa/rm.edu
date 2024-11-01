import { Router } from 'express';
import dashboardRoutes from './student/dashboard.js';
import activityRoutes from './student/activity.js';

export default function createStudentRouter(prisma) {
  const router = Router();

  // Mount sub-routes with prisma instance
  router.use('/dashboard', (req, res, next) => {
    req.prisma = prisma;
    next();
  }, dashboardRoutes);
  router.use('/activity', activityRoutes);

  // Get progress
  router.get('/progress', async (req, res) => {
    try {
      const { id: userId } = req.user;
      const progress = await prisma.progress.findMany({
        where: {
          userId
        },
        include: {
          lesson: {
            include: {
              discipline: {
                select: {
                  title: true,
                  course: {
                    select: {
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      res.json(progress);
    } catch (error) {
      console.error('Error getting progress:', error);
      res.status(500).json({ error: 'Erro ao carregar progresso' });
    }
  });

  // Get quiz results
  router.get('/quiz-results', async (req, res) => {
    try {
      const { id: userId } = req.user;
      const results = await prisma.quizResult.findMany({
        where: {
          userId
        },
        include: {
          quiz: {
            include: {
              course: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(results);
    } catch (error) {
      console.error('Error getting quiz results:', error);
      res.status(500).json({ error: 'Erro ao carregar resultados dos quizzes' });
    }
  });

  // Enroll in course
  router.post('/enroll/:courseId', async (req, res) => {
    try {
      const { id: userId } = req.user;
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId: parseInt(req.params.courseId)
        },
        include: {
          course: {
            include: {
              disciplines: {
                include: {
                  lessons: true
                }
              }
            }
          }
        }
      });

      res.json(enrollment);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      res.status(500).json({ error: 'Erro ao se matricular no curso' });
    }
  });

  // Update lesson progress
  router.put('/progress/:lessonId', async (req, res) => {
    try {
      const { id: userId } = req.user;
      const { completed } = req.body;
      const progress = await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: parseInt(req.params.lessonId)
          }
        },
        update: {
          completed
        },
        create: {
          userId,
          lessonId: parseInt(req.params.lessonId),
          completed
        }
      });

      res.json(progress);
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ error: 'Erro ao atualizar progresso' });
    }
  });

  // Submit quiz
  router.post('/quiz/:quizId/submit', async (req, res) => {
    try {
      const { id: userId } = req.user;
      const { answers } = req.body;
      const quizId = parseInt(req.params.quizId);

      // Get quiz questions
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true }
      });

      if (!quiz) {
        return res.status(404).json({ error: 'Quiz não encontrado' });
      }

      // Calculate score
      const totalQuestions = quiz.questions.length;
      let correctAnswers = 0;

      quiz.questions.forEach((question, index) => {
        if (answers[index] === question.answer) {
          correctAnswers++;
        }
      });

      const score = (correctAnswers / totalQuestions) * 100;

      // Save result
      const result = await prisma.quizResult.create({
        data: {
          userId,
          quizId,
          score,
          answers: JSON.stringify(answers),
          timeSpent: 0 // Default value for timeSpent
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ error: 'Erro ao enviar respostas do quiz' });
    }
  });

  return router;
}
