# Requirements Document

## Introduction

Orbinote is a mobile note-taking application (iOS and Android) that visualizes notes as a 3D interactive universe styled after a Tony Stark / Iron Man holographic interface. The hierarchy maps naturally to an astronomy metaphor: a Universe contains Solar Systems (topics/projects), each Solar System has a Sun (main subject) surrounded by orbiting Planets (sub-notes). The visual layer uses a "3D-styled 2D" (stylized parallax/pseudo-3D) rendering approach for optimal mobile performance. Notes are stored offline-first in local storage for v1. AI-powered semantic search supplements keyword search via a free-tier hosted API, with graceful degradation to keyword-only when quota is reached.

---

## Glossary

- **Universe**: The top-level container, equivalent to a workspace or notebook. Contains one or more Solar Systems.
- **Solar_System**: A topic or project within a Universe. Has an image, name, and optional theme override. Contains exactly one Sun and up to 25 Planets.
- **Sun**: The central node of a Solar System representing the main subject or topic. Tap target to view/edit the primary note.
- **Planet**: A sub-note orbiting the Sun. Has a name, subject/title, description, orbit index, and optional theme override.
- **Theme**: A visual preset defining background gradient, glow color, planet texture/icon, particle style, and optional ambient sound.
- **Universe_View**: The home screen displaying all Solar Systems as floating thumbnails in space.
- **Solar_System_View**: The screen showing the Sun centered with Planets orbiting around it.
- **Planet_View**: The zoomed-in card/modal showing the full content of a single Planet note.
- **Search_Overlay**: The overlay UI providing keyword and AI-semantic search across all notes.
- **Animation_Controller**: The subsystem responsible for managing all transitions, idle animations, and motion preferences.
- **Storage_Engine**: The local persistence layer (SQLite via expo-sqlite or WatermelonDB).
- **AI_Search_Service**: The subsystem that generates embeddings, performs cosine-similarity search locally, and optionally calls a hosted AI API for answer/explanation.
- **Embedding_Store**: The local vector store holding per-note embeddings for semantic search.
- **Theme_Manager**: The subsystem responsible for loading, switching, and persisting theme selections.
- **Accessibility_Controller**: The subsystem that reads OS accessibility settings and adapts the UI accordingly.
- **Reduced_Motion**: An OS-level setting that signals the app should minimize or eliminate motion effects.
- **Simple_View**: A flat list/tree representation of all notes, toggled by the user as an alternative to the galaxy view.
- **WCAG_AA**: Web Content Accessibility Guidelines Level AA — the minimum contrast standard applied to all note body text.

---

## Requirements

### Requirement 1: Universe Management

**User Story:** As a user, I want to create, rename, and delete Universes, so that I can organise my notes into separate top-level workspaces.

#### Acceptance Criteria

1. THE Storage_Engine SHALL persist each Universe with the fields: `id`, `name`, `themeId`, and `createdAt`.
2. WHEN a user creates a new Universe, THE Storage_Engine SHALL assign a unique `id` and record the current timestamp as `createdAt`.
3. WHEN a user confirms a Universe rename, THE Storage_Engine SHALL update the `name` field (1–100 characters) and reflect the change in the Universe_View within 300ms of confirmation.
4. WHEN a user deletes a Universe, THE Storage_Engine SHALL atomically delete all associated Solar Systems, Suns, Planets, and embeddings belonging to that Universe, leaving no partial data on failure.
5. IF a Universe deletion is requested and the Universe contains one or more Solar Systems, THEN THE App SHALL display a confirmation dialog listing the number of Solar Systems that will be deleted before proceeding.
6. IF a rename is attempted with a name that is empty or exceeds 100 characters, THEN THE App SHALL reject the input with an inline error message and leave the existing name unchanged.
7. WHILE the Universe_View is active and the app is in the foreground, THE Animation_Controller SHALL run continuous idle drift animations on all Solar System thumbnails. IF no Universes exist, THE Universe_View SHALL display an empty-state prompt to create the first Universe.
8. WHEN the app transitions to the background, THE Animation_Controller SHALL pause all idle animations to conserve battery.

---

