from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from extensions import db
from models import SOSRequest, AmbulanceDriver, Hospital
from utils import haversine_km, roles_required

emergency_bp = Blueprint("emergency", __name__, url_prefix="/api/sos")


@emergency_bp.route("", methods=["POST"])
@roles_required("patient")
def raise_sos():
    """The big red SOS button. Sends the patient's live location and finds the
    nearest available ambulance driver (added by a hospital admin) to dispatch."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    lat = data.get("lat")
    lng = data.get("lng")
    notes = data.get("notes", "")

    if lat is None or lng is None:
        return jsonify({"error": "lat and lng are required"}), 400

    drivers = AmbulanceDriver.query.filter_by(is_available=True).all()
    if not drivers:
        return jsonify({"error": "No ambulance drivers are available right now. Please call 108 (national ambulance) immediately."}), 503

    nearest = min(drivers, key=lambda d: haversine_km(lat, lng, d.latitude, d.longitude))
    dist = haversine_km(lat, lng, nearest.latitude, nearest.longitude)

    sos = SOSRequest(
        patient_id=user_id,
        hospital_id=nearest.hospital_id,
        driver_id=nearest.id,
        latitude=lat,
        longitude=lng,
        notes=notes,
        status="dispatched",
    )
    nearest.is_available = False
    db.session.add(sos)
    db.session.commit()

    result = sos.to_dict()
    result["driver_distance_km"] = round(dist, 1)
    return jsonify(result), 201


@emergency_bp.route("/<int:sos_id>", methods=["GET"])
def get_sos(sos_id):
    sos = SOSRequest.query.get_or_404(sos_id)
    return jsonify(sos.to_dict()), 200


@emergency_bp.route("/<int:sos_id>/status", methods=["PATCH"])
def update_sos_status(sos_id):
    """Used by the ambulance driver / hospital front desk to update progress."""
    sos = SOSRequest.query.get_or_404(sos_id)
    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in {"dispatched", "enroute", "arrived", "cancelled"}:
        return jsonify({"error": "Invalid status"}), 400
    sos.status = new_status
    if new_status in {"arrived", "cancelled"} and sos.driver:
        sos.driver.is_available = True
    db.session.commit()
    return jsonify(sos.to_dict()), 200


@emergency_bp.route("/mine", methods=["GET"])
@roles_required("patient")
def my_sos_history():
    user_id = int(get_jwt_identity())
    rows = SOSRequest.query.filter_by(patient_id=user_id).order_by(SOSRequest.created_at.desc()).all()
    return jsonify([r.to_dict() for r in rows]), 200
