from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    # patient | doctor | receptionist | admin
    role = db.Column(db.String(20), nullable=False, default="patient")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctor_profile = db.relationship(
        "DoctorProfile", backref="user", uselist=False, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_active": self.is_active,
        }


class Hospital(db.Model):
    __tablename__ = "hospitals"

    id = db.Column(db.Integer, primary_key=True)
    # public-facing name (randomized / generic, per privacy requirement)
    display_name = db.Column(db.String(160), nullable=False)
    city = db.Column(db.String(120), default="Chennai")
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(20))
    specialties = db.Column(db.String(400))  # comma separated
    image_emoji = db.Column(db.String(10), default="🏥")
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctors = db.relationship("DoctorProfile", backref="hospital")
    ambulance_drivers = db.relationship(
        "AmbulanceDriver", backref="hospital", cascade="all, delete-orphan"
    )
    reviews = db.relationship("Review", backref="hospital", cascade="all, delete-orphan")

    @property
    def rating_avg(self):
        if not self.rating_count:
            return 0.0
        return round(self.rating_sum / self.rating_count, 1)

    def to_dict(self, distance_km=None):
        d = {
            "id": self.id,
            "name": self.display_name,
            "city": self.city,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "phone": self.phone,
            "specialties": [s.strip() for s in (self.specialties or "").split(",") if s.strip()],
            "image_emoji": self.image_emoji,
            "rating_avg": self.rating_avg,
            "rating_count": self.rating_count,
            "doctor_count": len(self.doctors),
        }
        if distance_km is not None:
            d["distance_km"] = round(distance_km, 1)
        return d


class DoctorProfile(db.Model):
    __tablename__ = "doctor_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"))
    specialization = db.Column(db.String(120), nullable=False)
    qualification = db.Column(db.String(200))
    experience_years = db.Column(db.Integer, default=0)
    consultation_fee = db.Column(db.Numeric(10, 2), default=0)
    bio = db.Column(db.Text)

    availabilities = db.relationship(
        "Availability", backref="doctor", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.user.name,
            "email": self.user.email,
            "specialization": self.specialization,
            "qualification": self.qualification,
            "experience_years": self.experience_years,
            "consultation_fee": float(self.consultation_fee) if self.consultation_fee is not None else 0,
            "bio": self.bio,
            "hospital": self.hospital.to_dict() if self.hospital else None,
        }


class Availability(db.Model):
    __tablename__ = "availabilities"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor_profiles.id"), nullable=False)
    # 0=Monday ... 6=Sunday
    day_of_week = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    slot_duration_minutes = db.Column(db.Integer, default=30)

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "slot_duration_minutes": self.slot_duration_minutes,
        }


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor_profiles.id"), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    reason = db.Column(db.String(255))
    # pending | confirmed | completed | cancelled
    status = db.Column(db.String(20), default="pending")
    # who/why it was cancelled, e.g. "hospital" | "patient"; drives alternate-slot prompts
    cancelled_by = db.Column(db.String(20))
    cancel_reason = db.Column(db.String(255))
    reviewed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    booked_by = db.Column(db.Integer, db.ForeignKey("users.id"))  # receptionist or patient

    patient = db.relationship("User", foreign_keys=[patient_id])
    doctor_profile = db.relationship("DoctorProfile")
    reports = db.relationship("Report", backref="appointment", cascade="all, delete-orphan")
    prescription = db.relationship(
        "Prescription", backref="appointment", uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "patient": self.patient.to_dict(),
            "doctor": self.doctor_profile.to_dict(),
            "appointment_date": self.appointment_date.isoformat(),
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "reason": self.reason,
            "status": self.status,
            "cancelled_by": self.cancelled_by,
            "cancel_reason": self.cancel_reason,
            "reviewed": self.reviewed,
            "has_prescription": self.prescription is not None,
            "report_count": len(self.reports),
        }


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    file_path = db.Column(db.String(300), nullable=False)
    original_filename = db.Column(db.String(200), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "original_filename": self.original_filename,
            "uploaded_at": self.uploaded_at.isoformat(),
        }


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False, unique=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor_profiles.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    diagnosis = db.Column(db.Text)
    medicines = db.Column(db.Text)  # JSON-encoded list of {name, dosage, duration}
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "diagnosis": self.diagnosis,
            "medicines": json.loads(self.medicines) if self.medicines else [],
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }


