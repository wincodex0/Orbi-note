# Technical Design Document — Orbinote (Cosmic Notes)

## Overview

Orbinote is a mobile note-taking app (iOS + Android) built with React Native + Expo. Notes are visualized as an interactive 3D galaxy: a **Universe** contains **Solar Systems** (topics/projects), each Solar System has a central **Sun** (main topic) orbited by up to 25 **Planets** (sub-notes). The rendering layer uses a "3D-styled 2D" pseudo-3D approach via expo-three / @react-three/fiber for performance, with an automatic Lottie/SVG fallback for low-end devices and a Simple/List View for accessibility. Notes are stored offline-first in SQLite. AI-powered semantic search (free-tier hosted API + local cosine-similarity) supplements keyword search. Users can apply per-node visual themes and per-note free color customization that applies to the note card layer without overriding the galaxy visuals.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     React Native + Expo Shell                     │
│                                                                    │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ NavigationCtrl  │  │ GlobalStore  │  │ AccessibilityCtrl   │  │
│  │ (React Nav v6)  │  │  (Zustand)   │  │ (AccessibilityInfo) │  │
│  └────────┬────────┘  └──────┬───────┘  └──────────┬──────────┘  │
│           │                  │                       │             │
│  ┌────────▼──────────────────▼───────────────────────▼──────────┐ │
│  │                        Screen Layer                            │ │
│  │  UniverseScreen | SolarSystemScreen | PlanetModal             │ │
│  │  SunModal | SearchModal | SettingsScreen | OnboardingFlow     │ │
│  └────────┬──────────────────────────┬──────────────────────────┘ │
│           │                          │                             │
│  ┌────────▼────────┐   ┌─────────────▼──────────┐                 │
│  │  RenderEngine   │   │  AnimationController    │                 │
│  │  (R3F/Lottie)   │   │  (Reanimated 3)         │                 │
│  └────────┬────────┘   └────────────────────────┘                 │
│           │                                                         │
│  ┌────────▼──────────────────────────────────────────────────────┐ │
│  │                       Service Layer                             │ │
│  │  ThemeManager | AISearchService | EmbeddingService             │ │
│  │  KeywordSearchService | GPUBenchmarkService                    │ │
│  └────────┬──────────────────────────────────────────────────────┘ │
│           │                                                         │
│  ┌────────▼──────────────────────────────────────────────────────┐ │
│  │               StorageEngine — SQLite (expo-sqlite)              │ │
│  │   Repositories: Universe | SolarSystem | Sun | Planet           │ │
│  │                 Theme    | Embedding   | Settings               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │ (optional, async)
              ┌───────────────▼────────────────────────┐
              │  Hosted AI API                          │
              │  (Gemini / Groq / HuggingFace /         │
              │   OpenRouter — free tier)               │
              └────────────────────────────────────────┘
```

**Data flow:** User action → Screen dispatches to GlobalStore → Repository writes to SQLite → Store state updates → React re-renders → RenderEngine reads updated state → AnimationController drives transitions.

### Subsystem Responsibilities

| Subsystem | Responsibility |
|---|---|
| NavigationController | React Navigation v6 stack; deep linking; back/swipe handling |
| GlobalStore (Zustand) | All shared app state; slices per entity + settings + search + animation |
| AccessibilityController | Reads OS `reduceMotion` at launch + change listener; feeds `animationSlice` |
| RenderEngine | expo-three / R3F canvas; GPU benchmark; LOD; Lottie/SVG fallback |
| AnimationController | All transitions via Reanimated 3; spring configs; Reduced_Motion overrides |
| ThemeManager | Theme resolution (node → parent → default); live ThemeContext switching |
| AISearchService | Orchestrates embedding generation + cosine search + hosted API explanation |
| EmbeddingService | Calls hosted API or ONNX fallback; serializes Float32Array ↔ BLOB |
| KeywordSearchService | SQLite full-text search across name/subject/description/tags |
| GPUBenchmarkService | Launch-time 1-frame render test; sets renderer mode flag |
| StorageEngine | expo-sqlite wrapper; transactions; migrations via schema_version |

### Rendering Decision Tree (launch)

```
App launch
  └─► GPUBenchmarkService.run()
        ├─► fps ≥ 30 AND OpenGL ES ≥ 3.0
        │     └─► RenderMode = R3F (primary path)
        │           └─► Bloom post-processing via @react-three/postprocessing
        ├─► fps < 30 OR OpenGL ES < 3.0
        │     └─► RenderMode = LOTTIE (fallback)
        └─► Lottie init fails
              └─► Force SimpleView = true
