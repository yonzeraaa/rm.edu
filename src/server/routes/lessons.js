import { Router } from 'express';
import multer from 'multer';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for different file types
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.fieldname === 'video') {
      uploadPath = join(__dirname, '../../../uploads/videos');
    } else if (file.fieldname === 'pdf') {
      uploadPath = join(__dirname, '../../../uploads/pdfs');
    } else if (file.fieldname === 'image') {
      uploadPath = join(__dirname, '../../../uploads/images');
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = Router();

export default function createLessonsRouter(prisma) {
  // Get lessons for a discipline
  router.get('/:disciplineId', async (req, res) => {
    try {
      const lessons = await prisma.lesson.findMany({
        where: {
          disciplineId: parseInt(req.params.disciplineId)
        },
        include: {
          content: true
        },
        orderBy: {
          order: 'asc'
        }
      });
      res.json(lessons);
    } catch (error) {
      console.error('Error getting lessons:', error);
      res.status(500).json({ error: 'Erro ao buscar aulas' });
    }
  });

  // Create a new lesson with multiple file uploads
  router.post('/:disciplineId', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { title, description, order } = req.body;
      const disciplineId = parseInt(req.params.disciplineId);

      console.log('Creating lesson with data:', {
        title,
        description,
        order,
        disciplineId,
        files: req.files
      });

      let content = null;

      // Create content if a file was uploaded
      if (req.files) {
        let file;
        let type;
        if (req.files['video']) {
          file = req.files['video'][0];
          type = 'VIDEO';
        } else if (req.files['pdf']) {
          file = req.files['pdf'][0];
          type = 'PDF';
        } else if (req.files['image']) {
          file = req.files['image'][0];
          type = 'IMAGE';
        }

        if (file) {
          content = await prisma.content.create({
            data: {
              type,
              url: `/uploads/${type.toLowerCase()}s/${file.filename}`,
              filename: file.filename,
              mimeType: file.mimetype,
              size: file.size
            }
          });
        }
      }

      // Create lesson and link it to the content if it exists
      const lesson = await prisma.lesson.create({
        data: {
          title,
          description,
          order: parseInt(order || '1'),
          disciplineId,
          ...(content && { contentId: content.id })
        },
        include: {
          content: true
        }
      });

      console.log('Lesson created successfully:', lesson);
      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ error: 'Erro ao criar aula' });
    }
  });

  // Update a lesson with multiple file uploads
  router.put('/:disciplineId/:lessonId', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { title, description, order } = req.body;
      const lessonId = parseInt(req.params.lessonId);
      const disciplineId = parseInt(req.params.disciplineId);

      // Verify if lesson exists and belongs to the discipline
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          id: lessonId,
          disciplineId: disciplineId
        },
        include: {
          content: true
        }
      });

      if (!existingLesson) {
        return res.status(404).json({ error: 'Aula não encontrada' });
      }

      let content = existingLesson.content;

      // Update content if a new file was uploaded
      if (req.files) {
        let file;
        let type;
        if (req.files['video']) {
          file = req.files['video'][0];
          type = 'VIDEO';
        } else if (req.files['pdf']) {
          file = req.files['pdf'][0];
          type = 'PDF';
        } else if (req.files['image']) {
          file = req.files['image'][0];
          type = 'IMAGE';
        }

        if (file) {
          if (content) {
            content = await prisma.content.update({
              where: { id: content.id },
              data: {
                type,
                url: `/uploads/${type.toLowerCase()}s/${file.filename}`,
                filename: file.filename,
                mimeType: file.mimetype,
                size: file.size
              }
            });
          } else {
            content = await prisma.content.create({
              data: {
                type,
                url: `/uploads/${type.toLowerCase()}s/${file.filename}`,
                filename: file.filename,
                mimeType: file.mimetype,
                size: file.size
              }
            });
          }
        }
      }

      // Update lesson
      const lesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: {
          title,
          description,
          order: parseInt(order),
          ...(content && { contentId: content.id })
        },
        include: {
          content: true
        }
      });

      res.json(lesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ error: 'Erro ao atualizar aula' });
    }
  });

  // Delete a lesson
  router.delete('/:disciplineId/:lessonId', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const disciplineId = parseInt(req.params.disciplineId);

      // Verify if lesson exists and belongs to the discipline
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          id: lessonId,
          disciplineId: disciplineId
        },
        include: {
          content: true
        }
      });

      if (!existingLesson) {
        return res.status(404).json({ error: 'Aula não encontrada' });
      }

      // Delete content if it exists
      if (existingLesson.content) {
        await prisma.content.delete({
          where: { id: existingLesson.content.id }
        });
      }

      // Delete lesson
      const lesson = await prisma.lesson.delete({
        where: { id: lessonId }
      });

      res.json(lesson);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      res.status(500).json({ error: 'Erro ao excluir aula' });
    }
  });

  // Delete a specific file from a lesson
  router.delete('/:lessonId/file/:fileType', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const fileType = req.params.fileType.toUpperCase();

      // Verify if lesson exists
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { content: true }
      });

      if (!lesson || !lesson.content) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      const content = lesson.content;

      // Only delete if the content type matches
      if (content.type === fileType) {
        // Delete the physical file
        try {
          const filePath = join(__dirname, '../../../', content.url);
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error deleting physical file:', error);
        }

        // Delete the content record
        await prisma.content.delete({
          where: { id: content.id }
        });

        // Update the lesson to remove the content reference
        await prisma.lesson.update({
          where: { id: lessonId },
          data: { contentId: null }
        });

        res.json({ message: 'Arquivo excluído com sucesso' });
      } else {
        res.status(400).json({ error: 'Tipo de arquivo não corresponde' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Erro ao excluir arquivo' });
    }
  });

  return router;
}
