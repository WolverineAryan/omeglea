import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter: nodemailer.Transporter | null = null;

if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT || 587,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

export async function sendVerificationEmail(
  toEmail: string,
  displayName: string,
  token: string
): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0B1020; color: #F8FAFC; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #121A2D; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 32px;">
        <h1 style="color: #8B5CF6; margin-top: 0;">Welcome to Omeglea</h1>
        <p style="color: #94A3B8; font-size: 16px;">Hi ${displayName},</p>
        <p style="color: #F8FAFC; font-size: 16px; line-height: 1.5;">
          Thank you for joining Omeglea — the adult random video discovery platform. Please confirm your email address to activate your account.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Verify My Email
          </a>
        </div>
        <p style="color: #64748B; font-size: 13px;">Or copy and paste this link: <br/><a href="${verifyUrl}" style="color: #8B5CF6;">${verifyUrl}</a></p>
      </div>
    </div>
  `;

  if (!transporter) {
    logger.info(`[MOCK EMAIL] To: ${toEmail} | Verify link: ${verifyUrl}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: 'Verify your Omeglea account',
      html,
    });
    logger.info(`Verification email sent to ${toEmail}`);
  } catch (err: any) {
    logger.error(`Failed to send verification email to ${toEmail}:`, err.message);
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  displayName: string,
  token: string
): Promise<void> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0B1020; color: #F8FAFC; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #121A2D; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 32px;">
        <h1 style="color: #8B5CF6; margin-top: 0;">Reset Your Password</h1>
        <p style="color: #94A3B8; font-size: 16px;">Hi ${displayName},</p>
        <p style="color: #F8FAFC; font-size: 16px; line-height: 1.5;">
          We received a request to reset your password. Click the button below to choose a new password. This link will expire in 1 hour.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748B; font-size: 13px;">If you did not request this, please ignore this email.</p>
      </div>
    </div>
  `;

  if (!transporter) {
    logger.info(`[MOCK EMAIL] To: ${toEmail} | Reset link: ${resetUrl}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: 'Reset your Omeglea password',
      html,
    });
    logger.info(`Password reset email sent to ${toEmail}`);
  } catch (err: any) {
    logger.error(`Failed to send password reset email to ${toEmail}:`, err.message);
  }
}
