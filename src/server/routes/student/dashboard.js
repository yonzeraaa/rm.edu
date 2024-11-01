import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const prisma = req.prisma;

    if (!prisma) {
      console.error('Prisma instance not found in request');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            disciplines: {
              include: {
                lessons: {
                  include: {
                    progress: {
                      where: { userId }
                    }
                  }
                }
              }
            },
            quizzes: {
              include: {
                results: {
                  where: { userId }
                }
              }
            }
          }
        }
      }
    });

    const courses = enrollments.map(enrollment => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      disciplines: enrollment.course.disciplines.map(discipline => ({
        id: discipline.id,
        title: discipline.title,
        description: discipline.description,
        lessons: discipline.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          progress: lesson.progress[0] || null
        }))
      })),
      quizzes: enrollment.course.quizzes,
      completedTime: enrollment.completedTime || 0
    }));

    // Get quiz results with course title and ensure timeSpent is included
    const quizResults = await prisma.quizResult.findMany({
      where: { userId },
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

    // Transform quiz results to ensure all required fields are present
    const formattedQuizResults = quizResults.map(result => ({
      id: result.id,
      score: result.score,
      timeSpent: result.timeSpent || 0,
      quiz: {
        id: result.quiz.id,
        title: result.quiz.title,
        course: {
          title: result.quiz.course.title
        }
      }
    }));

    res.json({
      courses,
      quizResults: formattedQuizResults
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
