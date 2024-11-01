import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Iniciar uma atividade
router.post('/start', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { type, resourceId } = req.body;

    const activity = await prisma.activity.create({
      data: {
        userId,
        type,
        metadata: JSON.stringify({ resourceId }),
        startTime: new Date(),
      },
    });

    res.json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Finalizar uma atividade
router.post('/:activityId/end', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { id: userId } = req.user;
    const { completionStatus } = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id: parseInt(activityId) },
      include: { user: true }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const endTime = new Date();
    const timeSpent = Math.floor((endTime - activity.startTime) / 1000); // tempo em segundos

    const updatedActivity = await prisma.activity.update({
      where: { id: parseInt(activityId) },
      data: { endTime }
    });

    // Atualizar o tempo gasto dependendo do tipo de atividade
    if (activity.type === 'LESSON' && activity.metadata) {
      const { resourceId } = JSON.parse(activity.metadata);
      
      // Atualizar o progresso da lição
      await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: parseInt(resourceId)
          }
        },
        create: {
          userId,
          lessonId: parseInt(resourceId),
          watchTime: timeSpent,
          completed: completionStatus === 'completed'
        },
        update: {
          watchTime: {
            increment: timeSpent
          },
          completed: completionStatus === 'completed'
        }
      });

      // Atualizar o tempo total do curso
      const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(resourceId) },
        include: { 
          discipline: {
            include: {
              course: true
            }
          }
        }
      });

      if (lesson && lesson.discipline) {
        await prisma.enrollment.update({
          where: {
            userId_courseId: {
              userId,
              courseId: lesson.discipline.courseId
            }
          },
          data: {
            completedTime: {
              increment: timeSpent
            }
          }
        });
      }
    }

    res.json(updatedActivity);
  } catch (error) {
    console.error('Error ending activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obter tempo de atividade
router.get('/time', async (req, res) => {
  try {
    const { id: userId } = req.user;

    const activities = await prisma.activity.findMany({
      where: {
        userId,
        endTime: { not: null }
      }
    });

    const totalTime = activities.reduce((total, activity) => {
      const timeSpent = Math.floor((activity.endTime - activity.startTime) / 1000);
      return total + timeSpent;
    }, 0);

    res.json({ totalTime });
  } catch (error) {
    console.error('Error getting activity time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
