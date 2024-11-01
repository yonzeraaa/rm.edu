import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

export default function createAuthRouter(prisma) {
  // Login route
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Debug log for incoming request
      console.log('Server: Login request received:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        body: { email, password: '***' },
        headers: {
          'content-type': req.get('content-type'),
          'origin': req.get('origin'),
          'host': req.get('host'),
          'user-agent': req.get('user-agent'),
          'authorization': req.get('authorization') ? 'present' : 'not present'
        },
        ip: req.ip,
        protocol: req.protocol,
        secure: req.secure
      });

      const user = await prisma.user.findFirst({
        where: { 
          email,
          role: 'STUDENT' // Adiciona verificação da role
        }
      });

      if (!user) {
        console.log('Server: User not found:', email);
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        console.log('Server: Invalid password for user:', email);
        return res.status(401).json({ error: 'Senha inválida' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Debug log for successful login
      console.log('Server: Login successful:', {
        timestamp: new Date().toISOString(),
        email: user.email,
        userId: user.id,
        tokenPreview: token.substring(0, 20) + '...',
        responseHeaders: res.getHeaders()
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          whatsapp: user.whatsapp,
          role: user.role
        }
      });
    } catch (error) {
      // Debug log for login error
      console.error('Server: Login error:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        requestBody: req.body,
        requestHeaders: req.headers
      });
      
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  });

  // Register route
  router.post('/register', async (req, res) => {
    try {
      const { email, password, fullName, selectedCourse, whatsapp } = req.body;
      
      // Debug log for register request
      console.log('Server: Register request received:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        body: { 
          email, 
          fullName,
          whatsapp,
          selectedCourse,
          password: '***'
        },
        headers: {
          'content-type': req.get('content-type'),
          'origin': req.get('origin'),
          'host': req.get('host')
        }
      });

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user and enrollment in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create the user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            fullName,
            whatsapp,
            role: 'STUDENT'
          }
        });

        // Create the enrollment
        if (selectedCourse) {
          await prisma.enrollment.create({
            data: {
              userId: user.id,
              courseId: parseInt(selectedCourse)
            }
          });
        }

        return user;
      });

      // Debug log for successful registration
      console.log('Server: Registration successful:', {
        timestamp: new Date().toISOString(),
        email: result.email,
        userId: result.id
      });

      const token = jwt.sign(
        { 
          id: result.id, 
          email: result.email,
          role: result.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: result.id,
          email: result.email,
          fullName: result.fullName,
          whatsapp: result.whatsapp,
          role: result.role
        }
      });
    } catch (error) {
      // Debug log for registration error
      console.error('Server: Registration error:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        requestBody: req.body,
        requestHeaders: req.headers
      });
      
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  });

  return router;
}