### Requirement 2: Solar System Management

**User Story:** As a user, I want to create, edit, and delete Solar Systems within a Universe, so that I can group related notes under a named topic or project.

#### Acceptance Criteria

1. THE Storage_Engine SHALL persist each Solar System with the fields: `id`, `universeId`, `name` (1–100 characters, required), `imageUrl` (nullable), `themeId` (defaults to the parent Universe's `themeId` if not explicitly set), and `noteColor` (nullable hex string in `#RRGGBB` format).
2. WHEN a user creates a Solar System, THE Storage_Engine SHALL associate it with the current Universe via `universeId`, and the Universe_View SHALL reflect the new Solar System within 300ms.
3. WHEN a user provides an image for a Solar System, THE Storage_Engine SHALL store a local reference to the image as `imageUrl`.
4. IF no image is provided for a Solar System, THEN THE Solar_System_View SHALL render a placeholder icon deterministically derived from the Solar System's `name` using the active Theme's glow color.
5. WHEN a user deletes a Solar System, THE Storage_Engine SHALL delete all associated Suns, Planets, and embeddings belonging to that Solar System.
6. IF a Solar System deletion is requested and the Solar System contains one or more Planets, THEN THE App SHALL display a confirmation dialog listing the number of Planets that will be deleted before proceeding.
7. THE Solar_System_View SHALL display a maximum of 25 Planets orbiting the Sun simultaneously.

---

### Requirement 3: Sun (Main Topic) Management

**User Story:** As a user, I want to set and edit the main subject of a Solar System via the Sun, so that I have a clear central reference for the topic.

#### Acceptance Criteria

1. THE Storage_Engine SHALL persist each Sun with the fields: `id`, `solarSystemId`, `title` (0–200 characters), `description` (0–10,000 characters), `themeId`, and `noteColor` (nullable hex string in `#RRGGBB` format).
2. WHEN a Solar System is created, THE Storage_Engine SHALL automatically create an associated Sun with `title` set to an empty string and `description` set to an empty string.
3. WHEN a user taps the Sun in the Solar_System_View, THE App SHALL open an edit panel for the Sun's `title` and `description` within 400ms.
4. THE Storage_Engine SHALL enforce a one-to-one relationship between a Solar System and its Sun; each Solar System SHALL have exactly one Sun.
5. WHEN a user edits the Sun's `title` or `description` and stops typing, THE Storage_Engine SHALL auto-save the changes within 2 seconds of the last keystroke.
6. IF a user closes the Sun edit panel without saving, THEN THE App SHALL discard unsaved changes and restore the previously persisted `title` and `description` values.

---

### Requirement 4: Planet (Sub-Note) Management

**User Story:** As a user, I want to create, edit, and delete Planet notes orbiting the Sun, so that I can capture detailed sub-topics linked to the main subject.

#### Acceptance Criteria

1. THE Storage_Engine SHALL persist each Planet with the fields: `id`, `solarSystemId`, `name`, `subject`, `description`, `themeId`, `tags`, `orbitIndex`, and `noteColor` (nullable hex string in `#RRGGBB` format).
2. WHEN a user creates a Planet, THE Storage_Engine SHALL assign it the next available `orbitIndex` (equal to the current count of Planets in the Solar System before insertion, starting at 0).
3. WHEN a user edits a Planet, THE Storage_Engine SHALL update the `name`, `subject`, `description`, `themeId`, or `noteColor` fields and persist the changes within 300ms.
4. WHEN a user deletes a Planet, THE Storage_Engine SHALL remove the Planet record and its associated embedding from the Embedding_Store, then reassign `orbitIndex` values to remaining Planets sequentially from 0 to eliminate gaps.
5. THE Solar_System_View SHALL support a maximum of 25 visible Planets at one time.
6. IF a user attempts to add a Planet when 25 Planets already exist in the Solar System, THEN THE App SHALL display an informational message indicating the maximum has been reached, and the message SHALL be dismissible by the user.
7. WHEN a user taps a Planet in the Solar_System_View, THE Animation_Controller SHALL detach the Planet from its orbit and slide up the Planet_View panel within 400ms.

---

### Requirement 5: Planet Note Editor

**User Story:** As a user, I want a rich editing experience inside the Planet_View, so that I can write and format my notes comfortably.

#### Acceptance Criteria

1. THE Planet_View SHALL display the Planet's editable `name` (title bar), editable `subject` (subtitle), a scrollable `description` editor, and a color picker control for the Planet's `noteColor`.
2. WHEN a user edits the `description` field, THE Storage_Engine SHALL auto-save changes within 2 seconds of the last keystroke without requiring manual save.
3. WHEN content is auto-saved, THE AI_Search_Service SHALL regenerate the Planet's embedding and update the Embedding_Store. IF embedding regeneration fails, THE App SHALL log the error and retain the previous embedding in the Embedding_Store without displaying an error to the user.
4. THE Planet_View SHALL provide a theme picker allowing the user to assign or override the Planet's `themeId`.
5. THE Planet_View SHALL support tagging: the `tags` field SHALL allow a maximum of 20 free-text tags per Planet, each tag limited to 50 characters. Users SHALL be able to add, remove, and view all tags on the Planet_View.
6. THE Planet_View SHALL provide inline text formatting controls for bold, italic, and bulleted lists within the `description` field.
7. WHEN a user closes the Planet_View, THE Animation_Controller SHALL animate the Planet returning to its orbit position within 400ms.

---

### Requirement 6: Theme System

**User Story:** As a user, I want to apply visual themes to my Universes, Solar Systems, and Planets, so that I can personalise the look and feel of my notes.

#### Acceptance Criteria

1. THE Storage_Engine SHALL persist each Theme with the fields: `id`, `name`, `colors`, `glow`, `texture`, `particleStyle`, and optional `sound`.
2. THE Theme_Manager SHALL provide the following built-in preset themes: "Stark Hologram", "Minion", "Cyberpunk", and "Pastel Galaxy".
3. WHEN a user selects a different Theme, THE Theme_Manager SHALL apply the new theme to the currently displayed view without requiring an app reload.
4. WHEN a Universe, Solar System, or Planet has a `themeId` set, THE Theme_Manager SHALL apply the corresponding Theme to that node and its children, unless a child node has its own `themeId` override.
5. WHERE a node has a `themeOverride`, THE Theme_Manager SHALL use only the specified override fields for that node, inheriting all other fields from the parent Theme.
6. THE Theme_Manager SHALL apply the "Stark Hologram" theme by default to all new nodes that do not have an explicit `themeId`.
7. THE "Stark Hologram" theme SHALL use background color `#05060F`, primary glow color `#4FD8FF`, Sun accent color `#FF9A3C`, and UI chrome accent color `#8A6CFF`.
8. IF a node's `themeId` references a Theme that no longer exists in the Storage_Engine, THEN THE Theme_Manager SHALL fall back to the "Stark Hologram" theme for that node.

---

### Requirement 7: Navigation and Screen Transitions

**User Story:** As a user, I want smooth animated transitions between views, so that the app feels immersive and spatially coherent.

#### Acceptance Criteria

1. WHEN a user taps a Solar System thumbnail in the Universe_View, THE Animation_Controller SHALL execute a camera dolly/zoom transition into the Solar_System_View with a duration between 500ms and 700ms using ease-in-out easing.
2. WHEN a user taps a Planet in the Solar_System_View, THE Animation_Controller SHALL detach the Planet from its orbit using ease-in-out easing within 200ms.
3. WHEN the Planet is detached, THE Animation_Controller SHALL slide up the Planet_View panel within 400ms total from the initial tap.
4. WHEN a user dismisses the Planet_View, THE Animation_Controller SHALL return the Planet to its stored orbit position using ease-in-out easing within 400ms.
5. WHEN a user navigates back from the Solar_System_View to the Universe_View, THE Animation_Controller SHALL execute a reverse camera dolly/zoom with the same duration (500–700ms) and ease-in-out easing.
6. WHILE Reduced_Motion is enabled on the device, THE Animation_Controller SHALL replace all camera dolly/zoom transitions with simple cross-fades of equivalent duration (500–700ms).
7. WHILE Reduced_Motion is enabled on the device, THE Animation_Controller SHALL replace all planet detach and Planet_View slide-up animations with simple fade-in transitions of 400ms duration.
8. WHILE Reduced_Motion is enabled on the device, THE Animation_Controller SHALL disable all idle drift and continuous orbit animations.

---

### Requirement 8: Offline-First Local Storage

**User Story:** As a user, I want my notes to be available without an internet connection, so that I can access and edit them at any time.

#### Acceptance Criteria

1. THE Storage_Engine SHALL persist all Universes, Solar Systems, Suns, Planets, Themes, and embeddings to local device storage.
2. WHEN the device has no network connectivity, THE App SHALL allow users to create, read, update, and delete Universes, Solar Systems, Suns, and Planets without any degradation to these core operations.
3. THE Storage_Engine SHALL use a local SQLite-based database library (such as expo-sqlite or WatermelonDB) as the underlying local database.
4. WHEN the app is launched for the first time, THE Storage_Engine SHALL initialise the local database by defining all required tables and columns, and seed exactly four built-in Theme records corresponding to the presets defined in Requirement 6.
5. IF the Storage_Engine fails to initialise the database schema on first launch, THEN THE App SHALL display a full-screen error state explaining the failure and block further use until the issue is resolved.
6. IF a Storage_Engine write operation fails, THEN THE App SHALL display a non-blocking error banner describing the failure, and the UI SHALL revert to the data state that existed immediately before the failed write.

---

### Requirement 9: Keyword Search

**User Story:** As a user, I want to search my notes by keyword, so that I can quickly locate specific content across all Solar Systems.

#### Acceptance Criteria

1. WHEN a user activates the Search_Overlay, THE App SHALL present a text input field with a radar-pulse animation.
2. WHEN a user submits a non-empty, non-whitespace-only keyword query (by pressing the Return key or a search button), THE Storage_Engine SHALL search the `name`, `subject`, `description`, and `tags` fields across all Planets and Suns in all Solar Systems within the active Universe.
3. WHEN keyword search results are returned, THE Search_Overlay SHALL display up to 50 matching Planets and Suns as a list of result cards within 500ms of query submission.
4. WHEN a user taps a search result, THE Animation_Controller SHALL execute a camera fly-to animation to the matching item's Solar System with a duration between 800ms and 1200ms. IF the user taps the screen during the animation, THE animation SHALL stop and the app SHALL navigate immediately to the Solar System view.
5. IF no results are found for a keyword query, THEN THE Search_Overlay SHALL display a "No results found" message that persists until the user clears or modifies the query.
6. WHEN a user taps a Sun result, THE Animation_Controller SHALL execute a camera fly-to animation to the corresponding Solar System and open the Sun edit panel on arrival.

---

### Requirement 10: AI Semantic Search

**User Story:** As a user, I want to search my notes using natural language, so that I can find conceptually related notes even when they don't contain the exact search terms.

#### Acceptance Criteria

1. WHEN a Planet note is created or updated, THE AI_Search_Service SHALL generate a text embedding for the Planet's `name`, `subject`, and `description` fields combined, and persist the embedding vector in the Embedding_Store.
2. THE Embedding_Store SHALL store each embedding as a fixed-length float vector associated with its Planet `id`.
3. WHEN a user submits a natural language query (up to 500 characters) via the Search_Overlay, THE AI_Search_Service SHALL generate an embedding for the query and perform a cosine-similarity search against the Embedding_Store locally, scoped to the active Universe.
4. WHEN cosine-similarity results are available, THE AI_Search_Service SHALL return the top 10 Planets with a cosine similarity score of 0.10 or greater, ranked in descending order of similarity score, to the Search_Overlay.
5. WHERE a hosted AI API (Google Gemini, Groq, Hugging Face, or OpenRouter) is available and within quota, THE AI_Search_Service SHALL call the API to generate a natural-language explanation (≤150 words) of why the top results match the query.
6. IF the hosted AI API quota is exceeded or the API is unreachable, THEN THE AI_Search_Service SHALL fall back to returning cosine-similarity results without an AI-generated explanation, and THE Search_Overlay SHALL display an indicator that AI explanation is temporarily unavailable.
7. THE AI_Search_Service SHALL support embedding generation via the same hosted API used for explanations, with fallback to a lightweight locally bundled model if the API is unavailable.
8. WHEN semantic search results are returned, THE Search_Overlay SHALL display each matching Planet with a labeled percentage bar representing its similarity score (e.g., "85% match").

---

### Requirement 11: Semantic Search — Round-Trip Embedding Integrity

**User Story:** As a developer, I want to ensure embeddings are stable and consistent across save/load cycles, so that search results remain reliable.

#### Acceptance Criteria

1. WHEN an embedding is generated for a Planet, THE Embedding_Store SHALL serialize the float vector to a binary or JSON representation and persist it to the Storage_Engine.
2. WHEN an embedding is loaded from the Storage_Engine, THE Embedding_Store SHALL deserialize it back to a float vector that is element-wise equal to the original persisted vector.
3. WHEN a valid Planet record (one with a non-null, non-empty `description`) has its embedding generated, persisted, and reloaded, THE reloaded vector SHALL have a cosine similarity to the original generated vector greater than 0.9999.
4. WHEN the `description` of a Planet is updated and a new embedding is successfully generated, THE AI_Search_Service SHALL replace the existing embedding in the Embedding_Store with the newly generated one.
5. IF the new embedding generation fails during a Planet update, THEN THE AI_Search_Service SHALL retain the previous embedding in the Embedding_Store and the old embedding SHALL NOT be deleted.

---

### Requirement 12: Accessibility — Simple/List View

**User Story:** As a user who prefers a standard interface, I want to toggle a flat list view of my notes, so that I can navigate without the galaxy animations.

#### Acceptance Criteria

1. THE App SHALL provide a "Simple/List View" toggle accessible from the Settings screen in no more than 2 taps from the Universe_View.
2. WHEN Simple_View is enabled, THE App SHALL display all Solar Systems, Suns, and Planets as a hierarchical list with 3 levels of indentation, without any 3D or parallax rendering.
3. WHILE Simple_View is active, THE Animation_Controller SHALL suppress all galaxy-specific transitions; navigation between list items SHALL use instant (0ms) platform transitions.
4. WHEN a user toggles between Simple_View and galaxy view, THE App SHALL persist the preference to the Storage_Engine and restore it before the first render on the next launch.
5. IF Simple_View text elements have a contrast ratio below 4.5:1 for normal text or 3:1 for large text against their backgrounds, THEN THE App SHALL override the element's color to meet WCAG_AA minimums.
6. WHEN a user taps a list item in Simple_View, THE App SHALL navigate to the corresponding Universe_View, Solar_System_View, or Planet_View without animation.

---

### Requirement 13: Accessibility — Contrast and Motion

**User Story:** As a user with visual or motion sensitivity, I want the app to respect my OS accessibility settings, so that I can use Orbinote is comfortably.

#### Acceptance Criteria

1. THE App SHALL read the device's Reduced_Motion accessibility setting at launch and whenever the setting changes while the app is active.
2. WHILE Reduced_Motion is enabled, THE Animation_Controller SHALL disable all parallax, orbit, drift, and fly-to animations globally.
3. WHILE Reduced_Motion is enabled, THE Animation_Controller SHALL use simple opacity-based fade transitions of 200ms duration in place of all motion-based transitions.
4. THE App SHALL render all note body text (`description` fields) with a contrast ratio of at least 4.5:1 against its background color, in compliance with WCAG_AA.
5. THE App SHALL render all UI labels and interactive element labels with a contrast ratio of at least 4.5:1 against their respective backgrounds.
6. WHEN the device's Reduced_Motion setting changes while the app is active, THE Animation_Controller SHALL apply the new setting to all subsequent animations without requiring an app restart.

---

### Requirement 14: Typography and Visual Design

**User Story:** As a user, I want the app to have a consistent holographic visual identity, so that the experience feels polished and immersive.

#### Acceptance Criteria

1. THE App SHALL use Orbitron, Exo 2, or Rajdhani typefaces for all headings and Universe/Solar System/Planet name labels.
2. THE App SHALL use the Inter typeface for all note body text (`description` fields).
3. THE App SHALL use thin-line icon assets with a stroke width of 1–2px and a glow opacity of 0.6–1.0 throughout the UI.
4. WHEN transitioning between screens, THE Animation_Controller SHALL apply ease-in-out easing with a spring overshoot factor between 1.05 and 1.15 over a duration of 250–400ms to simulate a HUD powering on.
5. IF the device's GPU supports OpenGL ES 3.0 or higher, THEN THE App SHALL apply a soft bloom/glow post-processing effect to all glowing UI elements.
6. IF the device does not support GPU-accelerated bloom effects, THEN THE App SHALL render glow as a React Native shadow approximation without post-processing.

---

### Requirement 15: Performance and Rendering

**User Story:** As a user on a mid-range or low-end mobile device, I want the galaxy view to remain responsive, so that the app does not stutter or drain battery excessively.

#### Acceptance Criteria

1. THE App SHALL sustain a minimum of 55 frames per second (no individual frame exceeding 50ms) during idle orbit animations (defined as ≤20 Planets visible with no active user interaction) on devices with a Snapdragon 660-class or Apple A12-class CPU/GPU or higher.
2. WHEN the number of visible Planets exceeds 20, THE App SHALL apply level-of-detail reduction to Planets beyond the 20th-closest to sustain ≥55 fps on the target device class.
3. IF a GPU capability benchmark at launch produces fewer than 30 fps or detects an OpenGL ES version below 3.0, THEN THE App SHALL fall back to Lottie/SVG-based parallax rendering instead of expo-three/react-three-fiber.
4. IF both the primary renderer and the Lottie/SVG fallback fail to initialize, THEN THE App SHALL display a full-screen error message and offer the Simple/List View as an alternative.
5. WHEN the app transitions to the background, THE App SHALL reduce the render loop to 0 fps (pause rendering) within 500ms of backgrounding.
6. THE Storage_Engine SHALL complete all read operations for a single Solar System (Sun + up to 25 Planets) within 200ms on the target device class. IF a read operation exceeds 200ms, THE App SHALL display a loading indicator.

---

### Requirement 16: Settings and Theme Manager Screen

**User Story:** As a user, I want a dedicated settings area to manage themes and app preferences, so that I can customise the app without interrupting my workflow.

#### Acceptance Criteria

1. THE App SHALL provide a Settings screen accessible from the Universe_View navigation in no more than 1 tap.
2. THE Settings screen SHALL include a Theme Manager section listing all available built-in and user-created Themes, with the currently active default theme visually marked.
3. WHEN a user selects a Theme from the Theme Manager as the default, THE Theme_Manager SHALL persist the selection to the Storage_Engine and apply it as the default `themeId` for all subsequently created nodes.
4. THE Settings screen SHALL include a toggle for Simple_View mode, with its current state read from and written to the Storage_Engine.
5. THE Settings screen SHALL include a toggle for AI Search, with its current state read from and written to the Storage_Engine. THE default state of the AI Search toggle SHALL be enabled (on).
6. WHEN AI Search is disabled via Settings, THE AI_Search_Service SHALL perform keyword-only search for all queries without calling the hosted API. WHEN AI Search is disabled, THE AI_Search_Service SHALL NOT generate new embeddings for Planet updates.

---

### Requirement 17: Data Integrity and Error Handling

**User Story:** As a user, I want the app to handle errors gracefully, so that I never lose note data due to unexpected failures.

#### Acceptance Criteria

1. IF the Storage_Engine encounters a write failure, THEN THE App SHALL retain the unsaved content as editable in the UI and display a non-blocking error banner for 5 seconds.
2. IF the Storage_Engine encounters a read failure on launch, THEN THE App SHALL display a full-screen error state with a "Retry" button. IF the retry also fails, THE error state SHALL persist until the failure is resolved.
3. WHEN a user performs a destructive action (delete Universe, Solar System, or Planet), THE App SHALL display a modal confirmation dialog requiring an explicit affirmative action (e.g., tapping a "Delete" button) before executing the deletion.
4. THE Storage_Engine SHALL use database transactions for all multi-record write operations involving Universes, Solar Systems, Suns, Planets, and embeddings, such that either all records in the operation are written or none are.
5. IF a database transaction is interrupted by an app crash, OS kill, or power loss, THEN THE Storage_Engine SHALL roll back the transaction on next launch so that no partial writes are visible to the application.

---

### Requirement 18: First-Launch Onboarding

**User Story:** As a new user, I want a brief guided introduction to the app's spatial metaphor, so that I understand how Universes, Solar Systems, and Planets relate to each other.

#### Acceptance Criteria

1. WHEN the app is launched and the Storage_Engine does not contain an onboarding-completion flag, THE App SHALL display a multi-step onboarding flow of at least 3 steps, one explaining each level of the Universe → Solar System → Planet hierarchy.
2. THE onboarding flow SHALL include an interactive prompt on the Universe step for creating the user's first Universe, and an interactive prompt on the Solar System step for creating the user's first Solar System.
3. WHEN the user completes all onboarding steps, THE App SHALL set the onboarding-completion flag in the Storage_Engine and navigate to the Universe_View. THE onboarding flow SHALL NOT be shown again on subsequent launches.
4. WHEN the user explicitly skips the onboarding flow via a "Skip" action, THE App SHALL set the onboarding-completion flag in the Storage_Engine and navigate to the Universe_View. THE onboarding flow SHALL NOT be shown again on subsequent launches.
5. IF the user navigates away from the onboarding flow without completing or skipping it, THEN THE App SHALL preserve any partial data created during onboarding (Universe and/or Solar System records) and display a persistent "Resume Setup" banner in the Universe_View until the flow is completed or skipped.
6. IF the Storage_Engine contains an onboarding-completion flag on launch, THEN THE App SHALL skip the onboarding flow entirely and navigate directly to the Universe_View.

---

### Requirement 19: Per-Note Color Customization

**User Story:** As a user, I want to assign a custom color to a Planet, Sun, or Solar System note, so that I can visually distinguish notes from one another regardless of the active theme.

#### Acceptance Criteria

1. THE Planet_View SHALL provide a color picker control that allows the user to select a `noteColor` via a free color wheel and a hex code input field (accepting `#RRGGBB` format).
2. THE Sun edit panel SHALL provide the same color picker control for the Sun's `noteColor` field.
3. WHEN a user selects a color via the color wheel or enters a valid hex code, THE App SHALL immediately apply the chosen `noteColor` as a live preview to the note card background and/or text color within the active view before the value is persisted.
4. WHEN a user confirms a `noteColor` selection, THE Storage_Engine SHALL persist the `noteColor` value to the corresponding Planet or Sun record within 300ms.
5. WHEN a Planet's `noteColor` is non-null, THE Planet_View SHALL render the note card background using `noteColor` and adjust the displayed text color to maintain contrast, overriding the active Theme's card background color for that note only.
6. WHEN a Sun's `noteColor` is non-null, THE Sun edit panel SHALL render the panel background using `noteColor`, overriding the active Theme's panel background color for that Sun only.
7. THE `noteColor` override SHALL apply exclusively to the note card layer (card background, body text, subject label) inside the Planet_View and Sun edit panel; the galaxy-view orb color, glow, and particle colors for that node SHALL continue to be governed by the active Theme.
8. WHEN a user clears the `noteColor` (via a "Reset to theme" action in the color picker), THE Storage_Engine SHALL set the `noteColor` field to null for that record within 300ms, and THE App SHALL revert the note card appearance to the active Theme's defaults.
9. IF a user selects a `noteColor` for the note card background that produces a contrast ratio below 4.5:1 against the resulting body text color, THEN THE App SHALL display an inline warning within the color picker indicating the contrast failure, in compliance with WCAG_AA.
10. WHERE a Solar System has a non-null `noteColor`, THE Universe_View SHALL apply that color to the Solar System's name label text and thumbnail card border, overriding the active Theme's equivalent colors for that Solar System thumbnail only.
11. THE Storage_Engine SHALL persist a `noteColor` field (nullable hex string in `#RRGGBB` format) on the Solar System record to support criterion 10.