```

---

## Components and Interfaces

### Screen Components

#### UniverseScreen
- **Child components:** `GalaxyCanvas`, `SolarSystemOrb` (×n), `EmptyState`, `SearchFAB`, `SettingsButton`, `ResumeBanner`, `ErrorBanner`
- **Local state:** none
- **Store reads:** `universeSlice.universes`, `animationSlice.reducedMotion`, `settingsSlice.simpleViewEnabled`
- **Navigation out:** tap SolarSystemOrb → SolarSystemScreen (500–700ms zoom); tap Settings → SettingsScreen; tap SearchFAB → SearchModal

#### SolarSystemScreen
- **Child components:** `GalaxyCanvas`, `SunOrb`, `PlanetOrb` (×n), `OrbitRing` (×n), `ParticleField`, `AddPlanetButton`, `LODController`
- **Local state:** none
- **Store reads:** `solarSystemSlice.activeSolarSystemId`, `planetSlice.planets[ssId]`, `sunSlice.suns[ssId]`
- **Navigation out:** back gesture → UniverseScreen; tap Sun → SunModal; tap Planet → PlanetModal

#### PlanetModal
- **Child components:** `NoteEditor`, `RichTextToolbar`, `TagInput`, `ColorPickerModal`, `ThemePickerModal`, `AutoSaveIndicator`
- **Local state:** `draftName`, `draftSubject`, `draftDescription`, `isColorPickerOpen`, `isThemePickerOpen`
- **Store reads:** `planetSlice.activePlanetId`, resolved Theme via `useTheme()`
- **Navigation out:** dismiss → SolarSystemScreen (orbit return 400ms)

#### SunModal
- **Child components:** `NoteEditor`, `RichTextToolbar`, `ColorPickerModal`, `AutoSaveIndicator`
- **Local state:** `draftTitle`, `draftDescription`, `isColorPickerOpen`
- **Store reads:** `sunSlice.suns[solarSystemId]`
- **Navigation out:** close panel → SolarSystemScreen

#### SearchModal
- **Child components:** `RadarAnimation`, `SearchInput`, `SearchResultCard` (×n), `AIUnavailableBadge`, `ConfidenceBar`
- **Local state:** `inputText`
- **Store reads:** `searchSlice`, `settingsSlice.aiSearchEnabled`, `settingsSlice.quotaExceeded`
- **Navigation out:** tap result → fly-to SolarSystemScreen (800–1200ms); dismiss → previous screen

#### SettingsScreen
- **Child components:** `ThemeManagerSection`, `ThemePreviewCard` (×n), `SimpleViewToggle`, `AISearchToggle`
- **Local state:** none
- **Store reads:** `settingsSlice`, `themeSlice`

#### OnboardingFlow
- **Child components:** `OnboardingStep` (×3), `HierarchyDiagram`, `CreateUniversePrompt`, `CreateSolarSystemPrompt`, `SkipButton`, `ResumeBanner`
- **Local state:** `currentStep`, `partialUniverse`, `partialSolarSystem`

### Key Shared Components

#### ColorPickerModal
```ts
interface ColorPickerModalProps {
  currentColor: string | null;       // current noteColor value
  onConfirm: (hex: string) => void;  // called when user confirms
  onReset: () => void;               // clears noteColor → null
  onCancel: () => void;
}
```
- Renders: HSV color wheel (`reanimated-color-picker`), hex `TextInput` with `#RRGGBB` validation regex `/^#[0-9A-Fa-f]{6}$/`
- Live preview card updates background in real-time via local state
- Auto-computes contrasting text color via `colorUtils.getContrastTextColor(hex)`
- Shows `ContrastWarningBadge` if luminance contrast ratio < 4.5:1

