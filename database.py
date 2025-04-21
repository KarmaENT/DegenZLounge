from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
import os

from app.models.agent import Base

# Database configuration
DATABASE_URI = os.environ.get('DATABASE_URI', 'postgresql://postgres:postgres@localhost:5432/degenz')

# Create engine
engine = create_engine(DATABASE_URI)

# Create session factory
db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

# Initialize Base
Base.query = db_session.query_property()

def init_db():
    """Initialize the database"""
    # Import all models here to ensure they are registered with Base
    import app.models.agent
    import app.models.user
    import app.models.sandbox
    
    # Create tables
    Base.metadata.create_all(bind=engine)

def close_db(e=None):
    """Close database connection"""
    db_session.remove()
