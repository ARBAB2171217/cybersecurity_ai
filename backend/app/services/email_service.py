import smtplib
import asyncio
import logging
import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config.settings import settings
from app.services.email_template_builder import EmailTemplateBuilder

logger = logging.getLogger(__name__)

class EmailService:
    """
    Asynchronous Email Service using smtplib dispatched to background worker threads.
    """
    @staticmethod
    def _send_smtp_email(to_email: str, subject: str, html_content: str) -> None:
        """
        Synchronous SMTP execution handler.
        """
        if (not settings.SMTP_USER or 
            not settings.SMTP_PASSWORD or 
            "placeholder" in settings.SMTP_PASSWORD.lower() or 
            "placeholder" in settings.SMTP_USER.lower()):
            logger.warning(
                f"[MOCK EMAIL] SMTP settings are placeholders or not configured. Mocking email to {to_email}.\n"
                f"Subject: {subject}\n"
                f"Content Summary: {html_content[:300]}..."
            )
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            logger.info(f"Email successfully sent to {to_email}")
        except Exception as e:
            logger.error(
                f"Failed to send SMTP email to {to_email}: {e}. "
                f"Falling back to console logging.\n"
                f"Subject: {subject}"
            )
            # In development/test mode, do not fail the request
            if settings.APP_ENV not in ("development", "test") and not settings.DEBUG:
                raise e

    async def send_email(self, to_email: str, subject: str, html_content: str) -> None:
        """
        Non-blocking dispatch of SMTP mail request.
        """
        await asyncio.to_thread(self._send_smtp_email, to_email, subject, html_content)

    async def send_otp_email(self, to_email: str, otp_code: str, purpose: str) -> None:
        """
        Sends OTP verification code inside an HTML email template.
        """
        logger.warning(f"--- [QA VERIFICATION] OTP CODE FOR {to_email}: {otp_code} (Purpose: {purpose}) ---")
        subject = f"🛡️ CyberShield OTP: {otp_code} (Verification)"
        html_content = EmailTemplateBuilder.build_otp_email(purpose, otp_code)
        await self.send_email(to_email, subject, html_content)

    async def send_verification_email(self, to_email: str, recipient_name: str, verification_url: str) -> None:
        """
        Sends account email verification link to verify user identity.
        """
        subject = "🛡️ CyberShield AI: Verify Email Address"
        html_content = EmailTemplateBuilder.build_verification_email(recipient_name, verification_url)
        await self.send_email(to_email, subject, html_content)

    async def send_welcome_email(self, to_email: str, recipient_name: str) -> None:
        """
        Sends welcoming platform guidelines to a newly verified user.
        """
        subject = "🛡️ CyberShield AI: Welcome to Security Scan Desk!"
        html_content = EmailTemplateBuilder.build_welcome_email(recipient_name)
        await self.send_email(to_email, subject, html_content)

    async def send_password_changed_email(self, to_email: str, recipient_name: str) -> None:
        """
        Sends security warning indicating a password modification event.
        """
        subject = "🛡️ CyberShield AI: Password Modification Event"
        html_content = EmailTemplateBuilder.build_password_changed_email(recipient_name)
        await self.send_email(to_email, subject, html_content)

email_service = EmailService()
