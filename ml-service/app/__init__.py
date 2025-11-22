from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "ngrok-skip-browser-warning"]
        }
    })
    
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        return response
    
    from app.routes.analysis import analysis_bp
    app.register_blueprint(analysis_bp, url_prefix='/api')
    
    return app
