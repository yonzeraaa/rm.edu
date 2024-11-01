import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware.js';

const router = Router();

export default function createQuizzesRouter(prisma) {
  // Get quizzes for a course
  router.get('/:courseId', authenticateToken, async (req, res) => {
    try {
      const quizzes = await prisma.quiz.findMany({
        where: {
          courseId: parseInt(req.params.courseId)
        },
        include: {
          questions: true
        },
        orderBy: {
          code: 'asc'
        }
      });

      // Transform questions to match frontend format
      const transformedQuizzes = quizzes.map(quiz => ({
        ...quiz,
        questions: quiz.questions.map(q => {
          try {
            return {
              ...q,
              options: JSON.parse(q.options)
            };
          } catch (error) {
            console.error('Error parsing question options:', error);
            return {
              ...q,
              options: [] // Return empty array if parsing fails
            };
          }
        })
      }));

      res.json(transformedQuizzes);
    } catch (error) {
      console.error('Error getting quizzes:', error);
      res.status(500).json({ error: 'Erro ao buscar quizzes' });
    }
  });

  // Create quiz (admin only)
  router.post('/:courseId', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, code, description, questions } = req.body;

      // Verify if course exists
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
      });

      if (!course) {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }

      // Check if quiz code already exists
      const existingQuiz = await prisma.quiz.findFirst({
        where: { code }
      });

      if (existingQuiz) {
        return res.status(400).json({ error: 'Já existe um questionário com este código' });
      }

      // Ensure options are stored as JSON strings
      const processedQuestions = questions.map(q => ({
        text: q.text,
        options: Array.isArray(q.options) ? JSON.stringify(q.options) : q.options,
        answer: q.answer
      }));

      // Create quiz with questions
      const quiz = await prisma.quiz.create({
        data: {
          title,
          code,
          description,
          courseId: parseInt(courseId),
          questions: {
            create: processedQuestions
          }
        },
        include: {
          questions: true
        }
      });

      // Transform the response to match frontend format
      const transformedQuiz = {
        ...quiz,
        questions: quiz.questions.map(q => ({
          ...q,
          options: JSON.parse(q.options)
        }))
      };

      res.status(201).json(transformedQuiz);
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({ error: 'Erro ao criar quiz' });
    }
  });

  // Update quiz (admin only)
  router.put('/:courseId/:quizId', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { quizId, courseId } = req.params;
      const { title, code, description, questions } = req.body;

      // Verify if quiz exists and belongs to the course
      const existingQuiz = await prisma.quiz.findFirst({
        where: { 
          id: parseInt(quizId),
          courseId: parseInt(courseId)
        }
      });

      if (!existingQuiz) {
        return res.status(404).json({ error: 'Quiz não encontrado' });
      }

      // Check if new code conflicts with existing quiz (excluding current quiz)
      const codeConflict = await prisma.quiz.findFirst({
        where: { 
          code,
          id: { not: parseInt(quizId) }
        }
      });

      if (codeConflict) {
        return res.status(400).json({ error: 'Já existe um questionário com este código' });
      }

      // Delete existing questions
      await prisma.question.deleteMany({
        where: { quizId: parseInt(quizId) }
      });

      // Ensure options are stored as JSON strings
      const processedQuestions = questions.map(q => ({
        text: q.text,
        options: Array.isArray(q.options) ? JSON.stringify(q.options) : q.options,
        answer: q.answer
      }));

      // Update quiz and create new questions
      const quiz = await prisma.quiz.update({
        where: { id: parseInt(quizId) },
        data: {
          title,
          code,
          description,
          questions: {
            create: processedQuestions
          }
        },
        include: {
          questions: true
        }
      });

      // Transform the response to match frontend format
      const transformedQuiz = {
        ...quiz,
        questions: quiz.questions.map(q => ({
          ...q,
          options: JSON.parse(q.options)
        }))
      };

      res.json(transformedQuiz);
    } catch (error) {
      console.error('Error updating quiz:', error);
      res.status(500).json({ error: 'Erro ao atualizar quiz' });
    }
  });

  // Delete quiz (admin only)
  router.delete('/:courseId/:quizId', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { quizId, courseId } = req.params;

      // Verify if quiz exists and belongs to the course
      const existingQuiz = await prisma.quiz.findFirst({
        where: { 
          id: parseInt(quizId),
          courseId: parseInt(courseId)
        }
      });

      if (!existingQuiz) {
        return res.status(404).json({ error: 'Quiz não encontrado' });
      }

      // Delete quiz (questions will be deleted by cascade)
      await prisma.quiz.delete({
        where: { id: parseInt(quizId) }
      });

      res.json({ message: 'Quiz excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ error: 'Erro ao excluir quiz' });
    }
  });

  // Get quiz results (admin only)
  router.get('/:courseId/:quizId/results', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { quizId, courseId } = req.params;

      // Verify if quiz exists and belongs to the course
      const existingQuiz = await prisma.quiz.findFirst({
        where: { 
          id: parseInt(quizId),
          courseId: parseInt(courseId)
        }
      });

      if (!existingQuiz) {
        return res.status(404).json({ error: 'Quiz não encontrado' });
      }

      const results = await prisma.quizResult.findMany({
        where: { quizId: parseInt(quizId) },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      });
      res.json(results);
    } catch (error) {
      console.error('Error getting quiz results:', error);
      res.status(500).json({ error: 'Erro ao buscar resultados do quiz' });
    }
  });

  // Submit quiz
  router.post('/:courseId/:quizId/submit', authenticateToken, async (req, res) => {
    try {
      const { quizId, courseId } = req.params;
      const { answers } = req.body;
      const userId = req.user.id;

      // Get quiz and verify it belongs to the course
      const quiz = await prisma.quiz.findFirst({
        where: { 
          id: parseInt(quizId),
          courseId: parseInt(courseId)
        },
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

      // Check for existing result
      const existingResult = await prisma.quizResult.findFirst({
        where: {
          userId,
          quizId: parseInt(quizId)
        },
        orderBy: {
          score: 'desc'
        }
      });

      // Only create new result if no previous attempt exists or if new score is higher
      if (!existingResult || score > existingResult.score) {
        const result = await prisma.quizResult.create({
          data: {
            userId,
            quizId: parseInt(quizId),
            score,
            answers: JSON.stringify(answers)
          }
        });
        res.json({ ...result, isNewHighScore: true });
      } else {
        res.json({ ...existingResult, isNewHighScore: false });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ error: 'Erro ao enviar respostas do quiz' });
    }
  });

  return router;
}
