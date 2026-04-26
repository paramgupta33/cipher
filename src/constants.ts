export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export const PEG_COLORS = {
  P1: '#FF3366', // Hot Pink
  P2: '#FF6B35', // Orange
  P3: '#FFD600', // Pure Gold
  P4: '#2EC4B6', // Teal
  P5: '#A259FF', // Purple
  P6: '#00C48C', // Green
  P7: '#0F172A', // Dark Navy
  P8: '#FFFFFF', // White
};

export type PegColorKey = keyof typeof PEG_COLORS;

export const RANKS = [
  { name: 'Iron', minCP: 0, color: '#94A3B8' },
  { name: 'Bronze', minCP: 500, color: '#CD7F32' },
  { name: 'Silver', minCP: 1200, color: '#CBD5E1' },
  { name: 'Gold', minCP: 2500, color: '#FFD600' },
  { name: 'Platinum', minCP: 5000, color: '#A259FF' },
  { name: 'Diamond', minCP: 10000, color: '#2EC4B6' },
];

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    pegs: 4,
    colors: 6,
    guesses: 10,
    winCP: 100,
    drawCP: 20,
    lossCP: -30,
    colorKeys: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as PegColorKey[],
  },
  [Difficulty.MEDIUM]: {
    pegs: 5,
    colors: 7,
    guesses: 10,
    winCP: 250,
    drawCP: 50,
    lossCP: -60,
    colorKeys: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'] as PegColorKey[],
  },
  [Difficulty.HARD]: {
    pegs: 6,
    colors: 8,
    guesses: 12,
    winCP: 500,
    drawCP: 100,
    lossCP: -100,
    colorKeys: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'] as PegColorKey[],
  },
};

export const COLOR_BLIND_SYMBOLS: Record<PegColorKey, string> = {
  P1: '●', // Circle
  P2: '×', // Plus/Cross
  P3: '★', // Star
  P4: '◆', // Diamond
  P5: '⬢', // Hexagon
  P6: '▲', // Triangle
  P7: '■', // Square
  P8: '✚', // Bold Plus
};

// --- Store Constants ---

export interface AvatarItem {
  id: number;
  name: string;
  title: string;
  cost: number;
  color: string;
  svgSeed: string;
}

export const AVATARS: AvatarItem[] = [
  { id: 0, name: 'AGENT ZERO', title: 'Field Operative', cost: 0, color: '#2EC4B6', svgSeed: '1' },
  { id: 1, name: 'VECTOR', title: 'Code Analyst', cost: 300, color: '#FF3366', svgSeed: 'vector' },
  { id: 2, name: 'CIPHER-7', title: 'Ghost Protocol', cost: 500, color: '#A259FF', svgSeed: 'cipher7' },
  { id: 3, name: 'NOVA', title: 'Infiltration Lead', cost: 500, color: '#FF6B35', svgSeed: 'nova' },
  { id: 4, name: 'PHANTOM', title: 'Shadow Division', cost: 750, color: '#0F172A', svgSeed: 'phantom' },
  { id: 5, name: 'ORACLE', title: 'Intel Specialist', cost: 750, color: '#FFD600', svgSeed: 'oracle' },
  { id: 6, name: 'STATIC', title: 'Signal Breaker', cost: 1000, color: '#00C48C', svgSeed: 'static' },
  { id: 7, name: 'NEXUS', title: 'Deep Cover', cost: 1000, color: '#FF3366', svgSeed: 'nexus' },
  { id: 8, name: 'WRAITH', title: 'Black Site Op', cost: 1500, color: '#A259FF', svgSeed: 'wraith' },
  { id: 9, name: 'ECHO', title: 'Pattern Reader', cost: 1500, color: '#2EC4B6', svgSeed: 'echo' },
  { id: 10, name: 'APEX', title: 'Chief Analyst', cost: 2000, color: '#FF6B35', svgSeed: 'apex' },
  { id: 11, name: 'SPECTRE', title: 'Director Level', cost: 3000, color: '#0F172A', svgSeed: 'spectre' },
];

export interface BoardSkin {
  id: number;
  name: string;
  bg: string;
  accent: string;
  borderStyle: string;
  cost: number;
}

export const BOARD_SKINS: BoardSkin[] = [
  { id: 0, name: 'STANDARD', bg: '#ffffff', accent: '#FF3366', borderStyle: '4px solid #0F172A', cost: 0 },
  { id: 1, name: 'REDLINE', bg: '#fff5f5', accent: '#FF3366', borderStyle: '6px solid #FF3366', cost: 800 },
  { id: 2, name: 'GOLDFIELD', bg: '#fffbeb', accent: '#FFD600', borderStyle: '4px double #0F172A', cost: 800 },
  { id: 3, name: 'VOID', bg: '#0F172A', accent: '#A259FF', borderStyle: '4px solid #A259FF', cost: 1200 },
  { id: 4, name: 'ARCTIC', bg: '#f0f9ff', accent: '#2EC4B6', borderStyle: '4px dashed #2EC4B6', cost: 1200 },
  { id: 5, name: 'CIRCUIT', bg: '#f8f8f8', accent: '#00C48C', borderStyle: '4px dotted #0F172A', cost: 1500 },
];

