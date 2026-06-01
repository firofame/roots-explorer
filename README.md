# Quranic Roots Explorer

An interactive standalone application for exploring Quranic vocabulary roots, their occurrence frequencies, and meanings. It includes a built-in Salah text explorer to search and learn triliteral roots of words used in daily prayers.

## Features

- **Progress & Coverage Tracker**: View the percentage of Quranic vocabulary covered by the roots you have learned.
- **Root of the Day**: Discover and focus on a single root each day to build vocabulary incrementally.
- **Salah Text Explorer**: Browse surahs commonly recited in prayers (Al-Fatihah, Al-Ikhlas, etc.) and tap individual words to reveal their triliteral roots and meanings.
- **Dark Space Theme**: A clean, premium dark theme with responsive layout.

## Tech Stack

- **Framework**: [React](https://react.dev/) (v19)
- **Bundler**: [Vite](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styles**: Vanilla CSS

## Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

## Data Sources
- The root statistics are loaded from `public/quran-roots.json`.
- The Salah prayer texts are loaded from `public/salah-data.json`.
