import { Router } from 'express';
import { authenticateToken } from '../middleware.js';

const router = Router();

export default function createAdminRouter(prisma) {
  // Apply authentication middleware to all admin routes
  router.use(authenticateToken);

  // Get all students
  router.get('/students', async (req, res) => {
    try {
      // Verify admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT'
        },
        include: {
          enrollments: {
            include: {
              course: true
            }
          }
        }
      });
      res.json(students);
    } catch (error) {
      console.error('Error getting students:', error);
      res.status(500).json({ error: 'Erro ao buscar alunos' });
    }
  });

  // Delete a student
  router.delete('/students/:id', async (req, res) => {
    try {
      // Verify admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      // Check if student exists and is a student
      const student = await prisma.user.findFirst({
        where: {
          id: req.params.id,
          role: 'STUDENT'
        }
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      // Delete student - cascade will handle related records
      const deletedStudent = await prisma.user.delete({
        where: {
          id: req.params.id
        }
      });
      
      res.json(deletedStudent);
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Erro ao excluir aluno' });
    }
  });

  // Enroll student in course
  router.post('/students/:studentId/enroll/:courseId', async (req, res) => {
    try {
      // Verify admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      // Check if student exists and is a student
      const student = await prisma.user.findFirst({
        where: {
          id: req.params.studentId,
          role: 'STUDENT'
        }
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: {
          id: parseInt(req.params.courseId)
        }
      });

      if (!course) {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }

      // Check if enrollment already exists
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.params.studentId,
            courseId: parseInt(req.params.courseId)
          }
        }
      });

      if (existingEnrollment) {
        return res.status(400).json({ error: 'Aluno já está matriculado neste curso' });
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: req.params.studentId,
          courseId: parseInt(req.params.courseId)
        },
        include: {
          course: true,
          user: true
        }
      });
      res.json(enrollment);
    } catch (error) {
      console.error('Error enrolling student:', error);
      res.status(500).json({ error: 'Erro ao matricular aluno' });
    }
  });

  // Unenroll student from course
  router.delete('/students/:studentId/enroll/:courseId', async (req, res) => {
    try {
      // Verify admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      // Check if student exists and is a student
      const student = await prisma.user.findFirst({
        where: {
          id: req.params.studentId,
          role: 'STUDENT'
        }
      });

      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      // Check if enrollment exists
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.params.studentId,
            courseId: parseInt(req.params.courseId)
          }
        }
      });

      if (!existingEnrollment) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }

      const enrollment = await prisma.enrollment.delete({
        where: {
          userId_courseId: {
            userId: req.params.studentId,
            courseId: parseInt(req.params.courseId)
          }
        }
      });
      res.json(enrollment);
    } catch (error) {
      console.error('Error unenrolling student:', error);
      res.status(500).json({ error: 'Erro ao desmatricular aluno' });
    }
  });

  return router;
}
