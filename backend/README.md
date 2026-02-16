🎬 AnimVox – AI Video Generation Platform

AnimVox is a full-stack AI-powered video generation platform that allows users to create videos using multiple content tools with configurable usage limits, subscription plans, and an advanced admin control panel.

The system is designed for scalability, role-based access, and per-tool usage control, making it suitable for SaaS deployment.

🚀 Features
User Features

AI-based video generation using multiple tools

Per-tool video limits enforced by subscription plans

Multi-language support (including Urdu)

Video usage tracking

Secure authentication

Plan-based access control

Admin Features

Admin Dashboard (separate UI)

User management (view, edit, suspend, reset password)

Subscription plan management

Per-tool video limits (Tool 1 / Tool 2 / Tool 3)

Pricing control

Usage analytics (per user, per tool)

Bulk actions (suspend users, update plans)

CSV export of users

Role-based access (admin, user)

🏗️ Architecture Overview
AnimVox/
│
├── src/
│   ├── admin/                 # Admin Panel (React)
│   │   ├── AdminApp.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── UsersManagement.jsx
│   │   └── style.css
│   │
│   ├── api/
│   │   └── api.js              # Frontend API layer
│   │
│   ├── App.jsx                 # Main User App
│   └── main.jsx
│
├── main.py                     # Flask backend (shared)
├── main.db                     # SQLite database
├── requirements.txt
└── README.md

🛠️ Tech Stack
Frontend

React + Vite

CSS (custom admin styles)

Axios / Fetch API

Backend

Python (Flask)

SQLite

JWT Authentication

MoviePy / PIL / TTS libraries

Database

SQLite (easy migration to PostgreSQL / MySQL)

🗄️ Database Schema (Core Tables)
Users
users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  mobile TEXT,
  plan TEXT,
  role TEXT,
  suspend INTEGER,
  created_at TEXT
)

Plans (Per-Tool Limits)
plans (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE,
  tool1_videos INTEGER,
  tool2_videos INTEGER,
  tool3_videos INTEGER,
  price REAL
)

User Videos
user_videos (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  tool TEXT,
  video_id TEXT,
  file_path TEXT,
  created_at TEXT
)

📦 Installation
1️⃣ Clone Repository
git clone https://github.com/your-username/animvox.git
cd animvox

2️⃣ Backend Setup
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py


Backend runs on:

http://localhost:5000

3️⃣ Frontend Setup
npm install
npm run dev


Frontend runs on:

http://localhost:5173


Admin Panel is accessible based on user role.

🔐 Authentication & Roles

User

Can generate videos within plan limits

Admin

Full access to admin dashboard

User, plan, and usage management

JWT tokens are required for all protected endpoints.

📊 Subscription Plans (Per-Tool)

Each plan defines separate limits per tool, not a single “premium” bucket.

Example:

Plan Name	Tool 1	Tool 2	Tool 3	Price
Free	1	0	0	0
Premium	5	3	1	1200
Pro	20	10	5	3000
📈 Usage Tracking

Video usage stored per user per tool

Admin can view:

Total videos

Tool-wise breakdown

Limits enforced at generation time

🧪 Development Notes

Single Flask backend serves both apps

Admin panel lives in src/admin

Easy to extend with:

Stripe payments

Email verification

Cloud storage (S3)

Background jobs (Celery)

🔮 Roadmap

Payment gateway integration

Team / enterprise plans

API access for third-party tools

Cloud video rendering

Analytics dashboard

🤝 Contributing

Fork the repository

Create a feature branch

Commit changes with clear messages

Submit a pull request

📄 License

This project is proprietary.
All rights reserved.
