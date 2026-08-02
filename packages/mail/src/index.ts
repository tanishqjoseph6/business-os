export {
  getSmtpEnv,
  getSmtpEnvDiagnostics,
  isSmtpConfigured,
  logSmtpEnvDiagnostics,
  type SmtpEnv,
  type SmtpEnvDiagnostics,
  type SmtpEnvKey,
} from "./env";
export { formatMailError } from "./errors";
export { getMailTransport, verifyMailTransport } from "./transport";
export { sendMail, type SendMailInput } from "./send";
export {
  sendWaitlistInternalNotification,
  sendWaitlistSignupEmails,
  sendWaitlistWelcomeEmail,
  type WaitlistSignupEmailInput,
} from "./waitlist";
