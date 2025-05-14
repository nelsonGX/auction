import { PrismaClient } from '@prisma/client';

// Export a singleton instance of the PrismaClient
const prisma = new PrismaClient();

export default prisma;