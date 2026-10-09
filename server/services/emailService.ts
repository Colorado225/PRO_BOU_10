/**
 * Service d'envoi d'emails pour l'authentification.
 *
 * En développement : les emails sont loggés dans la console.
 * En production : intégration avec un service SMTP (SendGrid, Mailgun, etc.)
 *
 * Compatible avec l'architecture Neon Auth (mêmes types d'emails).
 */

import { config } from "../config";
import { randomBytes } from "node:crypto";

export type EmailType =
  | "email-verification"
  | "password-reset"
  | "welcome"
  | "login-alert";

interface SendEmailOptions {
  to: string;
  type: EmailType;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoie un email (ou le log en développement).
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, type, subject, html, text } = options;

  if (config.nodeEnv === "development" || config.nodeEnv === "test") {
    // En développement, logger l'email dans la console
    console.log("\n" + "═".repeat(70));
    console.log(`📧 EMAIL [${type}] → ${to}`);
    console.log(`   Sujet : ${subject}`);
    console.log("─".repeat(70));
    console.log(text || html.replace(/<[^>]*>/g, ""));
    console.log("═".repeat(70) + "\n");
    return;
  }

  // En production, envoyer via SMTP/API
  // TODO : Intégrer SendGrid, Mailgun, ou AWS SES
  // Pour l'instant, logger en production aussi
  console.log(`[EMAIL] Envoi à ${to} (${type}) : ${subject}`);
}

/**
 * Génère un code OTP à 6 chiffres.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Génère un token sécurisé pour les liens de réinitialisation.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Envoie un email de vérification avec un code OTP.
 */
export async function sendVerificationEmail(
  email: string,
  otp: string,
  userName: string,
): Promise<void> {
  await sendEmail({
    to: email,
    type: "email-verification",
    subject: "Vérifiez votre adresse e-mail — BoulangeriePro",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafaf9; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 40px; }
            .otp { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #92400e; }
            .footer { background: #f5f5f4; padding: 24px; text-align: center; color: #78716c; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🥖 BoulangeriePro</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${userName},</h2>
              <p>Merci d'avoir créé votre compte professionnel sur BoulangeriePro.</p>
              <p>Pour finaliser votre inscription, veuillez vérifier votre adresse e-mail en saisissant le code ci-dessous :</p>
              <div class="otp">
                <div class="otp-code">${otp}</div>
              </div>
              <p>Ce code est valable pendant <strong>15 minutes</strong>.</p>
              <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BoulangeriePro — ERP pour boulangeries artisanales</p>
              <p>Côte d'Ivoire • Support : support@boulangeriepro.ci</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${userName},

Merci d'avoir créé votre compte professionnel sur BoulangeriePro.

Votre code de vérification : ${otp}

Ce code est valable pendant 15 minutes.

Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.

© ${new Date().getFullYear()} BoulangeriePro
    `,
  });
}

/**
 * Envoie un email de réinitialisation de mot de passe.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string,
): Promise<void> {
  const resetUrl = `${config.corsOrigin}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: email,
    type: "password-reset",
    subject: "Réinitialisation de votre mot de passe — BoulangeriePro",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafaf9; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 40px; }
            .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; }
            .footer { background: #f5f5f4; padding: 24px; text-align: center; color: #78716c; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🥖 BoulangeriePro</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${userName},</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li>Ce lien est valable pendant <strong>1 heure</strong></li>
                  <li>Si vous n'avez pas fait cette demande, ignorez cet e-mail</li>
                  <li>Ne partagez jamais ce lien avec quelqu'un d'autre</li>
                </ul>
              </div>
              <p style="color: #78716c; font-size: 14px;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <code style="background: #f5f5f4; padding: 4px 8px; border-radius: 4px; word-break: break-all;">${resetUrl}</code>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BoulangeriePro — ERP pour boulangeries artisanales</p>
              <p>Côte d'Ivoire • Support : support@boulangeriepro.ci</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${userName},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

⚠️ Important :
- Ce lien est valable pendant 1 heure
- Si vous n'avez pas fait cette demande, ignorez cet e-mail
- Ne partagez jamais ce lien avec quelqu'un d'autre

© ${new Date().getFullYear()} BoulangeriePro
    `,
  });
}

/**
 * Envoie un email de bienvenue après vérification.
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string,
): Promise<void> {
  await sendEmail({
    to: email,
    type: "welcome",
    subject: "Bienvenue sur BoulangeriePro ! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafaf9; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px; }
            .feature { display: flex; align-items: start; margin: 20px 0; }
            .feature-icon { background: #fef3c7; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0; }
            .footer { background: #f5f5f4; padding: 24px; text-align: center; color: #78716c; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue ${userName} !</h1>
            </div>
            <div class="content">
              <p>Votre compte professionnel est maintenant actif et vérifié.</p>
              <h3>Voici ce que vous pouvez faire dès maintenant :</h3>
              <div class="feature">
                <div class="feature-icon">📊</div>
                <div>
                  <strong>Suivre vos ventes en temps réel</strong>
                  <p style="margin: 4px 0; color: #78716c;">Visualisez votre chiffre d'affaires et vos produits les plus vendus</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🥐</div>
                <div>
                  <strong>Gérer votre production</strong>
                  <p style="margin: 4px 0; color: #78716c;">Planifiez vos fournées et suivez vos coûts de production</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📦</div>
                <div>
                  <strong>Contrôler vos stocks</strong>
                  <p style="margin: 4px 0; color: #78716c;">Gérez vos matières premières et évitez les ruptures</p>
                </div>
              </div>
              <a href="${config.corsOrigin}/dashboard" class="button">Accéder à mon tableau de bord</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BoulangeriePro — ERP pour boulangeries artisanales</p>
              <p>Côte d'Ivoire • Support : support@boulangeriepro.ci</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bienvenue ${userName} !

Votre compte professionnel est maintenant actif et vérifié.

Voici ce que vous pouvez faire dès maintenant :
- 📊 Suivre vos ventes en temps réel
- 🥐 Gérer votre production
- 📦 Contrôler vos stocks

Accédez à votre tableau de bord : ${config.corsOrigin}/dashboard

© ${new Date().getFullYear()} BoulangeriePro
    `,
  });
}
