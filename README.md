# 🍐 pear2pear 🍐

## 📑 Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributors](#contributors)

## 📝 Description

A peer-to-peer help-seeking platform for students who need assistance with various challenges—ranging from new student onboarding to technical issues—connecting them with student volunteers ready to help out their troubled pears (peers).

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend & Infrastructure:** Firebase (Authentication, Firestore, Hosting)
- **Tooling:** Node.js (v18+), Firebase Admin SDK (`^14.5.0`)

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (or `yarn` / `pnpm` / `bun`)

### Installation & Local Development

```bash
# 1. Clone the repository
git clone [https://github.com/tofurinn/pear2pear.git](https://github.com/tofurinn/pear2pear.git)
cd pear2pear

# 2. Install frontend dependencies and start the dev server
cd frontend
npm install
npm run dev
```

*(Optional) To run database seeding scripts in `database/`, navigate to `/database` and run `npm install` to install `firebase-admin`.*

## 🚢 Deployment

### Firebase Hosting

```bash
firebase deploy
```

> ⚙️ CI/CD is configured via GitHub Actions (see `.github/workflows/`).

## 📁 Project Structure

```text
pear2pear/
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml          # Automated deployment on merge to main
│       └── firebase-hosting-pull-request.yml   # Preview channel deployment for PRs
│
├── database/
│   ├── firestore.indexes.json                  # Database composite indexes
│   ├── firestore.rules                         # Firestore security & access rules
│   ├── package.json                            # Database script dependencies (firebase-admin)
│   └── seed.js                                 # Database seeding script for mock data
│
├── frontend/
│   ├── public/                                 # Static assets served directly (favicons, SVGs)
│   ├── src/
│   │   ├── assets/                             # Images, logos, and profile placeholders
│   │   ├── components/                         # Reusable React UI components (Navbar, modals, pills, CSS)
│   │   ├── context/
│   │   │   └── authContext.tsx                 # Global authentication state & user session provider
│   │   ├── firebase/                           # Firebase initialization, config, and 2FA/OTP helpers
│   │   ├── hooks/                              # Custom React hooks (document titles, transient highlights)
│   │   ├── pages/                              # Routed page views
│   │   │   ├── index/                          # Landing / home page
│   │   │   ├── login/                          # Login, 2FA verification, and password recovery
│   │   │   ├── registration/                   # Multi-step student & volunteer onboarding
│   │   │   ├── student/                        # Student dashboards, requests, sessions, and feedback
│   │   │   └── volunteer/                      # Volunteer dashboards, session management, and settings
│   │   ├── services/                           # Firestore CRUD operations & notification services
│   │   ├── types/                              # Shared TypeScript interfaces and data models
│   │   ├── App.css                             # Root application styles
│   │   ├── App.tsx                             # Root application component
│   │   ├── global.css                          # Global CSS variables and base styling
│   │   ├── main.tsx                            # React DOM render entry point
│   │   └── routes.tsx                          # Client-side route definitions
│   ├── eslint.config.js                        # ESLint configuration rules
│   ├── index.html                              # HTML root template for Vite SPA
│   ├── package.json                            # Frontend metadata, scripts, and dependencies
│   ├── tsconfig.app.json                       # TypeScript rules for React app source
│   ├── tsconfig.json                           # Root TypeScript configuration
│   ├── tsconfig.node.json                      # TypeScript rules for Vite config
│   └── vite.config.ts                          # Vite bundler and dev server configuration
│
├── firebase.json                               # Firebase Hosting & Firestore deployment configs
└── README.md                                   # Project documentation and setup guide
```

## 👥 Contributors

<p align="left">
<a href="https://github.com/Chii2401344" title="Chii2401344"><img src="https://avatars.githubusercontent.com/u/196153671?v=4&s=64" width="64" height="64" alt="Chii2401344" style="border-radius:50%" /></a>
<a href="https://github.com/Natasha411" title="Natasha411"><img src="https://avatars.githubusercontent.com/u/199039877?v=4&s=64" width="64" height="64" alt="Natasha411" style="border-radius:50%" /></a>
<a href="https://github.com/tofurinn" title="tofurinn"><img src="https://avatars.githubusercontent.com/u/199913364?v=4&s=64" width="64" height="64" alt="tofurinn" style="border-radius:50%" /></a>
</p>
