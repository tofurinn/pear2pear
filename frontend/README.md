# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Shared components

Reusable UI components and shared styles are located in `src/components`:

```text
src/components/
├── category-tag/
│   ├── category-tag.tsx
│   └── category-tag.css
├── navbar/
│   ├── global-navbar.tsx
│   ├── main-navbar.tsx
│   └── navbar.css
├── page-css/
│   ├── dashboard.css
│   ├── details.css
│   ├── forms-ui.css
│   └── subdashboards.css
├── icons.tsx
├── step-progress.tsx
└── step-progress.css
```

- **Category tag** (`category-tag/`) — `CategoryTag` renders a static category label. Its optional `className` prop allows page-specific sizing alongside the shared style.
- **Navigation** (`navbar/`) — `MainNavbar` provides app navigation with React Router links and an optional `dashboardPath`. `GlobalNavbar` provides a sign-up/login variant. Both use `navbar.css`.
- **Icons** (`icons.tsx`) — Shared SVG icons for checks, chevrons, calendar, clock, swap, pin, and stars. `StarRating` renders a read-only rating with half-star support.
- **Step progress** (`step-progress.tsx`) — Accessible progress bar for multi-step forms. It takes the current step, total steps, an accessible label, and either a `green` or `blue` tone.
- **Shared page styles** (`page-css/`) — `dashboard.css` styles dashboard pages; `details.css` styles detail modals; `forms-ui.css` contains shared form controls and layout; `subdashboards.css` styles request, session, and support-history lists/cards.

Import shared styles from their current `components/page-css/` location. Keep page-specific CSS alongside its page.
