import math
import random
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance in kilometers between two lat/lng points."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# Privacy-friendly display names used in place of a hospital's real name
# on the map (per product requirement: never show the actual hospital name).
_NAME_PREFIXES = [
    "Sunrise", "Evergreen", "Lakeview", "Riverside", "Harmony", "Northgate",
    "Wellspring", "Meridian", "Cedar", "Maple", "Horizon", "Beacon",
    "Serenity", "Crescent", "Silverline", "Oakwood", "Bluebell", "Amberly",
    "Trinity", "Parkview", "Sunstone", "Willowbrook", "Bayview", "Highfield",
]
_NAME_SUFFIXES = [
    "General Hospital", "Multi-Speciality Hospital", "Medical Center",
    "Care Hospital", "Health Institute", "City Hospital", "Wellness Center",
    "Specialty Hospital", "Clinic & Hospital",
]


def random_hospital_name(seed=None):
    rng = random.Random(seed)
    return f"{rng.choice(_NAME_PREFIXES)} {rng.choice(_NAME_SUFFIXES)}"


def roles_required(*allowed_roles):
    """Restrict a route to the given roles. Use after @jwt_required-style calls
    are handled internally, so just decorate the route directly."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in allowed_roles:
                return jsonify({"error": "Forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def allowed_file(filename, allowed_extensions):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in allowed_extensions
    )
