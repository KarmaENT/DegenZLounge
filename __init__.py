from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import os
from dotenv import load_dotenv
from app.models.database import init_db, close_db

# Load environment variables
load_dotenv()

# Initialize Flask-SocketIO
socketio = SocketIO()

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Enable CORS
    CORS(app)
    
    # Set default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        DATABASE_URI=os.environ.get('DATABASE_URI', 'postgresql://postgres:postgres@localhost:5432/degenz'),
        GEMINI_API_KEY=os.environ.get('GEMINI_API_KEY', ''),
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
        
    # Initialize database
    with app.app_context():
        init_db()
    
    # Register database close function
    app.teardown_appcontext(close_db)

    # Register blueprints
    from app.api import bp as api_bp
    app.register_blueprint(api_bp)

    # Initialize SocketIO with the app
    socketio.init_app(app, cors_allowed_origins="*")

    return app
