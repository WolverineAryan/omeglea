import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/omeglea'),
  JWT_SECRET: z.string().default('super-secret-jwt-key-omeglea-dev-mode-32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().default('super-secret-refresh-key-omeglea-dev-mode-32chars'),
  EMAIL_FROM: z.string().default('noreply@omeglea.com'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  STUN_SERVER: z.string().default('stun:stun.l.google.com:19302'),
  TURN_SERVER: z.string().optional(),
  TURN_USERNAME: z.string().optional(),
  TURN_CREDENTIAL: z.string().optional(),
  PAYMENT_MODE: z.enum(['mock', 'live']).default('mock'),
  TRUST_PROXY: z.string().default('true').transform((val) => val === 'true' || val === '1'),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPI_MERCHANT_ID: z.string().default('omeglea@upi'),
  UPI_MERCHANT_NAME: z.string().default('Omeglea'),
  AUTO_APPROVE_UPI_PAYMENTS: z.string().default('true').transform((val) => val === 'true' || val === '1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