#### OrbitEngine (hook: `useOrbitEngine`)
```ts
interface OrbitConfig {
  planets: Planet[];           // ordered by orbitIndex
  animFrame: number;           // current animation frame tick
}
// Returns: { x, y, scale }[] — 2D positions with perspective scale
```
- Distributes planets across 3 radius bands: indices 0–7 → r=120, 8–15 → r=200, 16–24 → r=300
- Angle: `(orbitIndex / totalPlanets) * 2π + animFrame * speed`
- Perspective scale: `0.6 + (y / maxY) * 0.4` to simulate depth

#### AnimationController (hook: `useAnimationController`)
```ts
type TransitionType =
  | 'cameraZoom'      // 500–700ms, easeInOut
  | 'cameraZoomRev'   // 500–700ms, easeInOut
  | 'planetDetach'    // 200ms, easeInOut
  | 'panelSlideUp'    // 400ms total, easeInOut
  | 'cameraFlyTo'     // 800–1200ms, easeInOut, skippable
  | 'orbitReturn'     // 400ms, easeInOut
  | 'crossFade';      // 200ms opacity (Reduced_Motion substitute)

interface AnimationController {
  play: (type: TransitionType, config?: Partial<SpringConfig>) => void;
  skip: () => void;   // cancels in-progress flyTo
  isRunning: boolean;
}
```
- Spring config for HUD overshoot: `{ mass: 1, stiffness: 180, damping: 12 }` → overshoot ≈ 1.08×
- Animation queue: `useRef<TransitionType[]>` prevents overlapping transitions
- Reduced_Motion: when `animationSlice.reducedMotion === true`, all non-fade transitions replaced with `withTiming(opacity, { duration: 200 })`

### Service Interfaces

```ts
// EmbeddingService
interface EmbeddingService {
  generate(text: string): Promise<Float32Array>;
  // Primary: Gemini text-embedding-004 → float32[768]
  // Fallback: MiniLM-L6-v2 ONNX → float32[384]
}

// AISearchService
interface AISearchService {
  semanticSearch(query: string, universeId: string): Promise<SearchResult[]>;
  generateExplanation(query: string, results: SearchResult[]): Promise<string | null>;
}

// KeywordSearchService
interface KeywordSearchService {
  search(query: string, universeId: string): Promise<SearchResult[]>;
}

// ThemeManager
interface ThemeManager {
  resolveTheme(node: Universe | SolarSystem | Sun | Planet): Theme;
  resolveNoteColor(node: Sun | Planet): string | null;
  // noteColor applies ONLY to card layer: background + body text + subject label
  // galaxy orb/glow/particles always use resolved Theme
}

interface SearchResult {
  type: 'planet' | 'sun';
  id: string;
  solarSystemId: string;
  universeId: string;
  name: string;
  subject?: string;
  snippet: string;       // matched excerpt
  score?: number;        // cosine similarity (0–1), undefined for keyword
  matchType: 'keyword' | 'semantic';
}
```

---

## Data Models

### SQLite Schema

