import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import Prescription, Appointment, DoctorProfile
from utils import roles_required

prescriptions_bp = Blueprint("prescriptions", __name__, url_prefix="/api/prescriptions")


@prescriptions_bp.route("/appointments/<int:appt_id>", methods=["POST"])
@roles_required("doctor")
def create_prescription(appt_id):
    user_id = int(get_jwt_identity())
    appt = Appointment.query.get_or_404(appt_id)
    profile = DoctorProfile.query.filter_by(user_id=user_id).first_or_404()

    if appt.doctor_profile.id != profile.id:
        return jsonify({"error": "Forbidden"}), 403
    if appt.prescription:
        return jsonify({"error": "A prescription already exists for this appointment"}), 409

    data = request.get_json() or {}
    prescription = Prescription(
        appointment_id=appt.id,
        doctor_id=profile.id,
        patient_id=appt.patient_id,
        diagnosis=data.get("diagnosis", ""),
        medicines=json.dumps(data.get("medicines", [])),
        notes=data.get("notes", ""),
    )
    db.session.add(prescription)
    appt.status = "completed"
    db.session.commit()
    return jsonify(prescription.to_dict()), 201


@prescriptions_bp.route("/appointments/<int:appt_id>", methods=["GET"])
@jwt_required()
def get_prescription(appt_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    appt = Appointment.query.get_or_404(appt_id)

    if claims.get("role") == "patient" and appt.patient_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    if claims.get("role") == "doctor" and appt.doctor_profile.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if not appt.prescription:
        return jsonify({"error": "No prescription yet"}), 404
    return jsonify(appt.prescription.to_dict()), 200
