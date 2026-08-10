# Implementation Tasks — Orbinote (Cosmic Notes)

## Task Dependency Graph

```
Phase 1 (Foundation)
  └─► Phase 2 (Data Layer)
        └─► Phase 3 (PBT Tests)
        └─► Phase 4 (Rendering)
              └─► Phase 5 (Animation)
                    └─► Phase 7 (Screens)
        └─► Phase 6 (Theme System)
              └─► Phase 7 (Screens)
              └─► Phase 8 (Color Picker)
        └─► Phase 9 (Search)
  All phases ─► Phase 10 (Polish & Integration)
```

---

## Phase 1 — Project Foundation

### Task 1: Initialize Expo Project and Configure Workspace [P0]
**Implements: Design §File/Folder Structure, §Key Dependencies**

- [ ] 1.1 Initialize new Expo managed project with TypeScript template (`expo init orbinote --template expo-template-blank-typescript`)
- [ ] 1.2 Create full `src/` directory structure: `app/`, `screens/`, `components/galaxy/`, `components/editor/`, `components/search/`, `components/ui/`, `services/`, `store/`, `db/repositories/`, `db/migrations/`, `theme/`, `hooks/`, `utils/`, `navigation/`, `constants/`, `types/`
- [ ] 1.3 Create `assets/fonts/`, `assets/lottie/`, `assets/textures/` directories
- [ ] 1.4 Configure `tsconfig.json` with strict mode and path aliases (`@/` → `src/`)
- [ ] 1.5 Install all dependencies at pinned versions: `expo@~51.x`, `react-native@0.74.x`, `@react-three/fiber@~8.x`, `expo-three@~7.x`, `@react-three/postprocessing@~2.x`, `expo-sqlite@~13.x`, `zustand@~4.x`, `@react-navigation/native@~6.x`, `@react-navigation/native-stack@~6.x`, `react-native-reanimated@~3.x`, `react-native-gesture-handler@~2.x`, `onnxruntime-react-native@~1.17.x`, `reanimated-color-picker@~3.x`, `lottie-react-native@~6.x`, `expo-font@~12.x`, `expo-image-picker@~15.x`, `fast-check@~3.x`, `@testing-library/react-native@~12.x`, `detox@~20.x`
- [ ] 1.6 Configure Babel for Reanimated (`react-native-reanimated/plugin` in `babel.config.js`)
- [ ] 1.7 Load custom fonts in `app/_layout.tsx` via `expo-font`: Orbitron-Regular, Orbitron-Bold, Inter-Regular, Inter-Bold
- [ ] 1.8 Create `src/constants/timing.ts` with all animation duration constants
- [ ] 1.9 Create `src/constants/limits.ts` with `MAX_PLANETS=25`, `MAX_TAGS=20`, `MAX_TAG_LENGTH=50`, etc.
- [ ] 1.10 Create `src/types/entities.ts` with TypeScript interfaces for all entities (Universe, SolarSystem, Sun, Planet, Theme, Embedding, SearchResult)

---

### Task 2: Configure React Navigation [P0]
**Implements: Design §Navigation & Routing, Requirements 7, 18**

- [ ] 2.1 Create `src/navigation/RootNavigator.tsx` — top-level stack with OnboardingGuard logic
- [ ] 2.2 Create `src/navigation/AppNavigator.tsx` — main stack: UniverseScreen, SolarSystemScreen, PlanetModal, SunModal, SearchModal, SettingsScreen
- [ ] 2.3 Create `src/navigation/OnboardingNavigator.tsx` — 3-step onboarding stack
- [ ] 2.4 Create `src/navigation/linking.ts` — deep link config: `orbinote://universe/:uid/solarsystem/:ssid/planet/:pid`
- [ ] 2.5 Create `src/types/navigation.ts` — typed route param interfaces for all screens
- [ ] 2.6 Wire `GestureHandlerRootView` and `NavigationContainer` in `app/_layout.tsx`

---

### Task 3: SQLite Database Setup and Migrations [P0]
**Implements: Requirements 8.3, 8.4, 8.5, Design §SQLite Schema**