```sql
PRAGMA journal_mode=WAL;  -- crash-safe write-ahead logging

CREATE TABLE IF NOT EXISTS universes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  theme_id   TEXT NOT NULL DEFAULT 'stark-hologram',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS solar_systems (
  id           TEXT PRIMARY KEY,
  universe_id  TEXT NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  image_url    TEXT,
  theme_id     TEXT NOT NULL DEFAULT 'stark-hologram',
  note_color   TEXT CHECK(note_color IS NULL OR
                 (length(note_color) = 7 AND note_color LIKE '#%'))
);

CREATE TABLE IF NOT EXISTS suns (
  id              TEXT PRIMARY KEY,
  solar_system_id TEXT NOT NULL UNIQUE REFERENCES solar_systems(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT '' CHECK(length(title) <= 200),
  description     TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 10000),
  theme_id        TEXT NOT NULL DEFAULT 'stark-hologram',
  note_color      TEXT CHECK(note_color IS NULL OR
                    (length(note_color) = 7 AND note_color LIKE '#%'))
);

CREATE TABLE IF NOT EXISTS planets (
  id              TEXT PRIMARY KEY,
  solar_system_id TEXT NOT NULL REFERENCES solar_systems(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  subject         TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 10000),
  theme_id        TEXT NOT NULL DEFAULT 'stark-hologram',
  tags            TEXT NOT NULL DEFAULT '[]',   -- JSON array, max 20 items × 50 chars
  orbit_index     INTEGER NOT NULL DEFAULT 0,
  note_color      TEXT CHECK(note_color IS NULL OR
                    (length(note_color) = 7 AND note_color LIKE '#%'))
);

CREATE TABLE IF NOT EXISTS themes (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  colors         TEXT NOT NULL,   -- JSON: {background, glow, sunAccent, uiChrome}
  glow           TEXT NOT NULL,
  texture        TEXT,
  particle_style TEXT NOT NULL,   -- JSON particle config
  sound          TEXT
);

CREATE TABLE IF NOT EXISTS embeddings (
  id          TEXT PRIMARY KEY,
  planet_id   TEXT NOT NULL UNIQUE REFERENCES planets(id) ON DELETE CASCADE,
  vector      BLOB NOT NULL,      -- Uint8Array(Float32Array.buffer)
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
  -- Keys: schema_version, simpleViewEnabled, aiSearchEnabled,
  --       onboardingComplete, quotaExceeded, defaultThemeId
);

CREATE INDEX IF NOT EXISTS idx_ss_universe    ON solar_systems(universe_id);
CREATE INDEX IF NOT EXISTS idx_sun_ss         ON suns(solar_system_id);
CREATE INDEX IF NOT EXISTS idx_planet_ss      ON planets(solar_system_id);
CREATE INDEX IF NOT EXISTS idx_embedding_pid  ON embeddings(planet_id);
```

### TypeScript Entity Interfaces

```ts
// src/types/entities.ts

export interface Universe {
  id: string;
  name: string;
  themeId: string;
  createdAt: number;
}

export interface SolarSystem {
  id: string;
  universeId: string;
  name: string;
  imageUrl: string | null;
  themeId: string;
  noteColor: string | null;   // #RRGGBB — applies to thumbnail border + name label
}

export interface Sun {
  id: string;
  solarSystemId: string;
  title: string;
  description: string;
  themeId: string;
  noteColor: string | null;   // #RRGGBB — applies to Sun edit panel card layer only
}

export interface Planet {
  id: string;
  solarSystemId: string;
  name: string;
  subject: string;
  description: string;
  themeId: string;
  tags: string[];             // max 20, each max 50 chars
  orbitIndex: number;
  noteColor: string | null;   // #RRGGBB — applies to Planet_View card layer only
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    glow: string;
    sunAccent: string;
    uiChrome: string;
  };
  glow: string;
  texture: string | null;
  particleStyle: {
    count: number;
    speed: number;
    size: number;
    color: string;
  };
  sound: string | null;
}

export interface Embedding {
  id: string;
  planetId: string;
  vector: Float32Array;
  updatedAt: number;
}

export interface SearchResult {
  type: 'planet' | 'sun';
  id: string;
  solarSystemId: string;
  universeId: string;
  name: string;
  subject?: string;
  snippet: string;
  score?: number;
  matchType: 'keyword' | 'semantic';
}
```

### Theme Resolution Order

```
Rendering a node's card/content layer:
  1. node.noteColor          → card background + text (card layer ONLY)
  2. node.themeId            → all visual properties
  3. parent.themeId          → inherited if node has no themeId
  4. grandparent.themeId     → inherited up the hierarchy
  5. 'stark-hologram'        → built-in default

Galaxy orb / glow / particles:
  → ALWAYS governed by steps 2–5. noteColor never affects these.
```

