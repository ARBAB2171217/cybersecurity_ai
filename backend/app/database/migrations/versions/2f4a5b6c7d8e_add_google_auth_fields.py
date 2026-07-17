"""add_google_auth_fields

Revision ID: 2f4a5b6c7d8e
Revises: db0f7aa3844e
Create Date: 2026-07-11 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f4a5b6c7d8e'
down_revision: Union[str, None] = 'db0f7aa3844e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('avatar', sa.String(length=512), nullable=True))
    op.add_column('users', sa.Column('provider', sa.String(length=50), nullable=False, server_default='local'))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'provider')
    op.drop_column('users', 'avatar')
    op.drop_column('users', 'google_id')
