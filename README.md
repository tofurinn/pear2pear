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
│   ├── dist/                                   # Production build output (generated via 'npm run build', ignored by Git)
│   ├── node_modules/                           # Installed third-party npm packages (ignored by Git)
│   ├── public/                                 # Static assets served directly (favicons, manifest, etc.)
│   ├── src/
│   │   ├── assets/                             # Images, SVGs, and asset files
│   │   ├── components/                         # Reusable React UI components (Navbar, buttons, modals)
│   │   ├── context/                            # React Context state management (AuthContext, ThemeContext) - DELETE ???
│   │   ├── firebase/                           # Firebase configuration and utility wrappers
│   │   │   ├── config.ts                       # Firebase app initialization & service instances (auth, db)
│   │   │   ├── auth.ts                         # Auth helper functions (login, register, logout)
│   │   │   └── errors.ts                       # Mapping Firebase error codes to friendly UI messages
│   │   ├── hooks/                              # Custom React hooks (useAuth, useFirestore, etc.) - DELETE ???
│   │   ├── pages/                              # Routed view components (Home, Login, Dashboard)
│   │   ├── types/                              # Shared TypeScript interfaces and data models
│   │   ├── App.css                             # App component styles
│   │   ├── App.tsx                             # Root application component & client routing
│   │   ├── index.css                           # Global application styling
│   │   └── main.tsx                            # React DOM render entry point
│   ├── .env                                    # Local environment variables & Firebase API keys (git-ignored)
│   ├── .gitignore                              # Git exclusion rules for frontend directory
│   ├── eslint.config.js                        # ESLint configuration rules
│   ├── index.html                              # HTML root template for Vite single-page app
│   ├── package.json                            # Project metadata, scripts, and dependencies list
│   ├── package-lock.json                       # Exact dependency tree lockfile
│   ├── README.md                               # Frontend documentation and run instructions
│   ├── tsconfig.json                           # Root TypeScript configuration
│   ├── tsconfig.app.json                       # TypeScript compilation rules for React app source
│   ├── tsconfig.node.json                      # TypeScript compilation rules for Vite configuration
│   └── vite.config.ts                          # Vite bundler plugins and server options
│
├── backend/                                    # Unused
│   └── ...
│
├── .firebaserc                                 # Firebase active project mappings
├── .gitignore                                  # Git exclusion file 
├── firebase.json                               # Firebase Hosting & Firestore deployment configs
└── README.md                                   # Project documentation and setup guide
