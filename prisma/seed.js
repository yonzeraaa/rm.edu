import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
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
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('Admin user created:', admin.email);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
