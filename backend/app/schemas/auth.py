from pydantic import BaseModel, EmailStr, Field
from app.models.otp import OTPPurpose

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="The refresh token string")

class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID Token")

class OTPRequest(BaseModel):
    email: EmailStr
    purpose: OTPPurpose

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=10)
    purpose: OTPPurpose

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirmRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)