### Built-in Theme Presets

| Theme | Background | Glow | Sun Accent | UI Chrome |
|---|---|---|---|---|
| Stark Hologram | `#05060F` | `#4FD8FF` | `#FF9A3C` | `#8A6CFF` |
| Cyberpunk | `#0D0221` | `#FF2079` | `#FFE600` | `#00FFCC` |
| Pastel Galaxy | `#1A1035` | `#C9B8FF` | `#FFB3C6` | `#B8E0FF` |
| Minion | `#1C1C00` | `#FFE135` | `#FFD700` | `#6C6C00` |

### Migration Strategy

```ts
// src/db/database.ts
const MIGRATIONS: Record<number, (db: SQLiteDatabase) => Promise<void>> = {
  1: createInitialSchema,    // all tables above + seed 4 themes
  2: addNoteColorColumns,    // example: adds note_color if upgrading from pre-R19
};

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const current = parseInt(await getSetting(db, 'schema_version') ?? '0');
  for (const version of Object.keys(MIGRATIONS).map(Number).sort()) {
    if (version > current) {
      await MIGRATIONS[version](db);
      await setSetting(db, 'schema_version', String(version));
    }
  }
}
```

---

## Correctness Properties

These properties are encoded as property-based tests (PBT) using `fast-check` and run in the CI pipeline.

### Property 1: Embedding Round-Trip Integrity

**Validates: Requirements 11.1, 11.2, 11.3**
```
∀ planet with non-null, non-empty description:
  let v1 = EmbeddingService.generate(planet.name + planet.subject + planet.description)
  EmbeddingRepository.upsert(planet.id, v1)
  let v2 = EmbeddingRepository.get(planet.id)
  cosineSimilarity(v1, v2) > 0.9999
```

### Property 2: orbitIndex Contiguity After Delete

**Validates: Requirements 4.4**
```
∀ solar system S with planets P (|P| > 0):
  let deleted = random element of P
  PlanetRepository.delete(deleted.id)
  let remaining = PlanetRepository.findBySolarSystem(S.id)
  sorted(remaining.map(p => p.orbitIndex)) === [0, 1, ..., remaining.length - 1]
```

### Property 3: Theme Resolution Fallback

**Validates: Requirements 6.6, 6.8**
```
∀ node with themeId referencing a non-existent theme:
  ThemeManager.resolveTheme(node).id === 'stark-hologram'
```

### Property 4: noteColor Scope Isolation

**Validates: Requirements 19.7**
```
∀ planet with non-null noteColor:
  let galaxyColor = RenderEngine.getOrbColor(planet.id)
  let resolvedTheme = ThemeManager.resolveTheme(planet)
  galaxyColor === resolvedTheme.glow   // noteColor never bleeds into galaxy layer
```

### Property 5: Tag Count Invariant

**Validates: Requirements 5.5**
```
∀ planet with tags.length === 20:
  addTag(planet.id, anyNewTag)
  planet.tags.length === 20   // capped, error shown
```

### Property 6: Cascade Delete Atomicity

**Validates: Requirements 1.4, 17.4, 17.5**
```
∀ universe U:
  let ssIds = SolarSystemRepository.findByUniverse(U.id).map(ss => ss.id)
  let planetIds = ssIds.flatMap(id => PlanetRepository.findBySolarSystem(id).map(p => p.id))
  UniverseRepository.delete(U.id)
  -- After delete, no orphans remain:
  ssIds.every(id => SolarSystemRepository.find(id) === null)
  planetIds.every(id => EmbeddingRepository.find(id) === null)
```

### Property 7: WCAG Contrast Warning

**Validates: Requirements 19.9, 13.4**
```
∀ noteColor hex value where contrastRatio(noteColor, autoTextColor) < 4.5:
  ColorPickerModal.renders(<ContrastWarningBadge />)
```

---

## Error Handling

