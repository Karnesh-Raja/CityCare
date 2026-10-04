# CityCare — Hospitals & Pharmacy, on demand

A "Swiggy/Zomato for healthcare" web app: patients discover nearby hospitals
(GPS + ratings), book doctors, order medicines from outer pharmacies, and get
one-tap emergency ambulance dispatch. Built on top of a Flask + MySQL API and
a Next.js (App Router) + Tailwind frontend.

## Features implemented

1. **Hospital GPS location** — every hospital has lat/lng; patients see
   distance from their live location, and hospitals are shown under a
   randomly generated, non-identifying display name (never the real name).
2. **AI chatbot assistant** — a floating widget (bottom-left) with instant,
   rule-based answers about booking, pharmacy, payments, reviews and
   emergencies, available any time a patient is logged in. It's wired to be
   easy to swap for a real LLM later (see `components/ChatbotWidget.js`).
3. **Pharmacy & integrated billing** — search by tablet name or paste/upload
   an e-prescription; results come only from *outer* pharmacies (not the
   hospital's own), sorted by distance among the ones that actually have the
   medicine in stock, with cart + checkout.
4. **Personal profile dashboard** — `/patient/profile`: contact details,
   visit stats, language preference.
5. **QR-code patient profile** — scannable code on the profile page for fast
   hospital check-in.
6. **Alternate slot suggestion** — if a hospital cancels an appointment, the
   patient sees the next open slots with the same doctor and can rebook in
   one tap (`GET /api/appointments/<id>/alternate-slots`).
7. **Language selection** — English / Tamil / Hindi, switchable from the
   navbar or profile page, persisted per-browser.
8. **Multiple payment methods** — UPI, Card, Net Banking, Wallet, Cash —
   used for both appointment booking and pharmacy checkout.
9. **Rating-sorted hospitals + reviews** — hospital list defaults to
   highest-rated first (GPS-nearest is a toggle); patients can rate/review a
   hospital after a completed appointment.
10. **Emergency SOS button** — always-visible red button; shares the
    patient's live GPS location and dispatches the nearest *available*
    ambulance driver (drivers are added per-hospital by the admin, not
    self-registered).

## Project structure

```
backend/    Flask API (MySQL via SQLAlchemy, JWT auth)
frontend/   Next.js App Router + Tailwind
```

## Backend setup

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then edit DB credentials
# create a MySQL database matching DB_NAME in .env
python seed.py               # creates tables + demo hospitals/doctors/pharmacies
python app.py                 # runs on http://localhost:5000
```

Demo logins created by `seed.py`:
- Admin: `admin@citycare.com` / `Admin@123`
- Patient: `patient@citycare.com` / `Patient@123`
- Doctors: `doc0@citycare.com`, `doc1@citycare.com`, ... / `Doctor@123`

## Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if not default
npm run dev                         # runs on http://localhost:3000
```

## Notes on this build

- **Hospital names are randomized** on purpose (per the product requirement)
  — the admin can also type a real display name when adding a hospital via
  `/admin/hospitals`; leaving it blank auto-generates one.
- **Prescription reading** is a lightweight text-based stand-in (strip
  dosage/frequency noise, match against the medicine catalog) rather than a
  full OCR pipeline — swap in a real OCR/LLM call in
  `backend/routes/pharmacy.py::_extract_drug_terms` when you're ready.
- **Payments** are recorded (method + status) but not wired to a real
  gateway — plug in Razorpay/Stripe/UPI intents where `Payment` and
  `PharmacyOrder` are created in the backend.
- **Maps** use an embedded OpenStreetMap iframe (no API key required) rather
  than a JS map SDK, to keep the app dependency-free.
- The database is MySQL, matching the original project; switch
  `SQLALCHEMY_DATABASE_URI` in `backend/config.py` if you'd rather use
  Postgres/SQLite for local development.
  **Created by Karnesh Raja**
  *First year B.TECH student*
