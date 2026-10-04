import json
import re
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from extensions import db
from models import Pharmacy, PharmacyStock, Medicine, PharmacyOrder
from utils import haversine_km, roles_required, allowed_file

pharmacy_bp = Blueprint("pharmacy", __name__, url_prefix="/api/pharmacy")


def _extract_drug_terms(text):
    """Very small heuristic 'prescription reader': splits free text (typed,
    or the caption/filename of an uploaded e-prescription) into candidate
    medicine names by stripping dosage/frequency noise."""
    if not text:
        return []
    text = re.sub(r"\b\d+\s?(mg|ml|mcg|g)\b", " ", text, flags=re.I)
    text = re.sub(r"\b(once|twice|thrice|daily|bd|od|tds|qid|tablet|tab|capsule|syrup|per day|days?)\b", " ", text, flags=re.I)
    parts = re.split(r"[,\n;/]+", text)
    terms = [p.strip() for p in parts if p.strip() and len(p.strip()) > 1]
    return terms


@pharmacy_bp.route("/medicines/search", methods=["GET"])
def search_medicine_names():
    """Autocomplete helper for the tablet-name search box."""
    q = request.args.get("q", "")
    query = Medicine.query
    if q:
        query = query.filter(Medicine.name.ilike(f"%{q}%"))
    return jsonify([m.to_dict() for m in query.limit(10).all()]), 200


@pharmacy_bp.route("/search", methods=["POST"])
def search_pharmacies():
    """Core 'find it nearby' flow. Accepts either:
      - { medicines: ["Paracetamol", "Amoxicillin"] } typed by the patient, or
      - { prescription_text: "Paracetamol 500mg BD, Azithromycin 250mg" }
        (stand-in for OCR text extracted from an uploaded e-prescription)
    plus optional lat/lng for GPS-nearest sorting.
    Returns pharmacies that stock at least one requested medicine, nearest first,
    each annotated with which of the requested medicines they have and the price.
    """
    data = request.get_json() or {}
    lat = data.get("lat")
    lng = data.get("lng")

    terms = [t.strip() for t in data.get("medicines", []) if t.strip()]
    terms += _extract_drug_terms(data.get("prescription_text", ""))
    terms = list(dict.fromkeys([t for t in terms if t]))  # de-dupe, keep order

    if not terms:
        return jsonify({"error": "Provide medicine names or prescription text"}), 400

    # Resolve fuzzy term -> known Medicine rows
    matched_medicine_ids = set()
    unresolved = []
    for term in terms:
        rows = Medicine.query.filter(Medicine.name.ilike(f"%{term}%")).all()
        if rows:
            matched_medicine_ids.update(r.id for r in rows)
        else:
            unresolved.append(term)

    pharmacies = Pharmacy.query.all()
    results = []
    for ph in pharmacies:
        stock_rows = [s for s in ph.stock if s.medicine_id in matched_medicine_ids and s.in_stock]
        if not stock_rows:
            continue
        dist = haversine_km(lat, lng, ph.latitude, ph.longitude) if lat is not None and lng is not None else None
        matched = [
            {"medicine": s.medicine.name, "price": float(s.price)} for s in stock_rows
        ]
        results.append((ph, dist, matched))

    # nearest first when we have the patient's location, else best rated
    if lat is not None and lng is not None:
        results.sort(key=lambda r: (r[1] if r[1] is not None else 1e9))
    else:
        results.sort(key=lambda r: -r[0].rating_avg)

    return jsonify({
        "resolved_terms": terms,
        "unresolved_terms": unresolved,
        "pharmacies": [ph.to_dict(distance_km=dist, matched_medicines=matched) for ph, dist, matched in results],
    }), 200


@pharmacy_bp.route("/prescription-upload", methods=["POST"])
@roles_required("patient")
def upload_prescription():
    """Accepts an uploaded e-prescription image/PDF. Since this demo has no OCR
    engine wired in, the patient can also paste the medicine names alongside the
    file; the file itself is stored and returned so it can be attached to the order."""
    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400
    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename, {"pdf", "png", "jpg", "jpeg"}):
        return jsonify({"error": "Unsupported file type"}), 400

    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "prescriptions")
    os.makedirs(folder, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(folder, stored_name))

    return jsonify({"file_token": stored_name, "original_filename": file.filename}), 201


@pharmacy_bp.route("/orders", methods=["POST"])
@roles_required("patient")
def place_order():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    pharmacy_id = data.get("pharmacy_id")
    items = data.get("items", [])  # [{name, qty, price}]
    payment_method = data.get("payment_method", "cod")

    if not pharmacy_id or not items:
        return jsonify({"error": "pharmacy_id and items are required"}), 400

    pharmacy = Pharmacy.query.get_or_404(pharmacy_id)
    total = sum(float(i.get("price", 0)) * int(i.get("qty", 1)) for i in items)

    order = PharmacyOrder(
        patient_id=user_id,
        pharmacy_id=pharmacy.id,
        items=json.dumps(items),
        total_amount=total,
        payment_method=payment_method,
        payment_status="paid" if payment_method != "cod" else "pending",
        status="placed",
    )
    db.session.add(order)
    db.session.commit()
    return jsonify(order.to_dict()), 201


@pharmacy_bp.route("/orders", methods=["GET"])
@roles_required("patient")
def my_orders():
    user_id = int(get_jwt_identity())
    orders = (
        PharmacyOrder.query.filter_by(patient_id=user_id)
        .order_by(PharmacyOrder.created_at.desc())
        .all()
    )
    return jsonify([o.to_dict() for o in orders]), 200