- [ ] 3.1 Create `src/db/database.ts` — initialize expo-sqlite, enable WAL mode, run migration runner on launch
- [ ] 3.2 Create `src/db/migrations/v1_initial.ts` — CREATE TABLE statements for all 8 tables with CHECK constraints, CASCADE rules, and indexes
- [ ] 3.3 Implement `atomicWrite()` helper in `database.ts` — wraps writes in BEGIN/COMMIT/ROLLBACK transactions
- [ ] 3.4 Implement migration runner — reads `schema_version` from settings table, runs pending migrations sequentially
- [ ] 3.5 Seed 4 built-in themes (Stark Hologram `#05060F`/`#4FD8FF`/`#FF9A3C`/`#8A6CFF`, Cyberpunk, Pastel Galaxy, Minion) on v1 migration
- [ ] 3.6 Write integration tests: schema creates all tables, indexes exist, WAL mode active, 4 themes seeded

---

### Task 4: Zustand Store Setup [P0]
**Implements: Design §State Management, all requirements**

- [ ] 4.1 Create `src/store/index.ts` — compose all slices into single Zustand store
- [ ] 4.2 Implement `universeSlice.ts` — `{ universes[], activeUniverseId, loading, error }` + CRUD actions
- [ ] 4.3 Implement `solarSystemSlice.ts` — `{ solarSystems{}, activeSolarSystemId }` + CRUD actions
- [ ] 4.4 Implement `sunSlice.ts` — `{ suns{} }` keyed by solarSystemId + updateSun action
- [ ] 4.5 Implement `planetSlice.ts` — `{ planets{} }` keyed by solarSystemId + CRUD actions
- [ ] 4.6 Implement `themeSlice.ts` — `{ themes[], defaultThemeId }` + setDefaultTheme
- [ ] 4.7 Implement `settingsSlice.ts` — `{ simpleViewEnabled, aiSearchEnabled, onboardingComplete, quotaExceeded }` + toggle actions
- [ ] 4.8 Implement `searchSlice.ts` — `{ query, results, mode, loading }` + search/clearSearch
- [ ] 4.9 Implement `animationSlice.ts` — `{ reducedMotion }` + setReducedMotion
- [ ] 4.10 Implement `errorSlice.ts` — `{ bannerMessage, fatalMessage }` + setBanner/setFatal/clearBanner

---

### Task 5: Global Error Handling Infrastructure [P1]
**Implements: Requirements 17.1, 17.2, Design §Error Handling**

- [ ] 5.1 Create `src/components/ui/ErrorBanner.tsx` — non-blocking toast, auto-dismisses after 5s, driven by `errorSlice.bannerMessage`
- [ ] 5.2 Create `src/components/ui/ErrorScreen.tsx` — full-screen error with Retry button, driven by `errorSlice.fatalMessage`
- [ ] 5.3 Wrap app root in React `ErrorBoundary` class component that renders ErrorScreen on unhandled render errors
- [ ] 5.4 Create `src/components/ui/LoadingIndicator.tsx` — spinner shown on slow reads (>200ms)

---

### Task 6: Accessibility Controller [P0]
**Implements: Requirements 13.1, 13.6**

- [ ] 6.1 Create `src/hooks/useReducedMotion.ts` — calls `AccessibilityInfo.isReduceMotionEnabled()` at mount + subscribes to `reduceMotionChanged` event
- [ ] 6.2 On mount and change, dispatch `animationSlice.setReducedMotion(value)` to update global store
- [ ] 6.3 Add `useReducedMotion` call in `app/_layout.tsx` so it runs for the full app lifetime

---

## Phase 2 — Core Data Layer

### Task 7: Repository Layer [P0]
**Implements: Requirements 1–5, 8, Design §Repository Pattern**

- [ ] 7.1 Create `UniverseRepository.ts` — `findAll()`, `create()`, `rename()` (1–100 char validation), `delete()` (atomic cascade)
- [ ] 7.2 Create `SolarSystemRepository.ts` — `findByUniverse()`, `create()`, `update()` (includes noteColor), `delete()` (atomic cascade)
- [ ] 7.3 Create `SunRepository.ts` — `findBySolarSystem()`, `update()` (includes noteColor), auto-create on SolarSystem create
- [ ] 7.4 Create `PlanetRepository.ts` — `findBySolarSystem()`, `create()` (auto orbitIndex = count), `update()` (includes noteColor), `delete()` (reassign orbitIndex 0..n-1), `countBySolarSystem()`
- [ ] 7.5 Create `ThemeRepository.ts` — `findAll()`, `findById()` (returns stark-hologram if not found)
- [ ] 7.6 Create `EmbeddingRepository.ts` — `upsert()` (Float32Array → Uint8Array → BLOB), `get()` (BLOB → Uint8Array → Float32Array), `deleteByPlanet()`
- [ ] 7.7 Create `SettingsRepository.ts` — `get(key)`, `set(key, value)` for all settings keys
- [ ] 7.8 Wire all repositories to use the `atomicWrite()` helper for multi-record operations
- [ ] 7.9 Write integration tests for each repository covering happy path and error cases

