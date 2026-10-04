from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Hospital, Review, Appointment, DoctorProfile
from utils import haversine_km, roles_required

hospitals_bp = Blueprint("hospitals", __name__, url_prefix="/api/hospitals")


@hospitals_bp.route("", methods=["GET"])
def list_hospitals():
    """Public: list hospitals. Optional ?lat=&lng= to compute distance (used for
    GPS-nearest sorting); ?specialty= to filter; ?sort=rating|distance
    (default rating, falls back to rating if no lat/lng given)."""
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    specialty = request.args.get("specialty")
    sort = request.args.get("sort", "rating")

    query = Hospital.query.filter_by(is_active=True)
    if specialty:
        query = query.filter(Hospital.specialties.ilike(f"%{specialty}%"))

    hospitals = query.all()
    results = []
    for h in hospitals:
        dist = haversine_km(lat, lng, h.latitude, h.longitude) if lat is not None and lng is not None else None
        results.append((h, dist))

    if sort == "distance" and lat is not None and lng is not None:
        results.sort(key=lambda pair: (pair[1] if pair[1] is not None else 1e9))
    else:
        # default: sorted by rating (highest first), tie-broken by review count
        results.sort(key=lambda pair: (-pair[0].rating_avg, -pair[0].rating_count))

    return jsonify([h.to_dict(distance_km=dist) for h, dist in results]), 200


@hospitals_bp.route("/<int:hospital_id>", methods=["GET"])
def get_hospital(hospital_id):
    h = Hospital.query.get_or_404(hospital_id)
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    dist = haversine_km(lat, lng, h.latitude, h.longitude) if lat is not None and lng is not None else None
    data = h.to_dict(distance_km=dist)
    data["doctors"] = [d.to_dict() for d in h.doctors]
    return jsonify(data), 200


@hospitals_bp.route("/<int:hospital_id>/reviews", methods=["GET"])
def list_reviews(hospital_id):
    Hospital.query.get_or_404(hospital_id)
    reviews = (
        Review.query.filter_by(hospital_id=hospital_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in reviews]), 200


@hospitals_bp.route("/<int:hospital_id>/reviews", methods=["POST"])
@roles_required("patient")
def add_review(hospital_id):
    """A patient can review a hospital only after a completed appointment there."""
    user_id = int(get_jwt_identity())
    hospital = Hospital.query.get_or_404(hospital_id)
    data = request.get_json() or {}
    rating = data.get("rating")
    comment = (data.get("comment") or "").strip()
    appointment_id = data.get("appointment_id")

    if not rating or not (1 <= int(rating) <= 5):
        return jsonify({"error": "rating must be between 1 and 5"}), 400

    appt = None
    if appointment_id:
        appt = Appointment.query.get_or_404(appointment_id)
        if appt.patient_id != user_id:
            return jsonify({"error": "Forbidden"}), 403
        if appt.status != "completed":
            return jsonify({"error": "You can only review after a completed appointment"}), 400
        if appt.doctor_profile.hospital_id != hospital_id:
            return jsonify({"error": "This appointment was not at this hospital"}), 400
        if appt.reviewed:
            return jsonify({"error": "You already reviewed this appointment"}), 409
    else:
        # fall back: require at least one completed appointment at this hospital
        has_visit = (
            Appointment.query.join(DoctorProfile)
            .filter(
                Appointment.patient_id == user_id,
                Appointment.status == "completed",
                DoctorProfile.hospital_id == hospital_id,
            )
            .first()
        )
        if not has_visit:
            return jsonify({"error": "You can only review hospitals you've visited"}), 400

    review = Review(
        hospital_id=hospital_id,
        patient_id=user_id,
        appointment_id=appointment_id,
        rating=int(rating),
        comment=comment,
    )
    hospital.rating_sum += int(rating)
    hospital.rating_count += 1
    if appt:
        appt.reviewed = True
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201
