from flask import Blueprint, request, jsonify
from extensions import db
from models import User, DoctorProfile, Appointment, Hospital, AmbulanceDriver, SOSRequest
from utils import roles_required, random_hospital_name

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ---------- Hospitals ----------

@admin_bp.route("/hospitals", methods=["GET"])
@roles_required("admin")
def admin_list_hospitals():
    return jsonify([h.to_dict() for h in Hospital.query.order_by(Hospital.id).all()]), 200


@admin_bp.route("/hospitals", methods=["POST"])
@roles_required("admin")
def create_hospital():
    """Admin adds a hospital. If no display_name is given, a random,
    non-identifying name is generated automatically (privacy requirement)."""
    data = request.get_json() or {}
    lat, lng = data.get("latitude"), data.get("longitude")
    if lat is None or lng is None:
        return jsonify({"error": "latitude and longitude are required"}), 400

    hospital = Hospital(
        display_name=data.get("display_name") or random_hospital_name(),
        city=data.get("city", "Chennai"),
        address=data.get("address", ""),
        latitude=lat,
        longitude=lng,
        phone=data.get("phone", ""),
        specialties=data.get("specialties", ""),
        image_emoji=data.get("image_emoji", "🏥"),
    )
    db.session.add(hospital)
    db.session.commit()
    return jsonify(hospital.to_dict()), 201


@admin_bp.route("/hospitals/<int:hospital_id>", methods=["PUT"])
@roles_required("admin")
def update_hospital(hospital_id):
    hospital = Hospital.query.get_or_404(hospital_id)
    data = request.get_json() or {}
    for field in ["display_name", "city", "address", "latitude", "longitude", "phone", "specialties", "image_emoji", "is_active"]:
        if field in data:
            setattr(hospital, field, data[field])
    db.session.commit()
    return jsonify(hospital.to_dict()), 200


@admin_bp.route("/hospitals/<int:hospital_id>", methods=["DELETE"])
@roles_required("admin")
def delete_hospital(hospital_id):
    hospital = Hospital.query.get_or_404(hospital_id)
    db.session.delete(hospital)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


# ---------- Ambulance drivers (added by the hospital's admin) ----------

@admin_bp.route("/hospitals/<int:hospital_id>/ambulance-drivers", methods=["GET"])
@roles_required("admin")
def list_ambulance_drivers(hospital_id):
    Hospital.query.get_or_404(hospital_id)
    rows = AmbulanceDriver.query.filter_by(hospital_id=hospital_id).all()
    return jsonify([d.to_dict() for d in rows]), 200


@admin_bp.route("/hospitals/<int:hospital_id>/ambulance-drivers", methods=["POST"])
@roles_required("admin")
def add_ambulance_driver(hospital_id):
    hospital = Hospital.query.get_or_404(hospital_id)
    data = request.get_json() or {}
    if not all([data.get("name"), data.get("phone")]):
        return jsonify({"error": "name and phone are required"}), 400
    driver = AmbulanceDriver(
        hospital_id=hospital.id,
        name=data["name"],
        phone=data["phone"],
        vehicle_number=data.get("vehicle_number", ""),
        latitude=data.get("latitude", hospital.latitude),
        longitude=data.get("longitude", hospital.longitude),
        is_available=data.get("is_available", True),
    )
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201


@admin_bp.route("/ambulance-drivers/<int:driver_id>", methods=["PUT"])
@roles_required("admin")
def update_ambulance_driver(driver_id):
    driver = AmbulanceDriver.query.get_or_404(driver_id)
    data = request.get_json() or {}
    for field in ["name", "phone", "vehicle_number", "latitude", "longitude", "is_available"]:
        if field in data:
            setattr(driver, field, data[field])
    db.session.commit()
    return jsonify(driver.to_dict()), 200


@admin_bp.route("/ambulance-drivers/<int:driver_id>", methods=["DELETE"])
@roles_required("admin")
def delete_ambulance_driver(driver_id):
    driver = AmbulanceDriver.query.get_or_404(driver_id)
    db.session.delete(driver)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@admin_bp.route("/sos-requests", methods=["GET"])
@roles_required("admin", "receptionist")
def list_sos_requests():
    rows = SOSRequest.query.order_by(SOSRequest.created_at.desc()).limit(50).all()
    return jsonify([r.to_dict() for r in rows]), 200


@admin_bp.route("/users", methods=["GET"])
@roles_required("admin")
def list_users():
    role = request.args.get("role")
    query = User.query
    if role:
        query = query.filter_by(role=role)
    return jsonify([u.to_dict() for u in query.order_by(User.created_at.desc()).all()]), 200


@admin_bp.route("/users", methods=["POST"])
@roles_required("admin")
def create_staff_user():
    """Admin creates doctor / receptionist / admin accounts.
    (Patients self-register via /api/auth/register.)"""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role")
    phone = data.get("phone", "")

    if role not in {"doctor", "receptionist", "admin"}:
        return jsonify({"error": "role must be doctor, receptionist or admin"}), 400
    if not all([name, email, password]):
        return jsonify({"error": "name, email and password are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(name=name, email=email, phone=phone, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # get user.id before commit

    if role == "doctor":
        profile = DoctorProfile(
            user_id=user.id,
            hospital_id=data.get("hospital_id"),
            specialization=data.get("specialization", "General Medicine"),
            qualification=data.get("qualification", ""),
            experience_years=data.get("experience_years", 0),
            consultation_fee=data.get("consultation_fee", 0),
            bio=data.get("bio", ""),
        )
        db.session.add(profile)

    db.session.commit()
    return jsonify(user.to_dict()), 201


@admin_bp.route("/users/<int:user_id>/deactivate", methods=["PATCH"])
@roles_required("admin")
def deactivate_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = False
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/users/<int:user_id>/activate", methods=["PATCH"])
@roles_required("admin")
def activate_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = True
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/patients/search", methods=["GET"])
@roles_required("receptionist", "admin")
def search_patients():
    """Used by the front desk to find a patient to book on behalf of."""
    q = request.args.get("q", "")
    query = User.query.filter_by(role="patient")
    if q:
        query = query.filter(
            db.or_(User.name.ilike(f"%{q}%"), User.email.ilike(f"%{q}%"))
        )
    return jsonify([u.to_dict() for u in query.limit(20).all()]), 200


@admin_bp.route("/stats", methods=["GET"])
@roles_required("admin", "receptionist")
def stats():
    return jsonify({
        "total_patients": User.query.filter_by(role="patient").count(),
        "total_doctors": User.query.filter_by(role="doctor").count(),
        "total_receptionists": User.query.filter_by(role="receptionist").count(),
        "total_appointments": Appointment.query.count(),
        "pending_appointments": Appointment.query.filter_by(status="pending").count(),
        "completed_appointments": Appointment.query.filter_by(status="completed").count(),
    }), 200
