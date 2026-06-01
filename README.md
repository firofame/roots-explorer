# Quranic Roots Explorer - LLM & Developer Guide

Welcome to the **Quranic Roots Explorer** codebase manual. This README is written in detail to provide LLM agents and human developers with immediate, accurate context on the project's architecture, data models, state flows, and style systems.

---

## 1. Project Overview & Architecture

**Quranic Roots Explorer** is an interactive, client-side single-page application (SPA) designed to help users explore Quranic vocabulary, track their root-learning progress, analyze occurrences of triliteral/quadriliteral Arabic roots, and map them back to daily prayers (Salah) and short Surahs.

### Key Technology Stack
- **Framework**: React 19 (Functional Components, Hooks, Context-free Local State)
- **Language**: TypeScript 6+ (Strict Type-Checking)
- **Bundler & Build Tool**: Vite 8+
- **Styling**: Vanilla CSS (CSS Custom Properties / Variables for Dark Theme and Responsive Layouts)
- **Data Hydration**: Fetch API loading static `.json` files from the `/public` directory.

---

## 2. Directory Structure

Below is the directory tree and the purpose of each file:

```text
roots-explorer/
├── package.json               # Package manifests, script commands, and dependencies
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript compilation setup
├── eslint.config.js           # ESLint v10 config using typescript-eslint
├── index.html                 # Entry point HTML template
├── public/                    # Static assets loaded at runtime
│   ├── quran-roots.json       # Vocabulary database containing roots, frequencies, and lemmas (1.3 MB)
│   ├── salah-data.json        # Liturgical texts containing surah/prayer word-by-word data
│   ├── favicon.svg            # Site favicon
│   └── icons.svg              # SVG spritesheet for UI icons
└── src/                       # Application source code
    ├── main.tsx               # App mounting script
    ├── App.tsx                # Shell wrapper with header, background, and footer
    ├── App.css                # Shell styles & background animations
    ├── index.css              # CSS variables, global layout tokens, custom scrollbars
    ├── RootsExplorer.tsx      # Main application state machine and page layouts
    └── RootsExplorer.css      # Component-specific rules, grid sheets, and responsive views
```

---

## 3. Data Schemas & TypeScript Models

The application relies on two JSON files located in the `public/` directory.

### A. Quranic Roots Database (`public/quran-roots.json`)
This file contains the complete morphological statistics of the Quranic text, listing roots sorted by frequency.

#### TypeScript Type Definitions
```typescript
interface Lemma {
  lemma: string;        // Transliterated Buckwalter or similar Romanized form of the word lemma
  lemmaArabic: string;  // Normal Arabic text representation of the lemma
  count: number;        // Total occurrences of this lemma in the Quran
}

interface SampleVerse {
  surah: number;        // 1-indexed Surah number (e.g., 1 for Al-Fatihah, 2 for Al-Baqarah)
  ayah: number;         // 1-indexed Ayah number
}

interface RootData {
  rank: number;                  // Frequency rank (1 = most common root: "Alh" / "ا ل ه")
  root: string;                  // Transliterated representation (e.g., "Alh")
  rootArabic: string;            // Space-separated Arabic root letters (e.g., "ا ل ه")
  occurrences: number;           // Total count of words derived from this root
  meaning: string;               // English meaning/translation of the root
  lemmas: Lemma[];               // Array of specific lemmas derived from this root
  surahCount: number;            // Number of unique Surahs containing this root
  salahFound: string[];          // List of Salah/prayer section names where this root appears
  cumulativeCoverage: number;    // Cumulative percentage coverage of the Quranic vocabulary up to this rank
  sampleVerses?: SampleVerse[];  // Reference list of surah/ayah coordinates where root is used
}

interface RootsDatabase {
  totalWords: number;            // Total words in the Quran (e.g., 77429)
  totalSegments: number;          // Total morphological segments in the Quran (e.g., 128219)
  segmentsWithRoot: number;      // Count of segments mapped to a root (e.g., 49968)
  roots: RootData[];             // Array of all roots
}
```

