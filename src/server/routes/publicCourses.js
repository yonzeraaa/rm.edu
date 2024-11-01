import { Router } from 'express';

const router = Router();

export default function createPublicCoursesRouter(prisma) {
  // Get public courses (no auth required)
  router.get('/', async (req, res) => {
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

  return router;
}
