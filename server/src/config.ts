import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

// Internete acik (production) kurulumda varsayilan secret/parola ile calismayi reddet
if (nodeEnv === 'production') {
  const missing = ['JWT_SECRET', 'ADMIN_PASSWORD'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Eksik ortam degiskeni: ${missing.join(', ')}. Production modunda zorunludur.`);
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'kurum-dijital-bilgi-ekrani-secret-key-2026',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || '../uploads'),
  nodeEnv
};