export interface PegSet {
  id: number;
  name: string;
  colors: string[];
  cost: number;
}

export const PEG_SETS: PegSet[] = [
  { id: 0, name: 'STANDARD', colors: ['#FF3366', '#FF6B35', '#FFD600', '#2EC4B6', '#A259FF', '#00C48C'], cost: 0 },
  { id: 1, name: 'PASTEL OPS', colors: ['#FFB3C6', '#FFCBA4', '#FFF3A3', '#B3EDE8', '#D4BBFF', '#A8F0D8'], cost: 600 },
  { id: 2, name: 'MONOCHROME', colors: ['#0F172A', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F9FAFB'], cost: 600 },
  { id: 3, name: 'NEON BURN', colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06D6A0'], cost: 1000 },
  { id: 4, name: 'EARTH CODE', colors: ['#7C4F2A', '#B5651D', '#D4A853', '#6B8E4E', '#5B7FA6', '#8B7355'], cost: 1000 },
  { id: 5, name: 'CANDY CYPH', colors: ['#FF69B4', '#FF8C42', '#FFE66D', '#7BC8C8', '#C77DFF', '#70EFA3'], cost: 800 },
];

export interface Badge {
  id: number;
  name: string;
  type: 'earned' | 'purchase';
  condition?: string;
  cost?: number;
  icon: string;
}

export const BADGES: Badge[] = [
  { id: 0, name: 'FIRST BREACH', type: 'earned', condition: 'Win your first game', icon: '🔓' },
  { id: 1, name: 'IRON WALL', type: 'earned', condition: '10-game win streak', icon: '🛡️' },
  { id: 2, name: 'SPEED CIPHER', type: 'earned', condition: 'Win in <60 seconds', icon: '⚡' },
  { id: 3, name: 'CODE GHOST', type: 'purchase', cost: 800, icon: '👻' },
  { id: 4, name: 'ANALYST', type: 'purchase', cost: 1200, icon: '🔍' },
  { id: 5, name: 'BLACK OPS', type: 'purchase', cost: 2000, icon: '⭐' },
  { id: 7, name: 'DAILY GRIND', type: 'earned', condition: 'Complete 30 daily tasks', icon: '📅' },
];

// --- Daily Tasks ---

export interface DailyTask {
  id: string;
  name: string;
  description: string;
  reward: number;
  type: 'easy' | 'medium' | 'hard' | 'bonus';
  target: number;
}

export const MASTER_TASKS: Record<string, DailyTask> = {
  T01: { id: 'T01', name: 'FIRST OPERATIVE', description: 'Log in today', reward: 50, type: 'easy', target: 1 },
  T02: { id: 'T02', name: 'WARM UP', description: 'Play any game', reward: 50, type: 'easy', target: 1 },
  T03: { id: 'T03', name: 'PEG SPOTTER', description: 'Make 20 total guesses today', reward: 50, type: 'easy', target: 20 },
  T04: { id: 'T04', name: 'COLOUR SENSE', description: 'Use all 6 peg colours in one row', reward: 50, type: 'easy', target: 1 },
  T05: { id: 'T05', name: 'OPENER', description: 'First guess in under 10 seconds', reward: 50, type: 'easy', target: 1 },
  
  T06: { id: 'T06', name: 'BREACH', description: 'Win any game', reward: 100, type: 'medium', target: 1 },
  T07: { id: 'T07', name: 'DOUBLE TAP', description: 'Win 2 games today', reward: 100, type: 'medium', target: 2 },
  T08: { id: 'T08', name: 'SPEED RUN', description: 'Win a game in under 90 seconds', reward: 100, type: 'medium', target: 1 },
  T09: { id: 'T09', name: 'EASY MONEY', description: 'Win Easy in 4 guesses or fewer', reward: 100, type: 'medium', target: 1 },
  T10: { id: 'T10', name: 'NO HINTS', description: 'Win a game without hints', reward: 100, type: 'medium', target: 1 },
  T11: { id: 'T11', name: 'RESILIENT', description: 'Play 3 games today', reward: 100, type: 'medium', target: 3 },
  T12: { id: 'T12', name: 'MEDIUM TESTED', description: 'Complete a Medium game', reward: 100, type: 'medium', target: 1 },
  
  T13: { id: 'T13', name: 'HARD MODE', description: 'Win a Hard game', reward: 150, type: 'hard', target: 1 },
  T14: { id: 'T14', name: 'CIPHER MASTER', description: 'Win Medium in 3 guesses or fewer', reward: 150, type: 'hard', target: 1 },
  T15: { id: 'T15', name: 'IRON MIND', description: 'Win Hard in 4 guesses or fewer', reward: 150, type: 'hard', target: 1 },
  T16: { id: 'T16', name: 'FLAWLESS', description: 'Win 3 games in a row', reward: 150, type: 'hard', target: 3 },
  T17: { id: 'T17', name: 'GHOST PROTOCOL', description: 'Win without backtracking (no removals)', reward: 150, type: 'hard', target: 1 },
};
