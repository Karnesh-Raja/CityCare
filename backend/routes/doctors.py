from datetime import datetime, timedelta, date as date_cls
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import DoctorProfile, Availability, Appointment, User
from utils import roles_required

doctors_bp = Blueprint("doctors", __name__, url_prefix="/api/doctors")


@doctors_bp.route("", methods=["GET"])
def list_doctors():
    """Public: search/list doctors. Query params: specialization, q (name search)."""
    query = DoctorProfile.query.join(User)
    specialization = request.args.get("specialization")
    q = request.args.get("q")
    if specialization:
        query = query.filter(DoctorProfile.specialization.ilike(f"%{specialization}%"))
    if q:
        query = query.filter(User.name.ilike(f"%{q}%"))
    doctors = query.all()
    return jsonify([d.to_dict() for d in doctors]), 200


@doctors_bp.route("/specializations", methods=["GET"])
def specializations():
    rows = db.session.query(DoctorProfile.specialization).distinct().all()
    return jsonify(sorted({r[0] for r in rows})), 200


@doctors_bp.route("/<int:doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    doctor = DoctorProfile.query.get_or_404(doctor_id)
    return jsonify(doctor.to_dict()), 200


@doctors_bp.route("/me/profile", methods=["GET", "PUT"])
@roles_required("doctor")
def my_profile():
    user_id = int(get_jwt_identity())
    profile = DoctorProfile.query.filter_by(user_id=user_id).first_or_404()
    if request.method == "GET":
        return jsonify(profile.to_dict()), 200

    data = request.get_json() or {}
    for field in ["specialization", "qualification", "experience_years", "consultation_fee", "bio"]:
        if field in data:
            setattr(profile, field, data[field])
    db.session.commit()
    return jsonify(profile.to_dict()), 200


@doctors_bp.route("/me/availability", methods=["GET", "POST"])
@roles_required("doctor")
def my_availability():
    user_id = int(get_jwt_identity())
    profile = DoctorProfile.query.filter_by(user_id=user_id).first_or_404()

    if request.method == "GET":
        return jsonify([a.to_dict() for a in profile.availabilities]), 200

    data = request.get_json() or {}
    slot = Availability(
        doctor_id=profile.id,
        day_of_week=data["day_of_week"],
        start_time=datetime.strptime(data["start_time"], "%H:%M").time(),
        end_time=datetime.strptime(data["end_time"], "%H:%M").time(),
        slot_duration_minutes=data.get("slot_duration_minutes", 30),
    )
    db.session.add(slot)
    db.session.commit()
    return jsonify(slot.to_dict()), 201


@doctors_bp.route("/me/availability/<int:slot_id>", methods=["DELETE"])
@roles_required("doctor")
def delete_availability(slot_id):
    user_id = int(get_jwt_identity())
    profile = DoctorProfile.query.filter_by(user_id=user_id).first_or_404()
    slot = Availability.query.filter_by(id=slot_id, doctor_id=profile.id).first_or_404()
    db.session.delete(slot)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@doctors_bp.route("/<int:doctor_id>/slots", methods=["GET"])
@jwt_required()
def available_slots(doctor_id):
    """Return open slots for a doctor on a given date (?date=YYYY-MM-DD),
    generated from their weekly availability minus already-booked appointments."""
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "date query param (YYYY-MM-DD) is required"}), 400
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400
    if target_date < date_cls.today():
        return jsonify({"error": "Cannot book a date in the past"}), 400

    doctor = DoctorProfile.query.get_or_404(doctor_id)
    day_of_week = target_date.weekday()  # 0=Monday

    windows = Availability.query.filter_by(doctor_id=doctor.id, day_of_week=day_of_week).all()
    if not windows:
        return jsonify([]), 200

    booked = Appointment.query.filter_by(
        doctor_id=doctor.id, appointment_date=target_date
    ).filter(Appointment.status != "cancelled").all()
    booked_starts = {b.start_time.strftime("%H:%M") for b in booked}

    slots = []
    for w in windows:
        cur = datetime.combine(target_date, w.start_time)
        end = datetime.combine(target_date, w.end_time)
        step = timedelta(minutes=w.slot_duration_minutes)
        while cur + step <= end:
            label = cur.strftime("%H:%M")
            if label not in booked_starts:
                slots.append({
                    "start_time": label,
                    "end_time": (cur + step).strftime("%H:%M"),
                })
            cur += step

    return jsonify(slots), 200
