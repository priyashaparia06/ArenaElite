# 🏆 Arena Elite

**Arena Elite** is a comprehensive Sports Tournament Management Platform built for college sports weeks, academy events, and local club competitions. It brings tournament creation, live scoring, team management, and public viewing together in a single system with role-based access for every stakeholder — from admins to spectators.

---

## 📌 Table of Contents

- [Features](#-features)
- [User Roles & Permissions](#-user-roles--permissions)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- Role-based dashboards for Admins, Organizers, Field Scorers, Team Captains, and the Public
- Tournament creation with configurable sports categories, venues, districts, and registration deadlines
- Automated fixture and knockout bracket generation
- Live, low-latency match scoring optimized for mobile use
- Real-time standings, leaderboards, and match status updates (Upcoming → Live → Completed)
- Team roster management and open registration workflows
- Match highlights (photos, videos, links) and announcement publishing
- Public portal with no login required — browse by sport, district, or tournament

---

## 👥 User Roles & Permissions

### 1. Admin
- System-wide dashboard and platform analytics
- Manage organizers (approve / reject / deactivate)
- CRUD operations for Sports Categories (Football, Cricket, Basketball, Badminton, etc.), Districts, and Venues
- Platform-wide data management

### 2. Organizer
- Create and manage tournaments (dates, sports category, venue, registration deadlines, rules)
- Approve or reject team registration requests
- Generate fixtures and knockout brackets
- Assign Field Scorers to specific matches
- Upload match highlights and publish announcements

### 3. Field Scorer
- Dedicated, low-latency, mobile-friendly scoring interface
- Update live match events, scores, and player stats (overs/sets/goals depending on sport)
- Finalize match status transitions (Upcoming → Live → Completed)

### 4. Team Captain
- Create and manage a team roster
- Browse open tournaments filtered by district/category
- Submit team registration requests
- View team schedules, assigned venues, live standings, and announcements

### 5. Audience (Public — No Login Required)
- Open public portal with sport and tournament filters
- View live scores in real time
- View fixtures, brackets, results, leaderboards/standings, and match highlights

---

## 🛠 Tech Stack

| Layer      | Technology     |
|------------|----------------|
| Frontend   | React.js       |
| Backend    | Node.js        |
| Database   | MongoDB        |

> Recommended additions (adjust as your implementation evolves): Express.js for the API layer, Socket.IO for real-time score updates, JWT for authentication, and Cloudinary/S3 for media storage.

---

## 🏗 Architecture Overview

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   React Client   │ <---> │  Node/Express API │ <---> │    MongoDB      │
│  (Role-based UI)  │       │  (REST + Sockets) │       │  (Data Storage) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        │                          │
        │                          ├── Auth & Role Middleware
        │                          ├── Tournament & Fixture Engine
        │                          ├── Live Scoring Service (WebSockets)
        │                          └── Media Upload Service
        │
        └── Public Portal (unauthenticated read-only views)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/arena-elite.git
cd arena-elite

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Running Locally

```bash
# Start the backend server
cd server
npm run dev

# Start the frontend (in a separate terminal)
cd client
npm start
```

The frontend will typically run on `http://localhost:3000` and the backend on `http://localhost:5000` (adjust based on your configuration).

---

## 🔐 Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
arena-elite/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── roles/          # Role-specific dashboards (admin, organizer, scorer, captain)
│   │   ├── services/       # API calls
│   │   └── App.js
│   └── package.json
│
├── server/                  # Node.js backend
│   ├── config/
│   ├── controllers/
│   ├── models/              # MongoDB schemas (User, Tournament, Team, Match, Venue, etc.)
│   ├── routes/
│   ├── middleware/          # Auth & role-based access control
│   ├── sockets/             # Real-time score update handlers
│   └── server.js
│
└── README.md
```

---

## 🔌 API Overview

| Resource        | Example Endpoints                                      |
|------------------|---------------------------------------------------------|
| Auth             | `POST /api/auth/register`, `POST /api/auth/login`       |
| Users/Organizers | `GET /api/admin/organizers`, `PATCH /api/admin/organizers/:id` |
| Tournaments      | `POST /api/tournaments`, `GET /api/tournaments/:id`      |
| Teams            | `POST /api/teams`, `PATCH /api/teams/:id/register`       |
| Fixtures         | `POST /api/tournaments/:id/fixtures`                     |
| Matches          | `PATCH /api/matches/:id/score`, `PATCH /api/matches/:id/status` |
| Public           | `GET /api/public/tournaments`, `GET /api/public/matches/live` |

> Full API documentation should be maintained separately (e.g., via Postman collection or Swagger/OpenAPI spec) as endpoints are implemented.

---

## 🗺 Roadmap

- [ ] Core authentication & role-based access control
- [ ] Admin dashboard (organizers, categories, districts, venues)
- [ ] Tournament creation & registration workflow
- [ ] Fixture & knockout bracket generator
- [ ] Live scoring interface for Field Scorers
- [ ] Real-time public portal (live scores, standings)
- [ ] Media uploads & announcements
- [ ] Notifications (email/push) for schedule and result updates

---

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss proposed changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
