import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from extensions import db
from models import Report, Appointment
from utils import allowed_file

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.route("/appointments/<int:appt_id>", methods=["POST"])
@jwt_required()
def upload_report(appt_id):
    """Patient uploads a report/document (lab result, scan, etc.) for an appointment."""
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    appt = Appointment.query.get_or_404(appt_id)

    if claims.get("role") == "patient" and appt.patient_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file part named 'file' in the request"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename, current_app.config["ALLOWED_REPORT_EXTENSIONS"]):
        return jsonify({"error": "File type not allowed"}), 400

    original_name = secure_filename(file.filename)
    stored_name = f"{uuid.uuid4().hex}_{original_name}"
    os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
    filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name)
    file.save(filepath)

    report = Report(
        appointment_id=appt.id,
        patient_id=appt.patient_id,
        file_path=stored_name,
        original_filename=original_name,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201


@reports_bp.route("/appointments/<int:appt_id>", methods=["GET"])
@jwt_required()
def list_reports(appt_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    appt = Appointment.query.get_or_404(appt_id)

    if claims.get("role") == "patient" and appt.patient_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    if claims.get("role") == "doctor" and appt.doctor_profile.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify([r.to_dict() for r in appt.reports]), 200


@reports_bp.route("/<int:report_id>/download", methods=["GET"])
@jwt_required()
def download_report(report_id):
    report = Report.query.get_or_404(report_id)
    appt = Appointment.query.get_or_404(report.appointment_id)
    claims = get_jwt()
    user_id = int(get_jwt_identity())

    if claims.get("role") == "patient" and appt.patient_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    if claims.get("role") == "doctor" and appt.doctor_profile.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        report.file_path,
        as_attachment=True,
        download_name=report.original_filename,
    )
