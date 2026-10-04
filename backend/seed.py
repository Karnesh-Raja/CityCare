"""Run this once to create tables and demo data.

Usage:
    python seed.py
"""
import random
from app import create_app
from extensions import db
from models import (
    User, Hospital, DoctorProfile, Availability, AmbulanceDriver,
    Pharmacy, Medicine, PharmacyStock, Review,
)
from utils import random_hospital_name

app = create_app()

# Chennai-ish coordinates spread around the city center for demo purposes.
CENTER_LAT, CENTER_LNG = 13.0827, 80.2707

SPECIALTIES = [
    "Cardiology", "General Medicine", "Orthopedics", "Pediatrics",
    "Dermatology", "ENT", "Gynecology", "Neurology", "Dentistry",
]

MEDICINES = [
    ("Paracetamol", "Acetaminophen"), ("Amoxicillin", "Amoxicillin"),
    ("Azithromycin", "Azithromycin"), ("Cetirizine", "Cetirizine HCl"),
    ("Ibuprofen", "Ibuprofen"), ("Metformin", "Metformin HCl"),
    ("Amlodipine", "Amlodipine Besylate"), ("Omeprazole", "Omeprazole"),
    ("Atorvastatin", "Atorvastatin Calcium"), ("Losartan", "Losartan Potassium"),
    ("Cough Syrup", "Dextromethorphan"), ("Vitamin D3", "Cholecalciferol"),
    ("ORS Sachet", "Oral Rehydration Salts"), ("Pantoprazole", "Pantoprazole"),
    ("Aspirin", "Acetylsalicylic Acid"),
]


def jitter(base, spread=0.06):
    return base + random.uniform(-spread, spread)


