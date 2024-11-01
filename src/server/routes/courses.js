import { Router } from 'express';
import { authenticateToken } from '../middleware.js';

const router = Router();

export default function createCoursesRouter(prisma) {
  // Get public courses (no auth required)
  router.get('/public', async (req, res) => {
    try {
      const courses = await prisma.course.findMany({
        select: {
          id: true,
          code: true,
          title: true,
          description: true
        }
      });
      console.log('Public courses:', courses);
      res.json(courses);
    } catch (error) {
      console.error('Error getting public courses:', error);
      res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
  });

  // Get all courses (auth required)
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const courses = await prisma.course.findMany({
        include: {
          disciplines: {
            include: {
              lessons: {
                include: {
                  content: true
                }
              }
            }
          },
          quizzes: {
            include: {
              questions: true
            }
          },
          enrollments: true
        }
      });
      res.json(courses);
    } catch (error) {
      console.error('Error getting courses:', error);
      res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
  });

  // Get a single course
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          disciplines: {
            include: {
              lessons: {
                include: {
                  content: true
                }
              }
            }
          },
          quizzes: {
            include: {
              questions: true
            }
          },
          enrollments: true
        }
      });
      if (!course) {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }
      res.json(course);
    } catch (error) {
      console.error('Error getting course:', error);
      res.status(500).json({ error: 'Erro ao buscar curso' });
    }
  });

  // Create a new course
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { code, title, description } = req.body;
      
      // Validate required fields
      if (!code || !title) {
        return res.status(400).json({ error: 'Código e título são obrigatórios' });
      }

      // Check if course code already exists
      const existingCourse = await prisma.course.findUnique({
        where: { code }
      });

      if (existingCourse) {
        return res.status(400).json({ error: 'Já existe um curso com este código' });
      }

      const course = await prisma.course.create({
        data: {
          code,
          title,
          description
        }
      });

      res.status(201).json(course);
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ error: 'Erro ao criar curso' });
    }
  });

  // Create a new discipline
  router.post('/:courseId/disciplines', authenticateToken, async (req, res) => {
    try {
      const { title, description } = req.body;
      const courseId = parseInt(req.params.courseId);
      
      // Validate required fields
      if (!title) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }

      // Get the current highest order number for disciplines in this course
      const lastDiscipline = await prisma.discipline.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' }
      });

      const newOrder = lastDiscipline ? lastDiscipline.order + 1 : 0;

      const discipline = await prisma.discipline.create({
        data: {
          title,
          description,
          courseId,
          order: newOrder
        }
      });

      res.status(201).json(discipline);
    } catch (error) {
      console.error('Error creating discipline:', error);
      res.status(500).json({ error: 'Erro ao criar disciplina' });
    }
  });

  // Update a discipline
  router.put('/:courseId/disciplines/:id', authenticateToken, async (req, res) => {
    try {
      const { title, description } = req.body;
      const disciplineId = parseInt(req.params.id);
      
      // Validate required fields
      if (!title) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }

      const discipline = await prisma.discipline.update({
        where: { id: disciplineId },
        data: {
          title,
          description
        }
      });

      res.json(discipline);
    } catch (error) {
      console.error('Error updating discipline:', error);
      res.status(500).json({ error: 'Erro ao atualizar disciplina' });
    }
  });

  // Delete a discipline
  router.delete('/:courseId/disciplines/:id', authenticateToken, async (req, res) => {
    try {
      const disciplineId = parseInt(req.params.id);

      const discipline = await prisma.discipline.delete({
        where: { id: disciplineId }
      });

      res.json({ message: 'Disciplina excluída com sucesso', discipline });
    } catch (error) {
      console.error('Error deleting discipline:', error);
      res.status(500).json({ error: 'Erro ao excluir disciplina' });
    }
  });

  // Update a course
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const { code, title, description } = req.body;
      const courseId = parseInt(req.params.id);

      // Validate required fields
      if (!code || !title) {
        return res.status(400).json({ error: 'Código e título são obrigatórios' });
      }

      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!existingCourse) {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }

      // Check if new code conflicts with another course
      const codeConflict = await prisma.course.findFirst({
        where: {
          code,
          id: { not: courseId }
        }
      });

      if (codeConflict) {
        return res.status(400).json({ error: 'Já existe um curso com este código' });
      }

      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
          code,
          title,
          description
        }
      });

      res.json(updatedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({ error: 'Erro ao atualizar curso' });
    }
  });

  // Delete a course
  router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      console.log(`Attempting to delete course with ID: ${id}`);

      // First, delete all enrollments related to this course
      const deletedEnrollments = await prisma.enrollment.deleteMany({
        where: { courseId: parseInt(id) }
      });
      console.log(`Deleted ${deletedEnrollments.count} enrollments`);

      // Then delete the course (this will cascade delete disciplines, lessons and quizzes)
      const deletedCourse = await prisma.course.delete({
        where: { id: parseInt(id) },
      });

      if (!deletedCourse) {
        console.log(`Course with ID ${id} not found`);
        return res.status(404).json({ error: 'Curso não encontrado' });
      }

      console.log(`Successfully deleted course with ID: ${id}`);
      res.json({ message: 'Curso excluído com sucesso', deletedCourse });
    } catch (error) {
      console.error('Error deleting course:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }
      res.status(500).json({ error: 'Erro ao excluir curso', details: error.message });
    }
  });

  return router;
}