### Global React Error Boundary
Wraps the entire app. On any unhandled render error, renders `ErrorScreen` with a "Restart App" button that calls `Updates.reloadAsync()`.

### Storage Write Failures
```
StorageEngine write throws
  → errorSlice.setBanner(errorMessage)
  → ErrorBanner renders (non-blocking, auto-dismisses after 5s)
  → UI retains unsaved content in local draft state (draftDescription, etc.)
  → User can retry manually by attempting the action again
```

### Launch Read Failure
```
database.init() throws on first launch
  → errorSlice.setFatal(message)
  → ErrorScreen renders with "Retry" button
  → Retry calls database.init() again
  → If retry also fails, ErrorScreen persists with support contact
```

### AI / Embedding API Failures
```
HTTP 429 (rate limit) or 503 (unavailable)
  → settingsSlice.setQuotaExceeded(true)
  → AISearchService falls back to ONNX local embedding
  → No hosted explanation step
  → SearchModal shows <AIUnavailableBadge /> "AI explanation unavailable"

Network unreachable
  → Same fallback as 429/503

ONNX model fails to load
  → EmbeddingService returns null
  → Search runs keyword-only
  → settingsSlice.aiSearchEnabled effectively treated as false for this session
```

### Transaction Pattern (all multi-record writes)
```ts
async function atomicWrite(db: SQLiteDatabase, fn: () => Promise<void>): Promise<void> {
  await db.runAsync('BEGIN TRANSACTION');
  try {
    await fn();
    await db.runAsync('COMMIT');
  } catch (e) {
    await db.runAsync('ROLLBACK');
    throw e;   // bubbles up to errorSlice handler
  }
}
```
WAL mode ensures any uncommitted transaction is automatically rolled back by SQLite on the next open after a crash.

### Embedding Regeneration Failure
```
Auto-save triggers EmbeddingService.generate() → fails
  → AI_Search_Service logs error to console
  → Previous embedding is RETAINED in EmbeddingStore (not deleted)
  → No user-visible error shown
  → Next successful save will regenerate correctly
```

---

## Testing Strategy

### Unit Tests (Jest + React Native Testing Library)

| Area | What to test |
|---|---|
| `colorUtils.getContrastTextColor` | Given a set of background hex values, returns `#000000` or `#FFFFFF` with correct WCAG luminance math |
| `colorUtils.contrastRatio` | Returns ratio ≥ 4.5:1 for known-passing pairs, < 4.5:1 for known-failing pairs |
| `hexValidator` | Accepts `#A1B2C3`, rejects `ABC`, `#GGGGGG`, `#A1B2C3D4`, empty string |
| `cosineSimilarity` | Returns 1.0 for identical vectors, 0.0 for orthogonal vectors, correct value for known inputs |
| `OrbitEngine` (useOrbitEngine) | Given `orbitIndex` 0–24 and `totalPlanets` = 25, produces 3 distinct radius bands; no two planets share identical (x, y) |
| `ThemeManager.resolveTheme` | Node with null themeId inherits parent; dangling themeId falls back to stark-hologram |
| `ThemeManager.resolveNoteColor` | noteColor on node wins over theme; null propagates from parent |
| `PlanetRepository.delete` | After delete, orbitIndex values are 0..n-1 with no gaps (links to Property 2) |
| `EmbeddingRepository` serialization | Float32Array → BLOB → Float32Array cosine similarity > 0.9999 (links to Property 1) |
| `KeywordSearchService.search` | Matches in `name`, `subject`, `description`, `tags`; case-insensitive; empty/whitespace query returns empty |
| Auto-save debounce (`useAutoSave`) | Fires Storage write exactly once after 2s of inactivity; does not fire on every keystroke |

### Integration Tests (Jest + in-memory SQLite)