---

### B. Salah Data Database (`public/salah-data.json`)
This file structures the text of daily prayers and common Surahs down to the word level. It matches individual word segments to their root letters.

#### TypeScript Type Definitions
```typescript
interface SalahWord {
  wordIndex?: number;            // 1-indexed word position in the Ayah
  text: string;                  // Full Arabic word with diacritics (e.g., "ٱلرَّحْمَٰنِ")
  root: string | null;           // Transliterated root key matching `RootData.root` (e.g., "rHm") or null
  rootArabic: string | null;     // Arabic letters of the root matching `RootData.rootArabic` (e.g., "ر ح م") or null
  lemma?: string | null;         // Singular base form of the word (e.g., "رَّحْمَٰن") or null
  meaning?: string;              // English translation/meaning of the word (e.g., "the Most Gracious")
}

interface SalahVerse {
  ayah: number;                  // 1-indexed Ayah number in the Surah/section
  words: SalahWord[];            // Array of word objects in their reading order
}

interface SalahSurah {
  id: number | string;           // Numeric surah index (e.g., 112) or string ID for non-surah liturgical parts (e.g., "tashahhud")
  name: string;                  // Name of the Surah or Prayer section (e.g., "Al-Fatihah" or "Tashahhud")
  verses: SalahVerse[];          // Ayahs/Lines containing the words
}
```

---

## 4. Application State & Logical Flow

