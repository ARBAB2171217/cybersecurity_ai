import datetime

class EmailTemplateBuilder:
    """
    Generates premium, responsive HTML email templates for CyberShield AI.
    """

    @staticmethod
    def get_base_template(content: str, preview_text: str = "") -> str:
        current_year = datetime.datetime.now().year
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberShield AI</title>
  <style>
    body {{
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .email-container {{
      max-width: 600px;
      margin: 40px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      padding: 30px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }}
    .content {{
      padding: 40px 30px;
      line-height: 1.6;
    }}
    .content h2 {{
      color: #ffffff;
      font-size: 20px;
      margin-top: 0;
    }}
    .content p {{
      color: #9ca3af;
      font-size: 15px;
    }}
    .btn {{
      display: inline-block;
      padding: 12px 28px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 15px;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      text-align: center;
    }}
    .otp-box {{
      background: #1f2937;
      border: 1px solid #374151;
      padding: 20px;
      text-align: center;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #06b6d4;
      border-radius: 12px;
      margin: 25px 0;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    }}
    .footer {{
      background: #0b0f19;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      color: #6b7280;
    }}
    .security-tips {{
      background: rgba(6, 182, 212, 0.05);
      border-left: 4px solid #06b6d4;
      padding: 15px 20px;
      border-radius: 0 8px 8px 0;
      margin: 25px 0;
    }}
    .security-tips h3 {{
      margin: 0 0 8px 0;
      color: #06b6d4;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .security-tips ul {{
      margin: 0;
      padding-left: 20px;
      color: #9ca3af;
      font-size: 13px;
    }}
  </style>
</head>
<body>
  {preview_text}
  <div class="email-container">
    <div class="header">
      <h1>🛡️ CyberShield AI</h1>
    </div>
    <div class="content">
      {content}
    </div>
    <div class="footer">
      <p>&copy; {current_year} CyberShield AI Security Operations. All rights reserved.</p>
      <p>This is an automated operational transmission. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
"""

    @classmethod
    def build_verification_email(cls, recipient_name: str, verification_url: str) -> str:
        content = f"""
          <h2>Account Security Verification</h2>
          <p>Hello {recipient_name},</p>
          <p>Thank you for registering a profile on CyberShield AI. To activate your access and initialize security scanners, please confirm your email address by clicking the link below:</p>
          <div style="text-align: center;">
            <a href="{verification_url}" class="btn" target="_blank">Verify Email Address</a>
          </div>
          <p style="font-size: 13px; color: #6b7280; margin-top: 10px;">If the button doesn't work, copy and paste the following URL into your browser:</p>
          <p style="font-size: 12px; color: #06b6d4; word-break: break-all;">{verification_url}</p>
          <p>This link is active for 24 hours. If you did not initiate this registration, please contact CyberShield Security Operations immediately.</p>
        """
        preview = '<span style="display:none;font-size:0;color:transparent;max-height:0;overflow:hidden;">Verify your CyberShield AI account to activate threat scanners.</span>'
        return cls.get_base_template(content, preview)

    @classmethod
    def build_welcome_email(cls, recipient_name: str) -> str:
        content = f"""
          <h2>Welcome to CyberShield AI, {recipient_name}!</h2>
          <p>Your security profile has been successfully configured and activated.</p>
          <p>CyberShield AI provides automated defense tools, including real-time currency scanning, QR code intelligence, and conversational visual scam analyzer reports.</p>
          
          <div class="security-tips">
            <h3>🔒 Operational Security Recommendations</h3>
            <ul>
              <li>Enable Multi-Factor Authentication (MFA) on your dashboard account profile.</li>
              <li>Always check the domain name in the address bar before executing scans.</li>
              <li>Never share your access tokens, passwords, or OTP codes with anyone.</li>
              <li>Report any suspicious scan results directly to agency queues via the dashboard.</li>
            </ul>
          </div>
          
          <p>We are excited to have you on board. If you need any assistance, our secure AI Assistant panel is available 24/7 inside the dashboard console.</p>
        """
        preview = '<span style="display:none;font-size:0;color:transparent;max-height:0;overflow:hidden;">Welcome to CyberShield AI! Learn how to stay secure.</span>'
        return cls.get_base_template(content, preview)

    @classmethod
    def build_otp_email(cls, purpose: str, otp_code: str) -> str:
        content = f"""
          <h2>Security Verification Required</h2>
          <p>A verification request has been initiated for: <strong>{purpose}</strong>.</p>
          <p>Please enter the following One-Time Password (OTP) in your security prompt to authorize this request:</p>
          <div class="otp-box">{otp_code}</div>
          <p style="color: #ef4444; font-weight: 600; font-size: 13px;">⚠️ This code expires in 10 minutes and is valid for a single verification attempt.</p>
          <p>If you did not request this transmission, your account credentials may be compromised. Please reset your password immediately or lock your account.</p>
        """
        preview = f'<span style="display:none;font-size:0;color:transparent;max-height:0;overflow:hidden;">Your verification code is {otp_code}. Valid for 10 minutes.</span>'
        return cls.get_base_template(content, preview)

    @classmethod
    def build_password_changed_email(cls, recipient_name: str) -> str:
        content = f"""
          <h2>Password Changed Confirmation</h2>
          <p>Hello {recipient_name},</p>
          <p>This transmission confirms that the password for your CyberShield AI profile was successfully changed.</p>
          
          <div class="security-tips" style="border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05);">
            <h3 style="color: #ef4444;">⚠️ Did you not authorize this change?</h3>
            <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 13px;">
              If you did not make this change, please request a password reset immediately using the "Forgot Password" link on the landing page, or contact our security response team to secure your profile.
            </p>
          </div>
          
          <p>For your security, all active sessions on other devices have been automatically terminated.</p>
        """
        preview = '<span style="display:none;font-size:0;color:transparent;max-height:0;overflow:hidden;">Your password has been successfully updated.</span>'
        return cls.get_base_template(content, preview)

    @classmethod
    def build_unknown_device_email(cls, recipient_name: str, device_name: str, ip_address: str, location: str) -> str:
        content = f"""
          <h2>New Device Login Detected</h2>
          <p>Hello {recipient_name},</p>
          <p>We noticed a login to your CyberShield AI account from a new device.</p>
          <ul>
            <li><strong>Device:</strong> {device_name}</li>
            <li><strong>IP Address:</strong> {ip_address}</li>
            <li><strong>Location:</strong> {location}</li>
          </ul>
          <p>If this was you, no further action is required.</p>
          <p style="color: #ef4444; font-weight: 600;">If you did not authorize this login, please reset your password immediately and review your active sessions.</p>
        """
        preview = '<span style="display:none;font-size:0;color:transparent;max-height:0;overflow:hidden;">Security Alert: New device login detected.</span>'
        return cls.get_base_template(content, preview)

    @classmethod
    def build_google_account_linked_email(cls, recipient_name: str) -> str:
        content = f"""
          <h2>Google Account Linked</h2>
          <p>Hello {recipient_name},</p>
          <p>Your CyberShield AI account has been successfully linked to your Google Account.</p>
          <p>You can now use "Continue with Google" for faster, secure access to your dashboard.</p>
          <p>If you did not authorize this change, please contact our security team immediately.</p>
        """
        preview = '<span style="display:none;font-size:0;color:transparent;max-height:0;overflow:hidden;">Your account has been linked to Google.</span>'
        return cls.get_base_template(content, preview)

