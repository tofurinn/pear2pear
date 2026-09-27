## 📁 Project Directory Structure

```text
pear2pear/
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml          # Automated deployment on merge to main
│       └── firebase-hosting-pull-request.yml   # Preview channel deployment for PRs
│
├── database/
│   ├── firestore.rules                         # Firestore security & access rules
│   ├── firestore.indexes.json                  # Database composite indexes
│   └── seed.js                                 # Database seeding script for mock data
│
├── frontend/
│   ├── public/                                 # Static public assets (favicons, icons)
│   ├── src/
│   │   ├── assets/                             # Images, SVGs, and global styles
│   │   ├── components/                         # Reusable UI elements (Buttons, Modals, Navbar)
│   │   ├── context/                            # React Context providers (AuthContext, etc.)
│   │   ├── firebase/                           # Firebase integration modules
│   │   │   ├── config.ts                       # App initialization & SDK exports (auth, db)
│   │   │   ├── auth.ts                         # Authentication helper functions
│   │   │   └── errors.ts                       # Firebase error code mappers
│   │   ├── hooks/                              # Custom React hooks (useAuth, useFirestore)
│   │   ├── pages/                              # Page views / routed screens
│   │   ├── types/                              # Shared TypeScript interfaces & types
│   │   ├── App.tsx                             # Root React component & route definitions
│   │   ├── main.tsx                            # React entry point
│   │
│   ├── .env                                    # Environment variables for /src/firebase/config.ts
│   ├── index.html                              # Single-page application entry template
│   ├── package.json                            # Frontend dependencies and scripts
│   ├── tsconfig.json                           # TypeScript compiler configuration
│   └── vite.config.ts                          # Vite build & bundler configuration
│
├── backend/                                    # Server-side services / Cloud Functions 
│   └── ...
│
├── .firebaserc                                 # Firebase active project mappings
├── .gitignore                                  # Git exclusion file 
├── firebase.json                               # Firebase Hosting & Firestore deployment configs
└── README.md                                   # Project documentation and setup guide