class AmbulanceDriver(db.Model):
    """Ambulance drivers are added by the hospital admin, not self-registered."""
    __tablename__ = "ambulance_drivers"

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    vehicle_number = db.Column(db.String(30))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.display_name if self.hospital else None,
            "name": self.name,
            "phone": self.phone,
            "vehicle_number": self.vehicle_number,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_available": self.is_available,
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"))
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "patient_name": self.patient.name if self.patient else "Anonymous",
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }


class Pharmacy(db.Model):
    __tablename__ = "pharmacies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(20))
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)
    is_open_24h = db.Column(db.Boolean, default=False)

    stock = db.relationship("PharmacyStock", backref="pharmacy", cascade="all, delete-orphan")

    @property
    def rating_avg(self):
        if not self.rating_count:
            return 4.0
        return round(self.rating_sum / self.rating_count, 1)

    def to_dict(self, distance_km=None, matched_medicines=None):
        d = {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "phone": self.phone,
            "rating_avg": self.rating_avg,
            "is_open_24h": self.is_open_24h,
        }
        if distance_km is not None:
            d["distance_km"] = round(distance_km, 1)
        if matched_medicines is not None:
            d["matched_medicines"] = matched_medicines
        return d


class Medicine(db.Model):
    __tablename__ = "medicines"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False, unique=True, index=True)
    generic_name = db.Column(db.String(160))
    requires_prescription = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "generic_name": self.generic_name,
            "requires_prescription": self.requires_prescription,
        }


class PharmacyStock(db.Model):
    __tablename__ = "pharmacy_stock"

    id = db.Column(db.Integer, primary_key=True)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey("pharmacies.id"), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey("medicines.id"), nullable=False)
    price = db.Column(db.Numeric(10, 2), default=0)
    in_stock = db.Column(db.Boolean, default=True)

    medicine = db.relationship("Medicine")


class PharmacyOrder(db.Model):
    __tablename__ = "pharmacy_orders"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey("pharmacies.id"), nullable=False)
    items = db.Column(db.Text)  # JSON list of {name, qty, price}
    total_amount = db.Column(db.Numeric(10, 2), default=0)
    payment_method = db.Column(db.String(30))  # card | upi | netbanking | wallet | cod
    payment_status = db.Column(db.String(20), default="paid")
    status = db.Column(db.String(20), default="placed")  # placed | preparing | out_for_delivery | delivered
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    pharmacy = db.relationship("Pharmacy")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "pharmacy": self.pharmacy.to_dict() if self.pharmacy else None,
            "items": json.loads(self.items) if self.items else [],
            "total_amount": float(self.total_amount) if self.total_amount is not None else 0,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class Payment(db.Model):
    """Generic payment record for appointment consultation fees."""
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), default=0)
    method = db.Column(db.String(30))  # card | upi | netbanking | wallet | cash
    status = db.Column(db.String(20), default="paid")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "amount": float(self.amount) if self.amount is not None else 0,
            "method": self.method,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class SOSRequest(db.Model):
    __tablename__ = "sos_requests"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"))
    driver_id = db.Column(db.Integer, db.ForeignKey("ambulance_drivers.id"))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    notes = db.Column(db.String(300))
    status = db.Column(db.String(20), default="dispatched")  # dispatched | enroute | arrived | cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship("User")
    hospital = db.relationship("Hospital")
    driver = db.relationship("AmbulanceDriver")

    def to_dict(self):
        return {
            "id": self.id,
            "patient_name": self.patient.name if self.patient else None,
            "patient_phone": self.patient.phone if self.patient else None,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "hospital": self.hospital.to_dict() if self.hospital else None,
            "driver": self.driver.to_dict() if self.driver else None,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
