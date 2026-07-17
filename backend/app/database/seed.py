import asyncio
import logging
import app.database.models
from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
from app.security.password import hash_password
from app.models.admin import Admin, AdminRole

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Predefined Super Admin Details
SEED_ADMIN_EMAIL = "superadmin@cybershield.in"
SEED_ADMIN_NAME = "Super Admin"
# bcrypt hash for "SuperAdmin@123" (will be validated in future phases using pwd_context)
SEED_ADMIN_PASSWORD_HASH = "$2b$12$K.zGgZp9c/tqYg9m9K9jOe8D5tFskjOa8TepJ5fB2yJ6C6J9m3PkW"

def seed_database(db: Session) -> None:
    """
    Seeds the initial database state.
    Creates the default Super Admin if it does not exist.
    """
    logger.info("Starting database seeding...")
    
    # Check if any admin exists
    existing_admin = db.query(Admin).filter(Admin.email == SEED_ADMIN_EMAIL).first()
    if not existing_admin:
        super_admin = Admin(
            email=SEED_ADMIN_EMAIL,
            full_name=SEED_ADMIN_NAME,
            hashed_password=SEED_ADMIN_PASSWORD_HASH,
            role=AdminRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(super_admin)
        db.commit()
        logger.info(f"Created default Super Admin: {SEED_ADMIN_EMAIL}")
    else:
        logger.info("Super Admin already exists. Skipping seeding.")
        
    logger.info("Database seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
    finally:
        db.close()