The core application logic is enclosed in [RootsExplorer.tsx](file:///src/RootsExplorer.tsx). It uses a local state architecture with side effects mapped to standard web storage.

### A. LocalStorage Synchronization
The application tracks the user's learning progress using browser LocalStorage.
1. **`learnedRoots`**: Saved as a JSON-serialized array of transliterated root strings.
   - LocalStorage key: `"learnedRoots"`
   - Loaded on component initialization into a React state `Set<string>`.
2. **`rootsDayOrigin`**: Seed date used to calculate the "Root of the Day".
   - LocalStorage key: `"rootsDayOrigin"`
   - Value format: `YYYY-MM-DD` (e.g., `"2026-06-01"`)

---

### B. Core Mathematical and Algorithmic Operations

#### 1. Arabic Text Normalization (`cleanArabic`)
To support fuzzy search inputs (which may contain variable diacritics/Harakat, special characters, or alternate spellings of Alif), the app normalizes strings with:
```typescript
const cleanArabic = (str: string) => {
  return str
    .replace(/[\u064B-\u065F]/g, "") // Strip diacritics / vowels (Fathah, Kasrah, Dammah, Shaddah, etc.)
    .replace(/[أإآ]/g, "ا")          // Standardize Alef letters to bare Alef (ا)
    .replace(/\s+/g, "")             // Remove all whitespace
    .toLowerCase();
};
```

#### 2. Quranic Vocabulary Coverage Calculation
The total percentage of Quranic vocabulary the user has learned is calculated programmatically using the `db.segmentsWithRoot` denominator and the sum of occurrences of all learned roots:
$$\text{Coverage (\%)} = \left( \frac{\sum_{r \in \text{learnedRoots}} \text{occurrences}(r)}{\text{db.segmentsWithRoot}} \right) \times 100$$
This is rounded to one decimal place inside a `useMemo` block.

#### 3. Root of the Day Selection
To ensure a consistent daily root without a server backend, the index is computed by taking the elapsed days since the `rootsDayOrigin` calendar day and applying a modulo operation over the total root array length:
$$\text{elapsedDays} = \lfloor \frac{\text{TodayDate} - \text{OriginDate}}{1 \text{ day (86400000 ms)}} \rfloor$$
$$\text{DayRoot} = \text{db.roots}[\text{elapsedDays} \pmod{\text{db.roots.length}}]$$

#### 4. Sibling/Related Roots Extraction
For any selected root, related roots are dynamically calculated. The algorithm splits the lowercase letters of the transliterated root and counts how many characters intersect with other roots in the database. If there are $\ge 2$ letters in common, the root is classified as a sibling root.

#### 5. Salah Section Coverage Calculation
Each Salah section calculates its vocabulary coverage using:
$$\text{Salah Coverage (\%)} = \left( \frac{W_{\text{no\_root}} + W_{\text{learned\_root}}}{W_{\text{total}}} \right) \times 100$$
- $W_{\text{no\_root}}$: Words in the section that contain no root (e.g., prepositions like "عَلَى" which have `root: null`).
- $W_{\text{learned\_root}}$: Words in the section whose root matches a key in `learnedRoots`.
- $W_{\text{total}}$: The total number of words in the section.

---

### C. Tab Navigation & View States
The layout changes based on the value of the `activeTab` string state:
1. **`dashboard`**: Displays overall statistical coverage rings, the "Root of the Day" console, and interactive progress widgets showing Salah coverage lists.
2. **`explorer`**: A searchable list of all roots. Clicking a root opens a detailed pane showing its dictionary entry, derived lemmas (with counts), sample verses, and sibling roots.
3. **`frequency`**: A list filter tool optimized for rote memorization. Allows developers/users to group roots by frequency ranges (Top 50, Top 100, Top 500, Juz 'Amma, or those occurring in Salah) and sort them alphabetically, by rank, or by learning state.
4. **`salah`**: An interactive text explorer. Words are rendered in an Arabic font stack. Clicking a word opens a drawer displaying translation, root data, and a quick-navigation link to jump to the Root Explorer.

---

## 5. CSS Styling System

Styles are structured using CSS Variables in [index.css](file:///src/index.css) to build a modern, high-contrast dark palette with responsive layouts:

| Variable Name | Default Value | Usage |
| :--- | :--- | :--- |
| `--bg-dark` | `#0a0b12` | Main tab panel, cards, and modal background |
| `--bg-darker` | `#050508` | Main site backdrop / body background |
| `--gold-soft` | `#d4af37` | Primary accent, progress rings, and borders |
| `--gold-highlight` | `#fbf5de` | Focus text, header overlays |
| `--glass-bg` | `rgba(26, 28, 41, 0.6)` | Blended interactive control elements |
| `--glass-border` | `rgba(212, 175, 55, 0.2)` | Border separators |
| `--text-main` | `#ffffff` | Primary text content |
| `--text-muted` | `#a0a5b1` | Subtitles, labels, secondary metadata |

- **Layout Structure**: Flexbox and CSS Grid are used.
- **Arabic Typography**: The Arabic text elements use a specific CSS font stack designed for readability of vocalized Quranic scripts: `"Scheherazade New", "Amiri", "Noto Naskh Arabic", "Courier New", serif`.

---

## 6. Guidelines for Extending the Codebase

When writing code or modifications for this project, keep the following guidelines in mind:

### Adding New Liturgical / Salah Sections
- Core sections (like Tashahhud) are parsed dynamically from `salah-data.json`.
- Supplemental or static segments can be injected directly into the `EXTRA_SALAH_SECTIONS` array within `src/RootsExplorer.tsx` matching the `SalahSurah` layout.
- Order of display is controlled by the sequence of `pushSection()` calls in the initial loading `useEffect` hook.

### Enhancing Searching / Filtering
- If expanding the search engine, modify `explorerFilteredRoots` and `cleanArabic` in [RootsExplorer.tsx](file:///src/RootsExplorer.tsx). Make sure any new searchable text property is cleaned through `cleanArabic()` if it contains Arabic characters.

### Type Boundaries
- Ensure all static databases respect the TypeScript `interface` structures defined at the top of `src/RootsExplorer.tsx`. If changes are made to the schemas in `public/*.json`, update the interfaces accordingly to avoid build compilation errors.

---

## 7. Setup & Execution Commands

### 1. Install Project Dependencies
```bash
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```

### 3. Compile and Build for Production
```bash
npm run build
```

### 4. Run Linter
```bash
npm run lint
```
