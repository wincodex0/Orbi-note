export type ThemeId = 'stark-hologram' | 'minion' | 'cyberpunk' | 'pastel-galaxy';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    background: string;
    primary: string;
    accent: string;
    surface: string;
    text: string;
  };
  glow: string;
  texture?: string;
  particleStyle?: string;
  sound?: string;
}

export interface Universe {
  id: string;
  name: string;
  themeId: ThemeId;
  createdAt: number;
}

export interface SolarSystem {
  id: string;
  universeId: string;
  name: string;
  imageUrl?: string | null;
  themeId: ThemeId;
  noteColor?: string | null;
}

export interface Sun {
  id: string;
  solarSystemId: string;
  title: string;
  description: string;
  themeId: ThemeId;
  noteColor?: string | null;
}

export interface Planet {
  id: string;
  solarSystemId: string;
  name: string;
  subject: string;
  description: string;
  themeId: ThemeId;
  tags: string[];
  orbitIndex: number;
  noteColor?: string | null;
}

export interface Embedding {
  planetId: string;
  vector: Float32Array;
  createdAt: number;
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
