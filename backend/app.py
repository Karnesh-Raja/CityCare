from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}})

    from routes.auth import auth_bp
    from routes.doctors import doctors_bp
    from routes.appointments import appointments_bp
    from routes.reports import reports_bp
    from routes.prescriptions import prescriptions_bp
    from routes.admin import admin_bp
    from routes.hospitals import hospitals_bp
    from routes.pharmacy import pharmacy_bp
    from routes.emergency import emergency_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(doctors_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(prescriptions_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(hospitals_bp)
    app.register_blueprint(pharmacy_bp)
    app.register_blueprint(emergency_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
