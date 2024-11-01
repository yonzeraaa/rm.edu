import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    // Check if admin exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@masettiedu.com' }
    });

    if (!adminExists) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@masettiedu.com',
          fullName: 'Administrador',
          whatsapp: '11999999999',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('Admin user created:', admin.email);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
