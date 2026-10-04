# CityCare — Hospitals & Pharmacy, On Demand

CityCare is a healthcare web application designed to make it easier for patients to find hospitals, book doctor appointments, order medicines, and get help during emergencies.

The idea is similar to how apps like Swiggy or Zomato make services easier to access, but CityCare focuses on healthcare.

The project is built using **Flask + MySQL** for the backend and **Next.js + Tailwind CSS** for the frontend.

## What CityCare Can Do

### 1. Find Hospitals Using GPS

Patients can find hospitals based on their current location. Each hospital has latitude and longitude information, which is used to calculate the distance from the patient.

Hospitals are displayed using randomly generated names instead of directly showing their actual names.

Patients can also sort hospitals based on their ratings or choose the nearest hospitals using GPS.

### 2. AI Chatbot Assistant

CityCare has a chatbot available from the bottom-left corner of the website.

The chatbot can provide basic information related to:

* Doctor appointments
* Pharmacy orders
* Payments
* Hospital reviews
* Emergency services

Currently, the chatbot uses predefined/rule-based responses. The code is structured so that it can later be connected to an actual AI/LLM service.

The chatbot code is available in:

`frontend/components/ChatbotWidget.js`

### 3. Pharmacy and Medicine Ordering

Patients can search for medicines by entering the tablet or medicine name.

They can also paste or upload an e-prescription.

The system checks pharmacies outside the selected hospital and shows pharmacies that have the required medicine available.

Results are arranged based on distance, and patients can add medicines to a cart and proceed to checkout.

### 4. Patient Profile

Patients have their own profile page:

`/patient/profile`

The profile contains information such as:

* Contact details
* Number of visits
* Language preference
* Patient information

### 5. QR Code Patient Profile

A QR code is available on the patient profile.

It can be scanned at a hospital to quickly access the patient's profile information and make the check-in process easier.

### 6. Alternate Appointment Slots

Sometimes an appointment may get cancelled by the hospital.

Instead of making the patient search for the doctor again, CityCare shows the next available slots with the same doctor.

The patient can select another available slot and rebook the appointment.

API:

`GET /api/appointments/<id>/alternate-slots`

### 7. Language Selection

CityCare supports three languages:

* English
* Tamil
* Hindi

The language can be changed from the navigation bar or the patient profile.

The selected language is saved in the browser so that the patient does not have to select it every time.

### 8. Payment Methods

The application supports multiple payment options for appointments and pharmacy orders:

* UPI
* Card
* Net Banking
* Wallet
* Cash

At the moment, the application records the selected payment method and payment status.

Actual payment gateway integration can be added later.

### 9. Hospital Ratings and Reviews

Hospitals are displayed according to their ratings by default.

Patients can also switch to a GPS-based nearest-hospital view.

After completing an appointment, patients can give a rating and write a review for the hospital.

This helps other patients compare hospitals before booking.

### 10. Emergency SOS

An emergency SOS button is available on the website.

When the patient uses the SOS option, the application gets the patient's current GPS location and searches for the nearest available ambulance driver.

Ambulance drivers are added to hospitals by the administrator instead of allowing drivers to register themselves.

This is intended to make emergency ambulance requests faster.

---

# Project Structure

The project has two main parts:

```text
CityCare/
│
├── backend/
│   └── Flask + MySQL API
│
└── frontend/
    └── Next.js + Tailwind CSS
```

### Backend

The backend is developed using:

* Python
* Flask
* SQLAlchemy
* MySQL
* JWT Authentication

### Frontend

The frontend is developed using:

* Next.js
* App Router
* React
* Tailwind CSS

---

# Setting Up the Backend

First, open the terminal and move into the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it.

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows, you can also create `.env` manually by copying `.env.example`.

Open `.env` and enter your MySQL database details.

Create a MySQL database using the database name specified in `.env`.

After the database is ready, run:

```bash
python seed.py
```

This creates the required tables and adds some demo data such as hospitals, doctors and pharmacies.

Finally, start the Flask server:

```bash
python app.py
```

The backend will normally run at:

```text
http://localhost:5000
```

---

# Demo Accounts

The seed script creates some demo accounts for testing.

### Admin

```text
Email: admin@citycare.com
Password: Admin@123
```

### Patient

```text
Email: patient@citycare.com
Password: Patient@123
```

### Doctors

```text
Email: doc0@citycare.com
Email: doc1@citycare.com
...
Password: Doctor@123
```

These accounts are mainly provided for testing the different parts of the application.

---

# Setting Up the Frontend

Open another terminal and move to the frontend folder:

```bash
cd frontend
```

Install the required packages:

```bash
npm install
```

Create the environment file:

```bash
cp .env.local.example .env.local
```

If required, change the API URL inside `.env.local`.

For example:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the Next.js development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

---

# Some Notes About the Current Version

### Hospital Names

Hospital names are randomized as part of the current project requirement.

However, an administrator can enter a display name while adding a hospital through:

```text
/admin/hospitals
```

If no name is entered, the system generates one automatically.

### Prescription Reading

The prescription feature is currently a basic implementation.

It extracts medicine-related terms from the provided text and compares them with the medicine catalog.

It is not a complete OCR system yet.

The extraction logic is located in:

```text
backend/routes/pharmacy.py
```

inside:

```text
_extract_drug_terms
```

A proper OCR or AI-based prescription reader can be added in the future.

### Payments

Payment methods are currently implemented at the application level.

The selected payment method and payment status are stored in the database, but the application is not connected to an actual payment gateway yet.

Razorpay, Stripe or another payment service can be integrated later.

### Maps

The application currently uses an embedded OpenStreetMap view.

This was chosen so that the project does not require a separate map API key.

### Database

CityCare currently uses MySQL with SQLAlchemy.

For local development, the database can also be changed to SQLite or PostgreSQL by modifying the database configuration in:

```text
backend/config.py
```

---

# Future Improvements

Some features that can be added in future versions include:

* Real AI chatbot integration
* Proper prescription OCR
* Online payment gateway
* Live ambulance tracking
* Real-time notifications
* Hospital navigation
* Doctor video consultation
* Medicine delivery tracking
* More language support
* Better emergency response integration

---

## About the Project

**CityCare** was developed as a student software project with the idea of bringing different healthcare services together in one application.

The main goal is to make common healthcare tasks such as finding hospitals, booking appointments, ordering medicines and requesting emergency assistance simpler from a single platform.

**Created by Karnesh Raja**
*First Year B.Tech Student*
