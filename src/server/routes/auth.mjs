import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default function createAuthRouter(prisma) {
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt:', { email, body: req.body });

      if (!email || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          fullName: true,
          role: true,
        },
      });

      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful:', { email, userId: user.id });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro ao fazer login. Por favor, tente novamente.' });
    }
  });

  router.post('/register', async (req, res) => {
    try {
      const { email, fullName, whatsapp, password, selectedCourse } = req.body;
      console.log('Register attempt:', { email, fullName });

      if (!email || !password || !fullName || !whatsapp) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log('Email already registered:', email);
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          fullName,
          whatsapp,
          password: hashedPassword,
          role: email === 'admin@masettiedu.com' ? 'ADMIN' : 'STUDENT',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      });

      if (selectedCourse) {
        await prisma.enrollment.create({
          data: {
            userId: user.id,
            courseId: selectedCourse,
          },
        });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Registration successful:', { email, userId: user.id });

      res.json({
        token,
        user,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  });

  return router;
}