| Scenario | Assertion |
|---|---|
| Universe create → rename → delete | Cascade removes all Solar Systems, Suns, Planets, Embeddings; no orphans |
| Solar System create with image | `imageUrl` stored and retrieved correctly |
| Planet create beyond limit (25) | 26th create returns error; planet count remains 25 |
| Theme seeding on first launch | Exactly 4 built-in themes exist after `database.init()` |
| Migration v1 → v2 | `schema_version` increments; `note_color` column exists on all tables |
| Embedding upsert on planet update | Old embedding replaced; only one row per planetId in `embeddings` table |
| Transaction rollback on write failure | Database state identical to pre-write state after simulated failure |

### Property-Based Tests (fast-check)

All 7 properties defined in the **Correctness Properties** section above are implemented as `fc.property` tests. Key generators:

```ts
const arbHex = fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h.toUpperCase()}`);
const arbPlanetText = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  subject: fc.string({ maxLength: 200 }),
  description: fc.string({ minLength: 1, maxLength: 10000 }),
});
const arbOrbitIndex = fc.integer({ min: 0, max: 24 });
```

Run with: `npx jest --testPathPattern=pbt` (separate suite, can be slow due to ONNX init).

### End-to-End Tests (Detox)

| Flow | Covered |
|---|---|
| First launch → onboarding → create Universe → create Solar System → create Planet | Happy path |
| Planet color picker → select color → confirm → reopen → color persists | noteColor persistence |
| Search → keyword query → tap result → camera flies to Solar System | Search navigation |
| Settings → toggle Simple View → verify galaxy hidden, list visible | Accessibility toggle |
| Delete Universe with confirmation dialog | Cascade delete UI flow |
| Background → foreground → animations resume | AppState idle pause/resume |

### File Structure for Tests

```
src/
  __tests__/
    unit/
      colorUtils.test.ts
      cosineSimilarity.test.ts
      hexValidator.test.ts
      orbitEngine.test.ts
      themeManager.test.ts
    integration/
      universeRepository.test.ts
      planetRepository.test.ts
      embeddingRepository.test.ts
      database.migration.test.ts
    pbt/
      embedding.roundtrip.pbt.ts
      orbitIndex.contiguity.pbt.ts
      theme.resolution.pbt.ts
      noteColor.scope.pbt.ts
      tagCount.invariant.pbt.ts
      cascade.atomicity.pbt.ts
      wcag.contrast.pbt.ts
e2e/
  onboarding.e2e.ts
  colorPicker.e2e.ts
  search.e2e.ts
  settings.e2e.ts
  deleteUniverse.e2e.ts
  backgroundResume.e2e.ts