---

## Phase 3 — Property-Based and Integration Tests

### Task 8: Establish Testing Infrastructure [P1]
**Implements: Design §Quality, Requirements 8.5, 10.2, 11.3**

- [ ] 8.1 Configure Jest for Expo with TypeScript support and React Native testing utilities
- [ ] 8.2 Add dev dependencies: `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`, `fast-check`, `ts-jest`, `expo-mock` and `jest-watch-typeahead`
- [ ] 8.3 Create `src/__tests__/repository.integration.spec.ts` for repo CRUD and migration behavior
- [ ] 8.4 Create `src/__tests__/theme.resolution.spec.ts` for theme fallback and override rules
- [ ] 8.5 Create `src/__tests__/planet.validation.spec.ts` with property-based tests for tag limits, orbitIndex assignment, and noteColor validation
- [ ] 8.6 Add a `test` script to `package.json` that runs Jest in watch mode with Expo preset

---

## Phase 4 — Rendering

### Task 9: Build the Galaxy Rendering Engine [P0]
**Implements: Requirements 1–7, 14, 15**

- [ ] 9.1 Create `src/components/galaxy/GalaxyCanvas.tsx` using `@react-three/fiber` and `expo-three`
- [ ] 9.2 Create `src/components/galaxy/OrbitScene.tsx` — renders Sun, Planets, orbit rings, and particle field
- [ ] 9.3 Implement GPU feature detection and fallback logic in `src/services/gpu/GPUBenchmarkService.ts`
- [ ] 9.4 Add `src/components/galaxy/LowEndFallback.tsx` using Lottie or vector assets when GPU support is insufficient
- [ ] 9.5 Create `src/components/galaxy/PlanetOrb.tsx` and `SunOrb.tsx` with hit targets and glow styling
- [ ] 9.6 Add scene LOD behavior: hide distant planets, reduce effect density at >15 objects, maintain ≥55fps on mid-range devices
- [ ] 9.7 Write rendering smoke tests covering canvas mounting, fallback selection, and planet count limits

---

## Phase 5 — Animation

### Task 10: Create the Animation Controller [P0]
**Implements: Requirements 7, 13, 14**

- [ ] 10.1 Create `src/animation/AnimationController.ts` with transition types and duration presets
- [ ] 10.2 Implement `useAnimationController()` hook for screen transitions, planet detach, fly-to, and return animations
- [ ] 10.3 Add reduced-motion substitution rules using opacity fades when `animationSlice.reducedMotion` is true
- [ ] 10.4 Integrate `AnimationController` with screen navigation and canvas interactions
- [ ] 10.5 Add tests for transition substitution and skip-on-tap behavior in `src/__tests__/animation.controller.spec.ts`

---

## Phase 6 — Theme System

### Task 11: Implement Live Themes and Overrides [P0]
**Implements: Requirements 6, 12, 14**

- [ ] 11.1 Create `src/theme/theme-manager.ts` to resolve themes by node and inherit missing properties
- [ ] 11.2 Create built-in theme definitions in `src/theme/builtins.ts` for Stark Hologram, Minion, Cyberpunk, Pastel Galaxy
- [ ] 11.3 Create `src/theme/ThemeContext.tsx` and `useTheme()` hook
- [ ] 11.4 Add `src/components/ui/ThemePicker.tsx` with live preview and default-theme fallback
- [ ] 11.5 Add fallback logic so unknown theme IDs resolve to Stark Hologram
- [ ] 11.6 Add tests for theme inheritance, override merging, and fallback behavior

---

## Phase 7 — Screens

### Task 12: Build Core Screens and Navigation [P0]
**Implements: Requirements 1–5, 7, 9, 12, 13**

