# Orbi-note

# Orbinote

Your notes, in orbit.

Orbinote is a mobile note-taking app that turns your notes into a navigable
universe. Instead of folders and lists, your ideas live as planets orbiting
a sun, grouped into solar systems, floating inside universes — rendered in
a glowing, Stark-hologram-style interface.

## Concept

- Universe — a workspace/notebook (top-level container)
- Solar System — a topic or project, shown with a picture and name
- Sun — the main subject/topic of that solar system
- Planets — individual notes orbiting the Sun, each with a name,
  subject/title, and description

Every level — Universe, Solar System, and Planet — can be visually
customized with its own theme (colors, glow effects, icons/textures).

## Core Features

- 3D-styled galaxy navigation — zoom from Universe to Solar System to
  Planet with smooth camera transitions
- Per-level theming — customize the look of any universe, solar system,
  or planet independently
- AI-powered search — find notes by keyword or by meaning (semantic
  search), visualized as a radar sweep that locates and flies the camera
  to the matching planet
- Offline-first — all notes are stored locally, no account required for v1
- Accessible list view — flatten the galaxy into a standard list/tree view
  for fast editing or low-end devices

## Tech Stack

| Layer | Choice |
|---|---|
| App shell | React Native + Expo |
| 3D / pseudo-3D rendering | React Three Fiber (expo-three), with a 2.5D fallback for lower-end devices |
| Local storage | SQLite (expo-sqlite) / WatermelonDB |
| Semantic search | Local embedding comparison (cosine similarity) over note text |
| AI Q&A / search assistant | Free-tier hosted API (e.g. Google Gemini, Groq, Hugging Face Inference, or OpenRouter), with fallback to keyword search when quota is reached |

## Data Model (draft)

```
Universe     { id, name, themeId, createdAt }
SolarSystem  { id, universeId, name, imageUrl, themeId }
Sun          { id, solarSystemId, title, description, themeId }
Planet       { id, solarSystemId, name, subject, description, themeId, orbitIndex }
Theme        { id, name, colors, glow, texture, particleStyle, sound? }
```

## Design Language

- Palette: near-black navy background, electric-blue glowing lines, amber
  accent for the Sun, soft violet UI accents
- Typography: futuristic geometric sans for headers, clean readable sans
  for note body text
- Motion: HUD-style easing with slight overshoot — nothing snaps instantly
- Theme packs: ship with presets (default "Stark Hologram," plus
  alternates like "Minion" and "Cyberpunk"), each swappable live

## Status

Currently in the planning/specification stage. Scope for v1:

- [ ] Core hierarchy (Universe -> Solar System -> Sun -> Planets)
- [ ] Local/offline storage
- [ ] 2.5D galaxy navigation UI
- [ ] Basic theming system
- [ ] Keyword + semantic search
- [ ] AI assistant search animation
- [ ] Cloud sync (planned for v2)

## License

TBD