```

---

## File / Folder Structure

```
src/
  app/
    _layout.tsx               # Root navigator + OnboardingGuard
    index.tsx                 # Entry point
  screens/
    UniverseScreen.tsx
    SolarSystemScreen.tsx
    PlanetModalScreen.tsx
    SunModalScreen.tsx
    SearchModalScreen.tsx
    SettingsScreen.tsx
    onboarding/
      Step1Screen.tsx
      Step2Screen.tsx
      Step3Screen.tsx
  components/
    galaxy/
      GalaxyCanvas.tsx        # R3F Canvas wrapper with GPU check
      SolarSystemOrb.tsx      # Floating thumbnail in UniverseScreen
      SunOrb.tsx              # Central sun mesh
      PlanetOrb.tsx           # Planet mesh + orbit position
      OrbitRing.tsx           # Elliptical orbit line
      ParticleField.tsx       # Background star particles
      BloomPostFX.tsx         # @react-three/postprocessing Bloom
      LODController.tsx       # Switches geometry detail at >20 planets
      fallback/
        LottieGalaxy.tsx      # Lottie-based fallback canvas
        SVGOrbitView.tsx      # SVG parallax fallback
    editor/
      NoteEditor.tsx
      RichTextToolbar.tsx     # Bold / italic / bullets
      TagInput.tsx            # Tag chip input (max 20 × 50 chars)
      ColorPickerModal.tsx    # HSV wheel + hex input + contrast warning
      ThemePickerModal.tsx    # Theme selection grid
      AutoSaveIndicator.tsx
    search/
      SearchOverlay.tsx
      SearchResultCard.tsx
      RadarAnimation.tsx
      ConfidenceBar.tsx       # Percentage similarity bar
      AIUnavailableBadge.tsx
    ui/
      ConfirmDialog.tsx
      ErrorBanner.tsx         # Non-blocking 5s toast
      ErrorScreen.tsx         # Full-screen retry
      EmptyState.tsx
      LoadingIndicator.tsx
      ResumeBanner.tsx        # Onboarding resume prompt
  services/
    EmbeddingService.ts       # Gemini API + ONNX fallback
    AISearchService.ts        # Orchestrates semantic search
    KeywordSearchService.ts   # SQLite full-text search
    GPUBenchmarkService.ts    # Launch benchmark + renderer decision
  store/
    index.ts                  # Composed Zustand store
    universeSlice.ts
    solarSystemSlice.ts
    sunSlice.ts
    planetSlice.ts
    themeSlice.ts
    settingsSlice.ts
    searchSlice.ts
    animationSlice.ts
    errorSlice.ts
  db/
    database.ts               # expo-sqlite init + migration runner
    migrations/
      v1_initial.ts
      v2_add_note_color.ts
    repositories/
      UniverseRepository.ts
      SolarSystemRepository.ts
      SunRepository.ts
      PlanetRepository.ts
      ThemeRepository.ts
      EmbeddingRepository.ts
      SettingsRepository.ts
  theme/
    ThemeContext.tsx
    ThemeManager.ts
    presets.ts                # 4 built-in theme definitions
    colorUtils.ts             # Contrast ratio, luminance, hex utils
  hooks/
    useAnimationController.ts
    useOrbitEngine.ts
    useReducedMotion.ts
    useAutoSave.ts            # Debounced 2s save
    useEmbedding.ts
    useTheme.ts
    useColorPicker.ts
  utils/
    cosineSimilarity.ts
    hexValidator.ts
    uuid.ts
    arrayBufferUtils.ts       # Float32Array ↔ Uint8Array
  navigation/
    RootNavigator.tsx
    AppNavigator.tsx
    OnboardingNavigator.tsx
    linking.ts                # orbinote:// deep link config
  constants/
    timing.ts                 # TRANSITION_ZOOM_MS, AUTOSAVE_DEBOUNCE_MS, etc.
    limits.ts                 # MAX_PLANETS, MAX_TAGS, MAX_TAG_LENGTH, etc.
    colors.ts                 # Theme color tokens
  types/
    entities.ts
    store.ts
    navigation.ts
assets/
  fonts/
    Orbitron-Regular.ttf
    Orbitron-Bold.ttf
    Inter-Regular.ttf
    Inter-Bold.ttf
  lottie/
    radar-sweep.json
    orbit-idle.json
    hud-power-on.json
  textures/
    planet-wireframe.png
    sun-glow.png
    star-field.png
```

---

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | ~51.x | App shell, managed workflow |
| `react-native` | 0.74.x | Core framework |
| `@react-three/fiber` (native) | ~8.x | 3D rendering |
| `expo-three` | ~7.x | Three.js bridge for Expo |
| `@react-three/postprocessing` | ~2.x | Bloom post-processing |
| `expo-sqlite` | ~13.x | Local SQLite database |
| `zustand` | ~4.x | Global state management |
| `@react-navigation/native` | ~6.x | Navigation |
| `@react-navigation/native-stack` | ~6.x | Native stack navigator |
| `react-native-reanimated` | ~3.x | Animations + springs |
| `react-native-gesture-handler` | ~2.x | Gesture detection |
| `onnxruntime-react-native` | ~1.17.x | On-device embedding fallback |
| `reanimated-color-picker` | ~3.x | HSV color wheel component |
| `lottie-react-native` | ~6.x | Lottie animation fallback |
| `expo-font` | ~12.x | Custom font loading |
| `expo-image-picker` | ~15.x | Solar System image upload |
| `fast-check` | ~3.x | Property-based testing |
| `@testing-library/react-native` | ~12.x | Component unit tests |
| `detox` | ~20.x | End-to-end tests |
