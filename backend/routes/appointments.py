from datetime import datetime, timedelta, date as date_cls
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import Appointment, DoctorProfile, User, Availability, Payment
from utils import roles_required

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")


@appointments_bp.route("", methods=["POST"])
@jwt_required()
def book_appointment():
    """Patients book for themselves; receptionists can book on behalf of a patient
    by passing patient_id."""
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    doctor_id = data.get("doctor_id")
    appointment_date = data.get("appointment_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    reason = data.get("reason", "")

    if not all([doctor_id, appointment_date, start_time, end_time]):
        return jsonify({"error": "doctor_id, appointment_date, start_time, end_time are required"}), 400

    if claims.get("role") == "receptionist":
        patient_id = data.get("patient_id")
        if not patient_id:
            return jsonify({"error": "patient_id is required when booking as receptionist"}), 400
        patient = User.query.filter_by(id=patient_id, role="patient").first()
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
    else:
        patient_id = user_id

    doctor = DoctorProfile.query.get_or_404(doctor_id)
    date_obj = datetime.strptime(appointment_date, "%Y-%m-%d").date()
    start_obj = datetime.strptime(start_time, "%H:%M").time()
    end_obj = datetime.strptime(end_time, "%H:%M").time()

    clash = Appointment.query.filter_by(
        doctor_id=doctor.id, appointment_date=date_obj, start_time=start_obj
    ).filter(Appointment.status != "cancelled").first()
    if clash:
        return jsonify({"error": "That slot has just been booked, please pick another"}), 409

    appt = Appointment(
        patient_id=patient_id,
        doctor_id=doctor.id,
        appointment_date=date_obj,
        start_time=start_obj,
        end_time=end_obj,
        reason=reason,
        status="pending",
        booked_by=user_id,
    )
    db.session.add(appt)
    db.session.flush()

    payment_method = data.get("payment_method")
    if payment_method:
        db.session.add(Payment(
            appointment_id=appt.id,
            patient_id=patient_id,
            amount=doctor.consultation_fee or 0,
            method=payment_method,
            status="paid",
        ))

    db.session.commit()
    return jsonify(appt.to_dict()), 201


@appointments_bp.route("", methods=["GET"])
@jwt_required()
def list_appointments():
    """Returns appointments scoped to the caller's role.
    Patients see their own; doctors see theirs; receptionists/admins see all
    (optionally filtered by ?status= or ?date=)."""
    claims = get_jwt()
    role = claims.get("role")
    user_id = int(get_jwt_identity())

    query = Appointment.query

    if role == "patient":
        query = query.filter_by(patient_id=user_id)
    elif role == "doctor":
        profile = DoctorProfile.query.filter_by(user_id=user_id).first_or_404()
        query = query.filter_by(doctor_id=profile.id)
    # receptionist / admin: no filter, see everything

    status = request.args.get("status")
    date_str = request.args.get("date")
    if status:
        query = query.filter_by(status=status)
    if date_str:
        query = query.filter_by(appointment_date=datetime.strptime(date_str, "%Y-%m-%d").date())

    appts = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc()).all()
    return jsonify([a.to_dict() for a in appts]), 200


@appointments_bp.route("/<int:appt_id>", methods=["GET"])
@jwt_required()
def get_appointment(appt_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    appt = Appointment.query.get_or_404(appt_id)

    if claims.get("role") == "patient" and appt.patient_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    if claims.get("role") == "doctor" and appt.doctor_profile.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(appt.to_dict()), 200


@appointments_bp.route("/<int:appt_id>/status", methods=["PATCH"])
@roles_required("doctor", "receptionist", "admin")
def update_status(appt_id):
    """Move an appointment through pending -> confirmed -> completed, or cancel it."""
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in {"pending", "confirmed", "completed", "cancelled"}:
        return jsonify({"error": "Invalid status"}), 400

    appt = Appointment.query.get_or_404(appt_id)

    claims = get_jwt()
    if claims.get("role") == "doctor":
        user_id = int(get_jwt_identity())
        if appt.doctor_profile.user_id != user_id:
            return jsonify({"error": "Forbidden"}), 403

    appt.status = new_status
    if new_status == "cancelled":
        # Track who cancelled so the patient app knows to offer alternate slots
        appt.cancelled_by = "hospital" if claims.get("role") in {"doctor", "receptionist", "admin"} else "patient"
        appt.cancel_reason = data.get("reason", "")
    db.session.commit()
    return jsonify(appt.to_dict()), 200


@appointments_bp.route("/<int:appt_id>/alternate-slots", methods=["GET"])
@jwt_required()
def alternate_slots(appt_id):
    """When a hospital cancels an appointment, suggest the next open slots with
    the same doctor across the coming days so the patient can rebook in one tap."""
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    appt = Appointment.query.get_or_404(appt_id)
    if claims.get("role") == "patient" and appt.patient_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    doctor = appt.doctor_profile
    days_ahead = int(request.args.get("days", 7))
    suggestions = []
    today = date_cls.today()

    for offset in range(1, days_ahead + 1):
        target_date = today + timedelta(days=offset)
        day_of_week = target_date.weekday()
        windows = Availability.query.filter_by(doctor_id=doctor.id, day_of_week=day_of_week).all()
        if not windows:
            continue
        booked = Appointment.query.filter_by(
            doctor_id=doctor.id, appointment_date=target_date
        ).filter(Appointment.status != "cancelled").all()
        booked_starts = {b.start_time.strftime("%H:%M") for b in booked}

        for w in windows:
            cur = datetime.combine(target_date, w.start_time)
            end = datetime.combine(target_date, w.end_time)
            step = timedelta(minutes=w.slot_duration_minutes)
            while cur + step <= end:
                label = cur.strftime("%H:%M")
                if label not in booked_starts:
                    suggestions.append({
                        "date": target_date.isoformat(),
                        "start_time": label,
                        "end_time": (cur + step).strftime("%H:%M"),
                    })
                cur += step
        if len(suggestions) >= 6:
            break

    return jsonify(suggestions[:6]), 200