def run():
    with app.app_context():
        db.create_all()
        print("Tables created (or already existed).")

        admin_email = "admin@citycare.com"
        if not User.query.filter_by(email=admin_email).first():
            admin = User(name="System Admin", email=admin_email, role="admin")
            admin.set_password("Admin@123")
            db.session.add(admin)
            db.session.commit()
            print(f"Created default admin: {admin_email} / Admin@123 (change this password!)")

        # ---- Hospitals ----
        if Hospital.query.count() == 0:
            hospitals = []
            for i in range(10):
                h = Hospital(
                    display_name=random_hospital_name(seed=i * 7 + 3),
                    city="Chennai",
                    address=f"{random.randint(1,200)} {random.choice(['Anna Salai','OMR','ECR','GST Road','Mount Road','Velachery Main Rd'])}, Chennai",
                    latitude=jitter(CENTER_LAT),
                    longitude=jitter(CENTER_LNG),
                    phone=f"044-{random.randint(20000000,29999999)}",
                    specialties=", ".join(random.sample(SPECIALTIES, k=4)),
                    image_emoji=random.choice(["🏥", "🏨", "⚕️"]),
                    rating_sum=0,
                    rating_count=0,
                )
                db.session.add(h)
                hospitals.append(h)
            db.session.commit()
            print(f"Seeded {len(hospitals)} hospitals.")

            # give each hospital a couple of doctors + availability + an ambulance driver
            first_names = ["Anitha", "Rahul", "Priya", "Karthik", "Divya", "Suresh", "Meena", "Arjun", "Lakshmi", "Vijay"]
            last_names = ["Kumar", "Raman", "Iyer", "Nair", "Reddy", "Pillai", "Menon", "Rao"]
            doc_count = 0
            for h in hospitals:
                for _ in range(random.randint(2, 3)):
                    name = f"Dr. {random.choice(first_names)} {random.choice(last_names)}"
                    email = f"doc{doc_count}@citycare.com"
                    if User.query.filter_by(email=email).first():
                        doc_count += 1
                        continue
                    user = User(name=name, email=email, phone=f"9{random.randint(100000000,999999999)}", role="doctor")
                    user.set_password("Doctor@123")
                    db.session.add(user)
                    db.session.flush()
                    profile = DoctorProfile(
                        user_id=user.id,
                        hospital_id=h.id,
                        specialization=random.choice(h.specialties.split(", ")),
                        qualification=random.choice(["MBBS, MD", "MBBS, MS", "MBBS, DNB"]),
                        experience_years=random.randint(3, 22),
                        consultation_fee=random.choice([300, 400, 500, 600, 800]),
                        bio="Experienced clinician focused on patient-first care.",
                    )
                    db.session.add(profile)
                    db.session.flush()
                    for dow in [0, 1, 2, 3, 4]:
                        db.session.add(Availability(
                            doctor_id=profile.id, day_of_week=dow,
                            start_time="09:00", end_time="13:00",
                            slot_duration_minutes=20,
                        ))
                    doc_count += 1

                driver = AmbulanceDriver(
                    hospital_id=h.id,
                    name=f"{random.choice(first_names)} {random.choice(last_names)}",
                    phone=f"9{random.randint(100000000,999999999)}",
                    vehicle_number=f"TN-{random.randint(10,99)}-AZ-{random.randint(1000,9999)}",
                    latitude=jitter(h.latitude, 0.02),
                    longitude=jitter(h.longitude, 0.02),
                    is_available=True,
                )
                db.session.add(driver)

                # seed a few reviews so ratings aren't empty
                for _ in range(random.randint(3, 9)):
                    h.rating_sum += random.randint(3, 5)
                    h.rating_count += 1
            db.session.commit()
            print(f"Seeded {doc_count} doctors, ambulance drivers, and demo ratings.")

        # ---- Medicines master list ----
        if Medicine.query.count() == 0:
            for name, generic in MEDICINES:
                db.session.add(Medicine(name=name, generic_name=generic, requires_prescription=name not in {"Paracetamol", "Vitamin D3", "ORS Sachet", "Cough Syrup"}))
            db.session.commit()
            print(f"Seeded {len(MEDICINES)} medicines.")

        # ---- Pharmacies (independent of hospitals, per requirement) ----
        if Pharmacy.query.count() == 0:
            pharmacy_names = [
                "Apollo Care Pharmacy", "MedPlus Express", "Wellness Chemist",
                "Guardian Pharmacy", "NetMeds Local Store", "City Health Pharmacy",
                "QuickMeds 24x7", "Trust Pharma", "GreenCross Chemist", "CarePoint Pharmacy",
            ]
            medicines_all = Medicine.query.all()
            pharmacies = []
            for name in pharmacy_names:
                ph = Pharmacy(
                    name=name,
                    address=f"{random.randint(1,150)} {random.choice(['Anna Nagar','T Nagar','Adyar','Velachery','Tambaram','Porur'])}, Chennai",
                    latitude=jitter(CENTER_LAT, 0.08),
                    longitude=jitter(CENTER_LNG, 0.08),
                    phone=f"9{random.randint(100000000,999999999)}",
                    is_open_24h=random.random() < 0.3,
                    rating_sum=random.randint(15, 45),
                    rating_count=random.randint(4, 10),
                )
                db.session.add(ph)
                pharmacies.append(ph)
            db.session.flush()
            for ph in pharmacies:
                stocked = random.sample(medicines_all, k=random.randint(6, len(medicines_all)))
                for m in stocked:
                    db.session.add(PharmacyStock(
                        pharmacy_id=ph.id, medicine_id=m.id,
                        price=round(random.uniform(15, 250), 2),
                        in_stock=random.random() > 0.1,
                    ))
            db.session.commit()
            print(f"Seeded {len(pharmacies)} pharmacies with stock.")

        # ---- Demo patient ----
        demo_email = "patient@citycare.com"
        if not User.query.filter_by(email=demo_email).first():
            patient = User(name="Demo Patient", email=demo_email, phone="9000000000", role="patient")
            patient.set_password("Patient@123")
            db.session.add(patient)
            db.session.commit()
            print(f"Created demo patient: {demo_email} / Patient@123")

        print("\nSeed complete.")


if __name__ == "__main__":
    run()