- [ ] 12.1 Create `src/screens/UniverseScreen.tsx` with Solar System thumbnails and empty-state prompt
- [ ] 12.2 Create `src/screens/SolarSystemScreen.tsx` with orbiting Sun and Planet orbs, Add Planet CTA, and summary header
- [ ] 12.3 Create `src/screens/PlanetModal.tsx` and `src/screens/SunModal.tsx` with note editing panels
- [ ] 12.4 Create `src/screens/SearchModal.tsx` with keyword/semantic search input, results list, and AI explanation badge
- [ ] 12.5 Create `src/screens/SettingsScreen.tsx` with Simple/List View toggle, AI search toggle, and theme selection
- [ ] 12.6 Create `src/screens/OnboardingNavigator.tsx` and onboarding steps for first-run setup
- [ ] 12.7 Wire navigation stacks in `src/navigation/RootNavigator.tsx`, `AppNavigator.tsx`, and `linking.ts`
- [ ] 12.8 Add `src/components/ui/SimpleListView.tsx` for the accessible list/tree experience
- [ ] 12.9 Add screen-level tests verifying navigation wiring, search modal flow, and settings persistence

---

## Phase 8 — Color Picker and Note Styling

### Task 13: Add Note Color and Tag Controls [P1]
**Implements: Requirements 4, 5, 11, 13**

- [ ] 13.1 Create `src/components/ui/ColorPickerModal.tsx` with HSV wheel, hex input, and contrast preview
- [ ] 13.2 Create `src/components/ui/TagInput.tsx` enforcing max 20 tags and 50 characters per tag
- [ ] 13.3 Add noteColor controls to Planet and Sun edit panels
- [ ] 13.4 Persist noteColor and tags in repository update flows
- [ ] 13.5 Add contrast validation helpers to ensure body text meets WCAG AA ratios
- [ ] 13.6 Write tests for color picker validation, tag limits, and noteColor persistence

---

## Phase 9 — Search and AI

### Task 14: Implement Keyword and Semantic Search [P0]
**Implements: Requirements 9, 10, 11**

- [ ] 14.1 Create `src/services/search/KeywordSearchService.ts` for SQLite full-text search across Planets and Suns
- [ ] 14.2 Create `src/services/search/EmbeddingService.ts` for float vector serialization and deserialization
- [ ] 14.3 Create `src/services/search/AISearchService.ts` for query embedding, cosine similarity ranking, and optional hosted explanation
- [ ] 14.4 Add `src/services/search/SearchController.ts` to coordinate keyword/semantic fallback and quota handling
- [ ] 14.5 Wire search actions into `searchSlice` and update `SearchModal.tsx` to show match percentages and explanation badges
- [ ] 14.6 Add tests for semantic fallback, explanation unavailable state, and search result selection navigation

---

## Phase 10 — Polish & Integration

### Task 15: Final Polish, Accessibility, and Release Readiness [P0]
**Implements: Requirements 8, 13, 14, 15**

- [ ] 15.1 Add `src/components/ui/ErrorBanner.tsx` and `ErrorScreen.tsx` to surface non-blocking and fatal storage errors
- [ ] 15.2 Add `src/components/ui/LoadingIndicator.tsx` and slow-read UI state handling
- [ ] 15.3 Create `src/hooks/useReducedMotion.ts` and wire accessibility changes into global app state
- [ ] 15.4 Add offline startup checks and database migration failure handling in `app/_layout.tsx`
- [ ] 15.5 Add final performance tuning: limit orbit count, reduce particle density, and disable heavy bloom on low-end devices
- [ ] 15.6 Run full integration test suite, fix regressions, and document remaining v1 scope in `README.md`
- [ ] 15.7 Add `Release Notes` section in `README.md` describing v1 feature set and known limitations

---

## Project Summary

- Total phases: 10
- Total tasks: 15
- Task breakdown:
  - Foundation: 6 tasks
  - Core data layer: 1 task
  - Testing: 1 task
  - Rendering: 1 task
  - Animation: 1 task
  - Theme system: 1 task
  - Screens: 1 task
  - Color picker / note styling: 1 task
  - Search and AI: 1 task
  - Polish & integration: 1 task

### Status and Priority

- Status keys:
  - `[ ]` = not started
  - `[-]` = in progress
  - `[x]` = complete
- Priority markers:
  - `P0` = must ship in v1
  - `P1` = important but can shift if needed
  - `P2` = nice-to-have, v1 stretch

### Next steps

1. Review the full task list and mark any scopes that need splitting or reprioritization.
2. Start implementation with Phase 1 and Phase 2 deliverables.
3. Keep the task list updated as new requirements or technical discoveries arise.

---
