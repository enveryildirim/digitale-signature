import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'kurum-dijital-bilgi-ekrani-secret-key-2026',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || '../uploads'),
  nodeEnv: process.env.NODE_ENV || 'development'
};
