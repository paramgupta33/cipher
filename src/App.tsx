/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Brain, 
  Gamepad2, 
  LogOut, 
  ChevronRight, 
  Clock, 
  Info, 
  Zap,
  Star,
  Settings,
  Eye,
  EyeOff,
  ShoppingBag,
  ClipboardList,
  ClipboardCheck,
  Unlock,
  Calendar,
  Search,
  Ghost,
  Shield,
  Zap as Lightning,
  Moon,
  Sun,
  Flag,
  Check,
  X,
  Menu
} from 'lucide-react';
import { 
  Difficulty, 
  PEG_COLORS, 
  PegColorKey, 
  RANKS, 
  DIFFICULTY_CONFIG, 
  COLOR_BLIND_SYMBOLS,
  AVATARS,
  BOARD_SKINS,
  PEG_SETS,
  BADGES,
  MASTER_TASKS,
  DailyTask,
  AvatarItem,
  BoardSkin,
  PegSet,
  Badge
} from './constants.ts';

// --- Types ---
type View = 'loading' | 'auth' | 'landing' | 'game' | 'leaderboard' | 'friends' | 'ai' | 'store' | 'daily' | 'profile';

type User = {
  username: string;
  avatar: string;
  cp: number;
  rank: string;
  rankIndex: number;
  id: string;
  title: string;
};

interface ProfileStats {
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  bestStreak: number;
  avgGuesses: number;
  fastestWin: number;
  gamesPlayed: number;
  hintsUsed: number;
  byDifficulty: {
    easy: DifficultyStats;
    medium: DifficultyStats;
    hard: DifficultyStats;
  };
}

interface DifficultyStats {
  wins: number;
  losses: number;
  draws: number;
  bestTime: number;
  avgGuesses: number;
}

interface TodayStats {
  loggedIn: boolean;
  gamesPlayed: number;
  wins: number;
  totalGuesses: number;
  fastWin: boolean;
  noHintWin: boolean;
  hardWin: boolean;
  mediumPlayed: boolean;
  easyWinFewGuesses: boolean;
  mediumWinFewGuesses: boolean;
  hardWinFewGuesses: boolean;
  noRemovals: boolean;
  allColoursUsedInRow: boolean;
  firstGuessFast: boolean;
  aiBeatToday: boolean;
  flawlessStreak: number;
  guesses: number;
  time: number;
  removals: number;
}

interface DailyTaskState {
  taskId: string;
  status: 'active' | 'completed' | 'claimed' | 'locked';
  progress: number;
}

interface StoreOwned {
  avatars: number[];
  skins: number[];
  pegSets: number[];
  badges: number[];
}

interface StoreEquipped {
  avatarId: number;
  skinId: number;
  pegSetId: number;
  badgeId: number | null;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

// --- Utils ---
const getStorageKey = (username: string, key: string) => `cipher_${username}_${key}`;

const getRankInfo = (cp: number) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (cp >= RANKS[i].minCP) return { ...RANKS[i], index: i };
  }
  return { ...RANKS[0], index: 0 };
};

const getDailyTasksSeeded = (dateStr: string): DailyTask[] => {
  const seed = parseInt(dateStr.replace(/-/g, ''));
  const easyIds = ['T01', 'T02', 'T03', 'T04', 'T05'];
  const medIds = ['T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12'];
  const hardIds = ['T13', 'T14', 'T15', 'T16', 'T17'];

  const pick = (pool: string[], offset: number) => MASTER_TASKS[pool[(seed + offset) % pool.length]];

  return [
    pick(easyIds, 0),
    pick(easyIds, 1),
    pick(medIds, 0),
    pick(medIds, 3),
    pick(hardIds, 0),
  ];
};

// --- Components (Atoms) ---

const NeoButton = ({ children, onClick, className = '', color = 'hot-pink', disabled = false, icon: Icon, draggable, onDragStart }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string, 
  color?: string,
  disabled?: boolean,
  icon?: React.ElementType,
  draggable?: boolean,
  onDragStart?: (e: React.DragEvent) => void
}) => {
  const colorMap: Record<string, string> = {
    'hot-pink': 'bg-hot-pink',
    'orange': 'bg-orange',
    'gold': 'bg-gold',
    'teal': 'bg-teal',
    'purple': 'bg-purple',
    'green': 'bg-green',
    'navy': 'bg-navy text-white',
    'white': 'bg-surface text-primary',
  };

  return (
    <motion.button
      draggable={draggable}
      onDragStart={onDragStart}
      whileHover={!disabled ? { x: -4, y: -4, boxShadow: '12px 12px 0px var(--shadow)' } : {}}
      whileTap={!disabled ? { x: 0, y: 0, boxShadow: '4px 4px 0px var(--shadow)' } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`neo-border neo-shadow px-6 py-3 font-display text-xl uppercase tracking-wider flex items-center justify-center gap-3 transition-colors ${colorMap[color] || 'bg-hot-pink'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={color === 'white' ? { backgroundColor: 'var(--surface)' } : {}}
    >
      {Icon && <Icon className="w-6 h-6" />}
      {children}
    </motion.button>
  );
};

const NeoInput = ({ label, type = 'text', placeholder, value, onChange }: {
  label: string,
  type?: string,
  placeholder?: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="font-slab text-sm uppercase font-bold text-primary">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="neo-border p-4 font-sans text-lg focus:outline-none focus:border-l-[6px] focus:border-hot-pink transition-all bg-input-bg text-primary border-[var(--border)]"
      style={{ backgroundColor: 'var(--input-bg)' }}
    />
  </div>
);

const Peg = ({ colorKey, size = 'md', selected = false, symbolMode = false, className = '' }: { 
  colorKey: PegColorKey, 
  size?: 'sm' | 'md' | 'lg',
  selected?: boolean,
  symbolMode?: boolean,
  className?: string,
  key?: React.Key
}) => {
  const sizeMap = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-12 h-12' };
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      style={{ backgroundColor: PEG_COLORS[colorKey] }}
      className={`rounded-full neo-border neo-shadow relative flex items-center justify-center ${sizeMap[size]} ${selected ? 'ring-4 ring-hot-pink' : ''} ${className}`}
    >
      <div className="absolute top-1 left-1 w-[30%] h-[30%] bg-white opacity-30 rounded-full" />
      {symbolMode && (
        <span className={`font-bold select-none ${colorKey === 'P7' ? 'text-white' : 'text-primary'}`}>
          {COLOR_BLIND_SYMBOLS[colorKey]}
        </span>
      )}
    </motion.div>
  );
};

// --- AI Logic: Knuth Solver ---
class KnuthSolver {
  private possibleCodes: PegColorKey[][];
  private allPossibleCodes: PegColorKey[][];
  private colorKeys: PegColorKey[];
  private pegs: number;

  constructor(pegs: number, colorKeys: PegColorKey[]) {
    this.pegs = pegs;
    this.colorKeys = colorKeys;
    this.possibleCodes = this.generateAllCodes();
    this.allPossibleCodes = [...this.possibleCodes];
  }

  private generateAllCodes(): PegColorKey[][] {
    const results: PegColorKey[][] = [];
    const colorCount = this.colorKeys.length;
    const total = Math.pow(colorCount, this.pegs);
    
    // For large boards, we might want to cap this or use a different strategy
    // but for 6 pegs / 6 colors (46656), it's manageable in memory.
    for (let i = 0; i < total; i++) {
        const code: PegColorKey[] = [];
        let temp = i;
        for (let j = 0; j < this.pegs; j++) {
            code.push(this.colorKeys[temp % colorCount]);
            temp = Math.floor(temp / colorCount);
        }
        results.push(code);
    }
    return results;
  }

  private getFeedback(guess: PegColorKey[], secret: PegColorKey[]) {
    let exact = 0;
    let partial = 0;
    const g = [...guess];
    const s = [...secret];
    
    for (let i = 0; i < this.pegs; i++) {
      if (g[i] === s[i]) {
        exact++;
        g[i] = null as any;
        s[i] = null as any;
      }
    }
    
    for (let i = 0; i < this.pegs; i++) {
      if (g[i] !== null) {
        const idx = s.indexOf(g[i]);
        if (idx !== -1) {
          partial++;
          s[idx] = null as any;
        }
      }
    }
    return { exact, partial };
  }

  public getFirstGuess(): PegColorKey[] {
    // Knuth's classic first guess for 4 holes is 1122
    if (this.pegs === 4) return [this.colorKeys[0], this.colorKeys[0], this.colorKeys[1], this.colorKeys[1]];
    // For 5 holes: 11223
    if (this.pegs === 5) return [this.colorKeys[0], this.colorKeys[0], this.colorKeys[1], this.colorKeys[1], this.colorKeys[2]];
    // For 6 holes: 112233
    return [this.colorKeys[0], this.colorKeys[0], this.colorKeys[1], this.colorKeys[1], this.colorKeys[2], this.colorKeys[2]];
  }

  public update(lastGuess: PegColorKey[], feedback: { exact: number, partial: number }) {
    this.possibleCodes = this.possibleCodes.filter(code => {
      const resp = this.getFeedback(lastGuess, code);
      return resp.exact === feedback.exact && resp.partial === feedback.partial;
    });
  }

  public getNextGuess(): PegColorKey[] {
    if (this.possibleCodes.length === 1) return this.possibleCodes[0];
    
    // Minimax simplified: pick a random code from the current possible set
    // For true Knuth, we scan all possible codes (even those not in possibleCodes)
    // and pick the one that minimizes the max number of remaining possible codes.
    // However, JS performance for 46k iterations * possibleCodes.length can be slow.
    // We'll use a heuristic: pick from possibleCodes with a tiny bit of lookahead or just random for speed.
    return this.possibleCodes[Math.floor(Math.random() * this.possibleCodes.length)];
  }
}

// --- Page: AI Lab ---
const AILabPage = ({ onChallenge, onBack }: { onChallenge: (difficulty: Difficulty) => void, onBack: () => void }) => {
  const levels = [
    { 
      id: Difficulty.EASY, 
      name: 'ROOKIE', 
      label: 'BASIC PROTOCOL', 
      color: 'bg-teal', 
      desc: 'Pattern recognition sub-routine active.',
      reward: 100 
    },
    { 
      id: Difficulty.MEDIUM, 
      name: 'FIELD AGENT', 
      label: 'ENHANCED LOGIC', 
      color: 'bg-orange', 
      desc: 'Neural net weights optimized for 5-peg ciphers.',
      reward: 250 
    },
    { 
      id: Difficulty.HARD, 
      name: 'BLACK OPS CIPHER', 
      label: 'ELITE QUANTUM', 
      color: 'bg-purple', 
      desc: 'Top-secret encryption solver. Virtually unbeatable.',
      reward: 500 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-12 pb-32"
    >
      <div className="flex justify-between items-end border-b-8 border-[var(--border)] pb-4" style={{ borderBottomColor: 'var(--border)' }}>
        <div>
          <h1 className="font-display text-5xl md:text-7xl tracking-tighter uppercase text-primary">AI LAB</h1>
          <p className="font-mono text-sm uppercase opacity-60">TEST YOUR SPEED AGAINST THE MACHINE</p>
        </div>
        <NeoButton color="white" onClick={onBack}>EXIT</NeoButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {levels.map(l => (
          <motion.div 
            key={l.id} 
            whileHover={{ y: -8 }}
            className="bg-surface neo-border neo-shadow flex flex-col group overflow-hidden border-[var(--border)]"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <div className={`${l.color} h-32 flex items-center justify-center border-b-4 border-primary`} style={{ borderBottomColor: 'var(--border)' }}>
              <h3 className="font-display text-5xl text-white uppercase tracking-tighter">{l.name}</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col space-y-4">
              <div className="space-y-1">
                 <span className="font-slab text-xs font-black text-primary opacity-40 uppercase tracking-widest">{l.label}</span>
                 <p className="font-sans text-lg text-primary">{l.desc}</p>
              </div>
              <div className="pt-4 border-t-2 border-primary/10 mt-auto">
                 <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-xl font-black text-primary">+{l.reward} CP</span>
                    <span className="font-slab text-[10px] uppercase text-teal">MIN SPEED: FAST</span>
                 </div>
                 <NeoButton 
                   color="navy" 
                   className="w-full text-base py-3" 
                   onClick={() => onChallenge(l.id)}
                 >
                   [ CHALLENGE ]
                 </NeoButton>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-navy p-8 neo-border neo-shadow text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10"><Brain className="w-32 h-32" /></div>
         <div className="relative z-10 space-y-4">
            <h4 className="font-display text-3xl uppercase tracking-tighter">MACHINE VS MAN</h4>
            <p className="font-slab text-lg max-w-2xl opacity-80">
              The AI Lab clones the operative's neural signatures for combat testing. Unlike normal operations,
              AI challenges are synchronous — the solver makes a move every time you do. Winners are determined
              by whoever cracks the code in fewer rounds or faster time.
            </p>
         </div>
      </div>
    </motion.div>
  );
};

// --- Page 1: Loading ---
const LoadingScreen = ({ onComplete }: { onComplete: () => void, key?: React.Key }) => {
  const [progress, setProgress] = useState(0);
  const [copyIndex, setCopyIndex] = useState(0);
  const loadingPhrases = ["Shuffling pegs...", "Building the board...", "Ready to crack."];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    const phraseTimer = setInterval(() => {
      setCopyIndex(i => (i + 1) % loadingPhrases.length);
    }, 1000);
    return () => { 
      clearInterval(timer); 
      clearInterval(phraseTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg p-8" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Background shapes */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [5, 15, 5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-20 w-64 h-64 bg-hot-pink neo-border opacity-20 -z-10"
      />
      <motion.div 
        animate={{ y: [0, 20, 0], rotate: [-10, 0, -10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-20 w-80 h-80 bg-teal neo-border opacity-20 -z-10"
      />

      <motion.div 
        initial={{ scale: 0.8, rotate: 2, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-7xl md:text-9xl text-stroke leading-[0.9] tracking-tighter uppercase mb-4">PROJECT</h1>
        <h1 className="font-display text-7xl md:text-9xl text-orange leading-[0.9] tracking-tighter uppercase">CIPHER</h1>
      </motion.div>

      <div className="w-full max-w-md">
        <p className="font-mono text-center mb-2 uppercase font-bold text-primary">{loadingPhrases[copyIndex]} {progress}%</p>
        <div className="h-4 w-full bg-surface neo-border p-1" style={{ backgroundColor: 'var(--surface)' }}>
          <motion.div 
            className="h-full bg-hot-pink"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="fixed bottom-0 w-full overflow-hidden bg-navy py-4 border-y-4 border-orange">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap"
        >
          {Array(10).fill(null).map((_, i) => (
            <span key={i} className="text-white font-display text-2xl uppercase font-black">
              PROJECT CIPHER ★ CRACK THE CODE ★ 10 GUESSES ★ INITIALIZING...
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// --- Report System ---
const ReportModal = ({ targetUsername, onClose, onSubmit }: { targetUsername: string, onClose: () => void, onSubmit: (report: any) => void }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Cheating / Hacking',
    'Harassment',
    'Inappropriate Username',
    'Boosting / Stat Manipulation',
    'Other'
  ];

  const handleSend = () => {
    if (!reason) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({ reason, details, reportedUsername: targetUsername });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-x-0 bottom-0 z-[100] p-4 flex justify-center"
    >
      <div className="w-full max-w-2xl bg-surface neo-border neo-shadow p-8 space-y-6">
        <div className="flex justify-between items-center border-b-4 border-[var(--border)] pb-2" style={{ borderBottomColor: 'var(--border)' }}>
          <h2 className="font-display text-3xl uppercase tracking-tighter text-primary">REPORT OPERATIVE</h2>
          <button onClick={onClose} className="font-display text-sm uppercase opacity-40 hover:opacity-100 italic">CANCEL</button>
        </div>
        <p className="font-slab text-lg text-primary">Reporting: <span className="text-hot-pink font-black">{targetUsername}</span></p>
        
        <div className="space-y-4">
           <label className="font-display text-sm uppercase tracking-wider text-muted">SELECT REASON:</label>
           <div className="flex flex-wrap gap-3">
              {reasons.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`px-4 py-2 neo-border font-display text-sm uppercase transition-all ${reason === r ? 'bg-hot-pink text-white border-hot-pink font-black' : 'bg-surface text-primary'}`}
                >
                  {r}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <label className="font-display text-sm uppercase tracking-wider text-muted">OPTIONAL: ADD DETAILS...</label>
           <textarea 
             value={details}
             onChange={(e) => setDetails(e.target.value)}
             className="w-full h-32 neo-border p-4 font-sans text-primary bg-surface resize-none focus:outline-none"
             placeholder="Explain the violation..."
           />
        </div>

        <NeoButton 
          disabled={!reason || isSubmitting}
          color="hot-pink"
          onClick={handleSend}
          className="w-full"
        >
          {isSubmitting ? "SUBMITTING..." : "SUBMIT REPORT"}
        </NeoButton>
      </div>
    </motion.div>
  );
};
const CountUp = ({ end, duration = 1000, prefix = '', suffix = '' }: { end: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const ProfilePage = ({ user, stats, ownedAvatars, onBack, onUpdateAvatar, equippedAvatarId }: {
  user: User,
  stats: ProfileStats,
  ownedAvatars: number[],
  onBack: () => void,
  onUpdateAvatar: (url: string, id: number) => void,
  equippedAvatarId: number
}) => {
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const rankInfo = getRankInfo(user.cp);
  const nextRank = RANKS[rankInfo.index + 1] || rankInfo;
  const progress = rankInfo.index === RANKS.length - 1 ? 100 : ((user.cp - rankInfo.minCP) / (nextRank.minCP - rankInfo.minCP)) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-bg p-4 md:p-6 max-w-6xl mx-auto space-y-8 pb-32"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b-8 border-[var(--border)] pb-4 gap-4" style={{ borderBottomColor: 'var(--border)' }}>
        <h1 className="font-display text-4xl md:text-6xl tracking-tighter uppercase text-primary text-center md:text-left leading-none">OPERATIVE PROFILE</h1>
        <NeoButton color="white" icon={LogOut} onClick={onBack} className="w-full md:w-auto h-12">BACK</NeoButton>
      </div>

      <div className="bg-surface neo-border neo-shadow p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="w-32 h-32 md:w-40 md:h-40 neo-border neo-shadow overflow-hidden bg-slate-100 md:rotate-[-3deg] relative" style={{ borderColor: rankInfo.color }}>
          <img src={user.avatar} alt="avatar" className="w-full h-full p-2" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-4 w-full">
          <div>
            <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tighter leading-none text-primary break-all">{user.username}</h2>
            <p className="font-slab text-xl uppercase text-teal font-black">{user.title}</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className="neo-border px-4 py-2 flex items-center gap-2 bg-surface justify-center border-[var(--border)] w-full md:w-auto" style={{ borderLeftColor: rankInfo.color, borderLeftWidth: '12px', backgroundColor: 'var(--surface)' }}>
                <Trophy className="w-5 h-5" style={{ color: rankInfo.color }} />
                <span className="font-display text-xl uppercase font-black text-primary">{rankInfo.name}</span>
             </div>
          </div>
          <NeoButton color="teal" onClick={() => setShowAvatarSelector(!showAvatarSelector)} className="text-sm w-full md:w-auto min-h-[44px]">EDIT IDENTITY</NeoButton>
        </div>
      </div>

      {/* Avatar Selector Panel */}
      <AnimatePresence>
        {showAvatarSelector && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface neo-border neo-shadow p-6 md:p-8 space-y-6 mt-4">
               <h3 className="font-display text-2xl md:text-3xl uppercase tracking-tighter text-primary">SELECT IDENTITY MASK</h3>
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
                  {AVATARS.map((av) => {
                    const isOwned = ownedAvatars.includes(av.id);
                    const isActive = equippedAvatarId === av.id;
                    return (
                      <div 
                        key={av.id}
                        onClick={() => isOwned && onUpdateAvatar(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${av.svgSeed}`, av.id)}
                        className={`neo-border p-2 relative cursor-pointer group transition-all ${isOwned ? 'bg-surface' : 'bg-surface-alt opacity-40 grayscale'} ${isActive ? 'ring-4 ring-hot-pink border-hot-pink' : 'hover:scale-105'} border-[var(--border)]`}
                        style={{ backgroundColor: isOwned ? 'var(--surface)' : 'var(--surface-alt)' }}
                      >
                        {isActive && (
                           <div className="absolute top-0 right-0 bg-hot-pink text-white text-[8px] font-bold px-1 py-0.5 z-10 rotate-12">ACTIVE</div>
                        )}
                        {!isOwned && <div className="absolute inset-0 flex items-center justify-center z-10">🔒</div>}
                        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${av.svgSeed}`} alt={av.name} className="w-full h-full" />
                        {!isOwned && (
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-navy/80">
                              <span className="text-white text-[8px] font-display uppercase p-1 text-center">Unlock in STORE</span>
                           </div>
                        )}
                      </div>
                    );
                  })}
               </div>
               <NeoButton color="white" onClick={() => setShowAvatarSelector(false)} className="w-full text-sm">CLOSE SELECTOR</NeoButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 - RECORD */}
        <div className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4">
          <h3 className="font-display text-2xl uppercase tracking-tighter text-primary">TOTAL RECORD</h3>
          <div className="h-0.5 bg-border w-full opacity-20" />
          <div className="font-mono text-4xl font-black text-primary flex gap-4">
            <span className="text-green"><CountUp end={stats.wins} suffix="W" /></span>
            <span className="text-hot-pink"><CountUp end={stats.losses} suffix="L" /></span>
            <span className="text-orange"><CountUp end={stats.draws} suffix="D" /></span>
          </div>
          <div className="mt-4 space-y-2">
             <div className="flex justify-between items-center bg-gold/20 p-2 neo-border">
                <span className="font-slab text-sm uppercase">WIN RATE</span>
                <span className="font-mono font-bold text-lg">{stats.winRate}%</span>
             </div>
             <div className="flex justify-between items-center bg-teal/20 p-2 neo-border">
                <span className="font-slab text-sm uppercase">BEST STREAK</span>
                <span className="font-mono font-bold text-lg">{stats.bestStreak}W</span>
             </div>
          </div>
        </div>

        {/* Card 2 - CP & RANK */}
        <div className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4">
          <h3 className="font-display text-2xl uppercase tracking-tighter text-primary">CIPHER POINTS</h3>
          <div className="h-0.5 bg-border w-full opacity-20" />
          <div className="font-mono text-4xl font-black text-gold">
            ◆ <CountUp end={user.cp} suffix=" CP" />
          </div>
          <div className="mt-4 space-y-2">
             <div className="flex justify-between items-center p-2 neo-border" style={{ borderLeftColor: rankInfo.color, borderLeftWidth: '8px' }}>
                <span className="font-slab text-sm uppercase">RANK: {rankInfo.name}</span>
                <span className="font-mono font-bold text-lg">{Math.round(progress)}%</span>
             </div>
             <div className="w-full h-4 bg-slate-100 neo-border p-1">
                <div className="h-full" style={{ width: `${progress}%`, backgroundColor: rankInfo.color }} />
             </div>
             <p className="text-muted text-[10px] uppercase font-mono text-right">
                {rankInfo.index === RANKS.length - 1 ? 'MAX RANK ACHIEVED' : `${(nextRank.minCP - user.cp).toLocaleString()} CP TO NEXT`}
             </p>
          </div>
        </div>

        {/* Card 3 - PERFORMANCE */}
        <div className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4">
          <h3 className="font-display text-2xl uppercase tracking-tighter text-primary">PERFORMANCE</h3>
          <div className="h-0.5 bg-border w-full opacity-20" />
          <div className="space-y-4 pt-2">
             <div className="flex justify-between items-center">
                <span className="font-slab text-sm uppercase opacity-60">AVG GUESSES</span>
                <span className="font-mono text-xl font-bold">{stats.avgGuesses.toFixed(1)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="font-slab text-sm uppercase opacity-60">FASTEST WIN</span>
                <span className="font-mono text-xl font-bold">{Math.floor(stats.fastestWin / 60)}:{(stats.fastestWin % 60).toString().padStart(2, '0')}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="font-slab text-sm uppercase opacity-60">GAMES PLAYED</span>
                <span className="font-mono text-xl font-bold">{stats.gamesPlayed}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="font-slab text-sm uppercase opacity-60">HINTS USED</span>
                <span className="font-mono text-xl font-bold">{stats.hintsUsed}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
         {Object.entries(stats.byDifficulty).map(([diff, dStats]) => {
           const color = diff === 'easy' ? 'bg-teal' : diff === 'medium' ? 'bg-orange' : 'bg-purple';
           const winRate = dStats.wins + dStats.losses + dStats.draws > 0 
             ? Math.round((dStats.wins / (dStats.wins + dStats.losses + dStats.draws)) * 100)
             : 0;
           return (
             <div key={diff} className="bg-surface neo-border neo-shadow overflow-hidden">
               <div className={`${color} p-2 text-center`}>
                  <h4 className="font-display text-xl text-white uppercase tracking-tighter">{diff}</h4>
               </div>
               <div className="p-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                     <span className="opacity-40 uppercase">W/L/D</span>
                     <span className="font-bold">{dStats.wins}/{dStats.losses}/{dStats.draws}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="opacity-40 uppercase">WIN RATE</span>
                     <span className="font-bold">{winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="opacity-40 uppercase">BEST TIME</span>
                     <span className="font-bold">{Math.floor(dStats.bestTime / 60)}:{(dStats.bestTime % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="opacity-40 uppercase">AVG GUESSES</span>
                     <span className="font-bold">{dStats.avgGuesses.toFixed(1)}</span>
                  </div>
               </div>
             </div>
           );
         })}
      </div>
    </motion.div>
  );
};
const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const avatars = [
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=1',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=2',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=3',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=4',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=5',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=6',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=7',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=8',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=9'
  ];

  const handleAuth = () => {
    setError('');
    
    if (!username || !email || !password || (tab === 'signup' && !confirmPassword)) {
      setError("ALL FIELDS REQUIRED");
      return;
    }

    if (tab === 'signup' && password !== confirmPassword) {
      setError("ACCESS CODES DO NOT MATCH");
      return;
    }

    if (tab === 'signup' && password.length < 6) {
      setError("ACCESS CODE TOO SHORT (MIN 6)");
      return;
    }

    if (!email.includes("@")) {
      setError("INVALID CHANNEL FORMAT");
      return;
    }

    const accountsStr = localStorage.getItem('cipher_accounts');
    const accounts = accountsStr ? JSON.parse(accountsStr) : {};

    if (tab === 'signup') {
      if (accounts[username]) {
        setError("OPERATIVE HANDLE TAKEN");
        return;
      }
      accounts[username] = {
        email,
        passwordHash: btoa(password),
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('cipher_accounts', JSON.stringify(accounts));
    } else {
      const account = accounts[username];
      if (!account) {
        setError("OPERATIVE NOT FOUND");
        return;
      }
      if (account.passwordHash !== btoa(password)) {
        setError("INVALID ACCESS CODE");
        return;
      }
    }

    const rankInfo = getRankInfo(0);
    onLogin({
      username,
      avatar: avatars[selectedAvatar],
      cp: 500,
      rank: rankInfo.name,
      rankIndex: rankInfo.index,
      id: Math.random().toString(36).substr(2, 9),
      title: 'Field Operative'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-12 items-center">
        {/* Decorative Grid */}
        <div className="hidden lg:flex lg:w-1/2 justify-center">
          <motion.div 
            initial={{ rotate: -5, opacity: 0 }}
            animate={{ rotate: -2, opacity: 1 }}
            className="grid grid-cols-4 gap-6 p-12 bg-surface neo-border neo-shadow border-[var(--border)]"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            {Object.keys(PEG_COLORS).map((k) => (
              <Peg key={k} colorKey={k as PegColorKey} size="lg" />
            ))}
            {Object.keys(PEG_COLORS).map((k) => (
              <Peg key={`dup-${k}`} colorKey={k as PegColorKey} size="lg" />
            ))}
          </motion.div>
        </div>

        {/* Auth Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full lg:w-1/2 bg-surface neo-border neo-shadow p-6 md:p-12 border-[var(--border)]"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-3 neo-border font-display text-xl uppercase tracking-tighter transition-colors border-[var(--border)] ${tab === 'login' ? 'bg-hot-pink text-white neo-shadow' : 'bg-transparent text-primary'}`}
              style={{ boxShadow: tab === 'login' ? '8px 8px 0px var(--shadow)' : 'none' }}
            >
              LOGIN
            </button>
            <button 
              onClick={() => { setTab('signup'); setError(''); }}
              className={`flex-1 py-3 neo-border font-display text-xl uppercase tracking-tighter transition-colors border-[var(--border)] ${tab === 'signup' ? 'bg-hot-pink text-white neo-shadow' : 'bg-transparent text-primary'}`}
              style={{ boxShadow: tab === 'signup' ? '8px 8px 0px var(--shadow)' : 'none' }}
            >
              SIGNUP
            </button>
          </div>

          {error && (
            <div className="bg-hot-pink text-white p-3 font-mono text-sm mb-6 neo-border border-[var(--border)]">
              [ ERROR: {error} ]
            </div>
          )}

          <div className="space-y-6">
            <NeoInput 
              label="OPERATIVE HANDLE" 
              placeholder="ENTER USERNAME..." 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />

            <NeoInput 
              label="SECURE CHANNEL (EMAIL)" 
              type="email"
              placeholder="ENTER EMAIL..." 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />

            <NeoInput 
              label="ACCESS CODE (PASSWORD)" 
              type="password"
              placeholder="ENTER PASSWORD..." 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />

            {tab === 'signup' && (
              <>
                <NeoInput 
                  label="CONFIRM ACCESS CODE" 
                  type="password"
                  placeholder="CONFIRM PASSWORD..." 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
                <div className="space-y-4">
                  <label className="font-slab text-sm uppercase font-bold text-primary">SELECT IDENTITY MASK</label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {avatars.map((url, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05, boxShadow: '8px 8px 0px var(--shadow)' }}
                        onClick={() => setSelectedAvatar(i)}
                        className={`neo-border cursor-pointer bg-surface-alt overflow-hidden relative ${selectedAvatar === i ? 'border-hot-pink ring-2 ring-hot-pink' : 'border-[var(--border)]'}`}
                        style={{ backgroundColor: 'var(--surface-alt)' }}
                      >
                        {selectedAvatar === i && <div className="bg-hot-pink text-white text-[8px] font-bold py-0.5 text-center uppercase">ACTIVE</div>}
                        <img src={url} alt="avatar" className="w-full h-full p-2" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <NeoButton 
              color="hot-pink" 
              className="w-full mt-4"
              onClick={handleAuth}
            >
              INITIALIZE SESSION
            </NeoButton>

            <div className="flex justify-between font-mono text-[10px] opacity-60 uppercase pt-4 border-t-2 border-primary border-dashed" style={{ borderTopColor: 'var(--border)' }}>
              <span className="text-primary">AES-256 // ENCRYPTED</span>
              <span className="text-primary">14MS // LATENCY</span>
              <span className="text-primary">V.4.2 // NEO-B</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// --- Page 3: Landing / Hero ---
const LandingPage = ({ user, setView, onStartGame, onToggleMenu, onToggleDark, darkMode }: { 
  user: User, 
  setView: (v: View) => void, 
  onStartGame: (d: Difficulty) => void,
  onToggleMenu: () => void,
  onToggleDark: () => void,
  darkMode: boolean
}) => {
  const [cpDisplay, setCpDisplay] = useState(0);

  useEffect(() => {
    const end = user.cp;
    if (cpDisplay === end) return;
    const timer = setInterval(() => {
      setCpDisplay(prev => {
        if (prev < end) return Math.min(prev + 50, end);
        return end;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [user.cp]);

  const rankInfo = getRankInfo(user.cp);

  return (
    <div className="min-h-screen pb-24 font-sans">
      <nav className="bg-surface neo-border-b p-4 md:p-6 flex justify-between items-center sticky top-0 z-40 transition-colors border-[var(--border)]" style={{ backgroundColor: 'var(--surface)' }}>
        <h2 className="font-display text-2xl md:text-3xl tracking-tighter uppercase text-primary leading-none"><span className="text-stroke">PROJECT</span><br className="md:hidden" /> CIPHER</h2>
        
        {/* Desktop Links */}
        <div className="hidden md:flex flex-1 justify-center gap-8 font-display font-black uppercase text-xl text-primary">
          <button onClick={() => setView('leaderboard')} className="hover:text-hot-pink cursor-pointer transition-colors">RANKINGS</button>
          <button onClick={() => setView('friends')} className="hover:text-teal cursor-pointer transition-colors">NETWORK</button>
          <button onClick={() => setView('store')} className="hover:text-orange cursor-pointer transition-colors">STORE</button>
          <button onClick={() => setView('daily')} className="hover:text-teal cursor-pointer transition-colors">DAILY OPS</button>
          <button onClick={() => setView('ai')} className="hover:text-purple cursor-pointer transition-colors">AI LAB</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleDark}
            className="w-11 h-11 neo-border neo-shadow bg-surface flex items-center justify-center border-[var(--border)]"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            {darkMode ? <Sun className="w-6 h-6 text-primary" /> : <Moon className="w-6 h-6 text-primary" />}
          </button>

          {/* Hamburger Mobile */}
          <button 
            onClick={() => onToggleMenu()}
            className="md:hidden w-11 h-11 neo-border neo-shadow bg-surface flex items-center justify-center border-[var(--border)]"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>

          <div 
            onClick={() => setView('profile')}
            className="hidden md:block w-12 h-12 neo-border neo-shadow overflow-hidden bg-surface-alt cursor-pointer group hover:border-hot-pink transition-all border-[var(--border)]"
            style={{ backgroundColor: 'var(--surface-alt)' }}
          >
            <img src={user.avatar} alt="avatar" className="group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 md:space-y-12">
        {/* Player Banner */}
        <section className="bg-surface neo-border neo-shadow p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 relative overflow-hidden transition-colors border-[var(--border)]" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="w-24 h-24 md:w-40 md:h-40 neo-border neo-shadow overflow-hidden bg-surface-alt md:rotate-[-3deg] border-[var(--border)] flex-shrink-0" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <img src={user.avatar} alt="avatar" className="w-full h-full p-2" />
          </div>
          <div className="flex-1 text-center md:text-left w-full overflow-hidden">
            <h1 className="font-display text-4xl md:text-7xl uppercase tracking-tighter leading-tight mb-4 text-primary break-all">{user.username}</h1>
            <div className="flex flex-col md:flex-row flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-gold neo-border px-4 py-2 flex items-center gap-2 justify-center w-full md:w-auto border-[var(--border)]">
                <Lightning className="w-5 h-5 text-primary" />
                <span className="font-mono text-xl md:text-2xl font-bold text-primary">{cpDisplay} CP</span>
              </div>
              <div className="neo-border px-4 py-2 flex items-center gap-2 bg-surface justify-center border-[var(--border)] w-full md:w-auto" style={{ borderLeftColor: rankInfo.color, borderLeftWidth: '12px', backgroundColor: 'var(--surface)' }}>
                <Trophy className="w-5 h-5" style={{ color: rankInfo.color }} />
                <span className="font-slab text-lg md:text-xl uppercase font-black text-primary">{rankInfo.name}</span>
              </div>
              <NeoButton color="teal" onClick={() => setView('profile')} className="text-sm w-full md:w-auto min-h-[44px]">VIEW PROFILE</NeoButton>
            </div>
          </div>
        </section>


        <div className="w-screen relative -left-[calc((100vw-min(100%,1280px))/2)] bg-navy py-4 border-y-4 border-orange overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <motion.div 
            animate={{ x: [0, -500] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="flex gap-20 items-center whitespace-nowrap"
          >
            {Array(5).fill(null).map((_, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-4">
                  <Star className="text-hot-pink w-6 h-6 fill-hot-pink" />
                  <span className="font-display text-2xl uppercase" style={{ color: 'var(--bg)' }}>CHOOSE YOUR PROTOCOL</span>
                </div>
                <div className="flex items-center gap-4">
                  <Star className="text-teal w-6 h-6 fill-teal" />
                  <span className="font-display text-2xl uppercase" style={{ color: 'var(--bg)' }}>INCREASE PERCEPTION</span>
                </div>
                <div className="flex items-center gap-4">
                  <Star className="text-orange w-6 h-6 fill-orange" />
                  <span className="font-display text-2xl uppercase" style={{ color: 'var(--bg)' }}>UNSCRAMBLE DATA</span>
                </div>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Difficulty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { id: Difficulty.EASY, name: 'EASY', color: 'bg-teal', config: DIFFICULTY_CONFIG[Difficulty.EASY], label: 'ROOKIE PROT.' },
            { id: Difficulty.MEDIUM, name: 'MEDIUM', color: 'bg-orange', config: DIFFICULTY_CONFIG[Difficulty.MEDIUM], label: 'FIELD AGENT' },
            { id: Difficulty.HARD, name: 'HARD', color: 'bg-purple', config: DIFFICULTY_CONFIG[Difficulty.HARD], label: 'ELITE CIPHER' },
          ].map(level => (
            <motion.div 
              key={level.id}
              whileHover={{ y: -8 }}
              className="bg-surface neo-border neo-shadow flex flex-col border-[var(--border)] overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <div className={`${level.color} h-20 md:h-32 flex items-center justify-center`}>
                <h3 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tighter">{level.name}</h3>
              </div>
              <div className="p-4 md:p-6 flex-1 space-y-4">
                <div className="space-y-1 font-slab">
                  <div className="flex justify-between items-center bg-surface-alt p-2 border-b-2 border-primary" style={{ backgroundColor: 'var(--surface-alt)', borderBottomColor: 'var(--border)' }}>
                    <span className="text-primary text-xs md:text-sm uppercase font-black">{level.label}</span>
                  </div>
                  <div className="flex justify-between items-center bg-surface-alt p-2 border-b-2 border-primary" style={{ backgroundColor: 'var(--surface-alt)', borderBottomColor: 'var(--border)' }}>
                    <span className="text-primary text-xs md:text-sm">PEGS:</span><span className="font-mono font-bold text-primary">{level.config.pegs}</span>
                  </div>
                  <div className="flex justify-between items-center bg-surface-alt p-2 border-b-2 border-primary" style={{ backgroundColor: 'var(--surface-alt)', borderBottomColor: 'var(--border)' }}>
                    <span className="text-primary text-xs md:text-sm">GUESSES:</span><span className="font-mono font-bold text-primary">{level.config.guesses}</span>
                  </div>
                </div>
                <NeoButton 
                  color="navy" 
                  className="w-full text-sm py-2 min-h-[48px]"
                  onClick={() => onStartGame(level.id)}
                >
                  INITIALIZE
                </NeoButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Page 4: Game Board ---
const GameBoard = ({ 
  user, 
  difficulty, 
  onBack, 
  onResult,
  symbolMode,
  equipped,
  isVsAI,
  onUpdateCP
}: { 
  user: User, 
  difficulty: Difficulty, 
  onBack: () => void,
  onResult: (win: boolean, guessesUsed: number, stats: any) => void,
  symbolMode: boolean,
  equipped: StoreEquipped,
  isVsAI: boolean,
  onUpdateCP: (cp: number) => void
}) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const activeSet = PEG_SETS.find(s => s.id === equipped.pegSetId) || PEG_SETS[0];
  const activeSkin = BOARD_SKINS.find(s => s.id === equipped.skinId) || BOARD_SKINS[0];

  const [targetCode, setTargetCode] = useState<PegColorKey[]>([]);
  const [guesses, setGuesses] = useState<PegColorKey[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<PegColorKey[]>([]);
  const [feedback, setFeedback] = useState<{ exact: number, partial: number }[]>([]);
  
  // AI State
  const [aiGuesses, setAiGuesses] = useState<PegColorKey[][]>([]);
  const [aiFeedback, setAiFeedback] = useState<{ exact: number, partial: number }[]>([]);
  const [aiGameOver, setAiGameOver] = useState(false);
  const [aiWinStatus, setAiWinStatus] = useState<boolean | null>(null);
  const [aiLog, setAiLog] = useState<string[]>([]);
  
  const aiSolver = useMemo(() => isVsAI ? new KnuthSolver(config.pegs, config.colorKeys) : null, [isVsAI, difficulty]);

  const [selectedColor, setSelectedColor] = useState<PegColorKey>(config.colorKeys[0]);
  const [timeLeft, setTimeLeft] = useState(180); // 3 mins
  const [gameOver, setGameOver] = useState(false);
  const [removals, setRemovals] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintPulseIdx, setHintPulseIdx] = useState<number | null>(null);
  const [activeBoard, setActiveBoard] = useState<'YOUR' | 'AI'>('YOUR');
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  useEffect(() => {
    // Generate code
    const code: PegColorKey[] = [];
    for (let i = 0; i < config.pegs; i++) {
        code.push(config.colorKeys[Math.floor(Math.random() * config.colorKeys.length)]);
    }
    setTargetCode(code);
    setCurrentGuess(new Array(config.pegs).fill(null));

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      handleGameOver(false);
    }
  }, [timeLeft]);

  const handlePegClick = (index: number) => {
    if (gameOver) return;
    const newGuess = [...currentGuess];
    
    if (newGuess[index] && !selectedColor) {
      setRemovals(r => r + 1);
    }
    
    newGuess[index] = selectedColor;
    setCurrentGuess(newGuess);
  };

  const useHint = () => {
    if (gameOver || hintsUsed >= 3 || user.cp < 25) return;
    
    const wrongSlots = currentGuess
      .map((peg, i) => ({ peg, i, correct: targetCode[i] }))
      .filter(({ peg, i }) => peg !== targetCode[i]);

    if (wrongSlots.length === 0) return;

    const target = wrongSlots[Math.floor(Math.random() * wrongSlots.length)];
    const newPegs = [...currentGuess];
    newPegs[target.i] = target.correct;
    
    setCurrentGuess(newPegs);
    setHintsUsed(h => h + 1);
    onUpdateCP(user.cp - 25);
    setHintPulseIdx(target.i);
    setTimeout(() => setHintPulseIdx(null), 400);
  };

  const submitGuess = () => {
    if (currentGuess.includes(null as any) || gameOver) return;
    
    let exact = 0;
    let partial = 0;
    const tempTarget = [...targetCode];
    const tempGuess = [...currentGuess];

    for (let i = 0; i < config.pegs; i++) {
      if (tempGuess[i] === tempTarget[i]) {
        exact++;
        tempTarget[i] = null as any;
        tempGuess[i] = null as any;
      }
    }

    for (let i = 0; i < config.pegs; i++) {
      if (tempGuess[i] !== null) {
        const foundIndex = tempTarget.findIndex(c => c === tempGuess[i]);
        if (foundIndex !== -1) {
          partial++;
          tempTarget[foundIndex] = null as any;
        }
      }
    }

    const newFeedbackValues = { exact, partial };
    const newFeedback = [...feedback, newFeedbackValues];
    const newGuesses = [...guesses, currentGuess];
    
    setFeedback(newFeedback);
    setGuesses(newGuesses);
    setCurrentGuess(new Array(config.pegs).fill(null));

    // Handle AI move
    if (isVsAI && aiSolver && !aiGameOver) {
      let nextAiGuess: PegColorKey[];
      if (aiGuesses.length === 0) {
        nextAiGuess = aiSolver.getFirstGuess();
      } else {
        nextAiGuess = aiSolver.getNextGuess();
      }
      
      const aiExact = nextAiGuess.filter((c, i) => c === targetCode[i]).length;
      let aiPartial = 0;
      const g = [...nextAiGuess];
      const t = [...targetCode];
      for (let i = 0; i < config.pegs; i++) if (g[i] === t[i]) { g[i] = null as any; t[i] = null as any; }
      for (let i = 0; i < config.pegs; i++) if (g[i]) { const idx = t.indexOf(g[i]); if (idx !== -1) { aiPartial++; t[idx] = null as any; } }
      
      const newAiFeedbackValues = { exact: aiExact, partial: aiPartial };
      const newAiGuesses = [...aiGuesses, nextAiGuess];
      const newAiFeedback = [...aiFeedback, newAiFeedbackValues];
      
      setAiGuesses(newAiGuesses);
      setAiFeedback(newAiFeedback);
      aiSolver.update(nextAiGuess, newAiFeedbackValues);
      
      const logMsg = `Round ${newAiGuesses.length}: Analyzed feedback, elim. ${Math.floor(Math.random() * 50) + 10} codes. Best guess: ${nextAiGuess.join(', ')}`;
      setAiLog(prev => [logMsg, ...prev]);

      if (aiExact === config.pegs) {
        setAiGameOver(true);
        setAiWinStatus(true);
      } else if (newAiGuesses.length >= config.guesses) {
        setAiGameOver(true);
        setAiWinStatus(false);
      }
    }

    if (exact === config.pegs) {
      handleGameOver(true, newGuesses.length);
    } else if (newGuesses.length >= config.guesses) {
      handleGameOver(false);
    }
  };

  const handleGameOver = (win: boolean, count: number = guesses.length + 1) => {
    setGameOver(true);
    let finalWin = win;
    
    // In VS AI mode, winning means solving it in fewer steps than AI
    // or both solve it, but you win if you were faster or AI failed.
    if (isVsAI) {
      if (win) {
         if (!aiWinStatus || count < aiGuesses.length) {
           finalWin = true;
         } else if (count === aiGuesses.length) {
           finalWin = true; // Tie goes to player for simplicity
         } else {
           finalWin = false; // AI was more efficient
         }
      }
    }

    const stats: Partial<TodayStats> = {
      guesses: count,
      time: 180 - timeLeft,
      removals,
      noHintWin: win && hintsUsed === 0,
      aiBeatToday: isVsAI && finalWin
    };
    setTimeout(() => onResult(finalWin, count, stats), 1500);
  };

  const [showPalette, setShowPalette] = useState(false);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timePercentage = (timeLeft / 180) * 100;
  const timeColor = timeLeft > 90 ? 'stroke-teal' : timeLeft > 30 ? 'stroke-gold' : 'stroke-hot-pink animate-pulse';

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row relative" style={{ backgroundColor: activeSkin.bg }}>
      {/* Sticky Info Strip (Mobile Only) */}
      <div className="lg:hidden sticky top-0 z-30 bg-surface neo-border-b px-4 py-3 flex items-center justify-between border-[var(--border)] shadow-md" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#ddd" strokeWidth="3" />
              <motion.circle 
                cx="20" cy="20" r="18" 
                fill="none" 
                strokeDasharray={113} 
                animate={{ strokeDashoffset: 113 - (113 * timePercentage) / 100 }}
                className={`${timeColor}`} 
                strokeWidth="4" 
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-black">{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <div>
            <div className="font-display text-[10px] text-primary leading-none uppercase">GUESS</div>
            <div className="font-mono text-lg font-black text-hot-pink leading-none">{guesses.length + 1}/{config.guesses}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={useHint}
            disabled={gameOver || hintsUsed >= 3 || user.cp < 25}
            className={`px-3 py-1 neo-border text-[10px] font-display uppercase transition-colors ${hintsUsed >= 3 ? 'bg-slate-200 opacity-50' : 'bg-gold'}`}
          >
            HINT (25CP)
          </button>
          <button onClick={onBack} className="w-10 h-10 neo-border bg-surface flex items-center justify-center border-[var(--border)]" style={{ backgroundColor: 'var(--surface)' }}><LogOut className="w-5 h-5 text-primary" /></button>
        </div>
      </div>

      {/* Sidebar: Palette */}
      <aside className={`lg:w-48 flex flex-col gap-6 fixed inset-0 z-50 bg-black/40 lg:relative lg:inset-auto lg:z-0 lg:bg-transparent transition-opacity duration-300 ${showPalette ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}`}>
         <div className={`bg-surface neo-border lg:neo-shadow p-6 space-y-6 w-full max-w-sm ml-auto lg:m-0 mt-auto lg:mt-0 transition-transform duration-300 transform ${showPalette ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`} style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="flex justify-between items-center lg:block border-b-2 border-primary pb-2 mb-4" style={{ borderBottomColor: 'var(--border)' }}>
            <h4 className="font-display text-2xl uppercase tracking-tighter text-primary">PALETTE</h4>
            <button onClick={() => setShowPalette(false)} className="lg:hidden w-8 h-8 flex items-center justify-center neo-border bg-hot-pink text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-1 gap-3 md:gap-4 pb-8 lg:pb-0">
            {config.colorKeys.map((k, idx) => (
              <div 
                key={k} 
                onClick={() => setSelectedColor(k)}
                className="flex items-center gap-3 cursor-pointer group"
                draggable={true}
                onDragStart={(e) => { e.dataTransfer.setData('colorKey', k); }}
              >
                <motion.div
                   whileHover={{ scale: 1.05 }}
                   style={{ backgroundColor: activeSet.colors[idx % activeSet.colors.length] }}
                   className={`rounded-full neo-border neo-shadow relative flex items-center justify-center w-10 h-10 ${selectedColor === k ? 'ring-4 ring-hot-pink border-[var(--border)]' : 'border-[var(--border)]'}`}
                >
                   <div className="absolute top-1 left-1 w-[30%] h-[30%] bg-white opacity-30 rounded-full" />
                   {symbolMode && (
                     <span className="font-bold select-none text-navy">{COLOR_BLIND_SYMBOLS[k]}</span>
                   )}
                </motion.div>
                <span className="font-mono text-xs font-bold opacity-40 group-hover:opacity-100 uppercase text-primary">{k}</span>
              </div>
            ))}
          </div>

        </div>
        <NeoButton color="white" icon={LogOut} onClick={onBack} className="mt-auto">ABORT</NeoButton>
      </aside>

      {/* Main Area */}
      <main className={`flex-1 p-2 md:p-4 lg:p-8 space-y-4 grid transition-all duration-500 ${isVsAI ? 'lg:grid-cols-2 gap-8' : 'grid-cols-1 md:max-w-4xl mx-auto'}`}>
        {/* Toggle Tabs (Mobile VS AI only) */}
        {isVsAI && (
          <div className="lg:hidden flex neo-border bg-surface border-[var(--border)] overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
            <button 
              onClick={() => setActiveBoard('YOUR')}
              className={`flex-1 py-3 font-display uppercase transition-colors ${activeBoard === 'YOUR' ? 'bg-navy text-white' : 'bg-transparent text-primary'}`}
            >
              [YOUR BOARD]
            </button>
            <button 
              onClick={() => setActiveBoard('AI')}
              className={`flex-1 py-3 font-display uppercase transition-colors ${activeBoard === 'AI' ? 'bg-navy text-white' : 'bg-transparent text-primary'}`}
            >
              [AI BOARD]
            </button>
          </div>
        )}

        {/* Player Board */}
        <div className={`bg-surface neo-border neo-shadow p-3 md:p-8 min-h-[500px] flex flex-col relative ${isVsAI && activeBoard !== 'YOUR' ? 'hidden lg:flex' : 'flex'}`} style={{ border: activeSkin.borderStyle, backgroundColor: 'var(--card-bg)' }}>
          <div className="absolute top-2 left-2 bg-navy text-white px-3 py-1 font-display text-[10px] uppercase neo-border z-10 border-[var(--border)]">OPERATIVE: {user.username}</div>
          <div className="flex-1 space-y-1.5 md:space-y-4 overflow-y-auto max-h-[60vh] md:max-h-[70vh] pr-2 md:pr-4 custom-scrollbar pt-8">
            {/* History Rows */}
            {guesses.map((guess, idx) => (
              <motion.div 
                key={idx}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-2 md:gap-4 py-1.5 md:py-2 border-b border-surface-alt"
                style={{ borderBottomColor: 'var(--surface-alt)' }}
              >
                <div className="font-mono text-[10px] opacity-30 w-4 text-primary">{(idx + 1).toString().padStart(2, '0')}</div>
                <div className="flex gap-1.5 md:gap-2 flex-1 items-center justify-center">
                  {guess.map((c, i) => {
                    const colorIdx = config.colorKeys.indexOf(c);
                    return (
                        <div 
                          key={i} 
                          style={{ backgroundColor: activeSet.colors[colorIdx] }}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full neo-border neo-shadow relative flex items-center justify-center border-[var(--border)]"
                        >
                           <div className="absolute top-1 left-1 w-[30%] h-[30%] bg-white opacity-30 rounded-full" />
                           {symbolMode && <span className="font-bold text-[10px] md:text-xs text-navy">{COLOR_BLIND_SYMBOLS[c]}</span>}
                        </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-1 w-8 md:w-12 text-primary">
                  {Array.from({ length: config.pegs }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full border border-primary ${
                          i < feedback[idx].exact ? 'bg-primary' : 
                          i < feedback[idx].exact + feedback[idx].partial ? 'bg-surface' : 'bg-surface-alt border-surface-alt'
                        }`} 
                        style={{ borderColor: 'var(--border)', backgroundColor: i < feedback[idx].exact ? 'var(--text-primary)' : i < feedback[idx].exact + feedback[idx].partial ? 'var(--surface)' : 'var(--surface-alt)' }}
                      />
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Current Active Row */}
            {!gameOver && (
              <div className="flex items-center gap-2 md:gap-4 py-4 md:py-6 border-l-[6px] pl-2 md:pl-4 bg-surface-alt/50 -mx-2 md:-mx-4" style={{ borderColor: activeSkin.accent, backgroundColor: 'var(--surface-alt)' }}>
                <div className="font-mono text-[10px] w-4 font-black" style={{ color: activeSkin.accent }}>▶</div>
                <div className="flex gap-2 flex-1 items-center justify-center">
                  {currentGuess.map((c, i) => {
                    const colorIdx = config.colorKeys.indexOf(c);
                    return (
                      <button 
                        key={i}
                        onClick={() => handlePegClick(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={() => setDragOverSlot(i)}
                        onDragLeave={() => setDragOverSlot(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverSlot(null);
                          const colorKey = e.dataTransfer.getData('colorKey') as PegColorKey;
                          const fromSlot = e.dataTransfer.getData('fromSlot');
                          const newGuess = [...currentGuess];
                          if (fromSlot !== "") {
                            const fromIdx = parseInt(fromSlot);
                            const temp = newGuess[i];
                            newGuess[i] = newGuess[fromIdx];
                            newGuess[fromIdx] = temp;
                          } else {
                            newGuess[i] = colorKey;
                          }
                          setCurrentGuess(newGuess);
                        }}
                        draggable={!!c}
                        onDragStart={(e) => {
                          if (c) {
                            e.dataTransfer.setData('colorKey', c);
                            e.dataTransfer.setData('fromSlot', String(i));
                          }
                        }}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${c ? '' : 'border-2 border-dashed border-primary group'} ${dragOverSlot === i ? 'ring-2 ring-hot-pink scale-110' : ''}`}
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {c ? (
                           <motion.div 
                            animate={hintPulseIdx === i ? { scale: [1, 1.1, 1], borderColor: ['var(--border)', '#FFD600', 'var(--border)'] } : {}}
                            style={{ backgroundColor: activeSet.colors[colorIdx] }}
                            className={`w-full h-full rounded-full neo-border neo-shadow relative flex items-center justify-center border-[var(--border)] ${hintPulseIdx === i ? 'ring-2 ring-gold' : ''}`}
                           >
                              <div className="absolute top-1 left-1 w-[30%] h-[30%] bg-white opacity-30 rounded-full" />
                              {symbolMode && <span className="font-bold text-navy">{COLOR_BLIND_SYMBOLS[c]}</span>}
                           </motion.div>
                        ) : (
                           <div className="w-2 h-2 bg-primary opacity-10 group-hover:opacity-30 rounded-full" style={{ backgroundColor: 'var(--text-primary)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <NeoButton 
                  color="hot-pink" 
                  disabled={currentGuess.includes(null as any)}
                  onClick={submitGuess}
                  className="px-3 md:px-4 py-1 text-xs md:text-sm neo-shadow min-h-[44px] lg:relative fixed bottom-20 left-4 right-20 lg:bottom-auto lg:left-auto lg:right-auto z-40 lg:w-auto"
                >
                  SUBMIT
                </NeoButton>
              </div>
            )}

            {/* Empty Future Rows */}
            {Array.from({ length: config.guesses - guesses.length - (gameOver ? 0 : 1) }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b-2 border-[var(--border)] opacity-20 filter grayscale" style={{ borderBottomColor: 'var(--border)' }}>
                <div className="font-mono text-xs w-4">{(guesses.length + (gameOver ? 1 : 2) + i).toString().padStart(2, '0')}</div>
                <div className="flex gap-2 flex-1 items-center justify-center">
                  {Array.from({ length: config.pegs }).map((_, pi) => (
                    <div key={pi} className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--border)]" style={{ borderColor: 'var(--border)' }} />
                  ))}
                </div>
                <div className="w-12 h-6" />
               </div>
            ))}

          </div>
        </div>

        {/* AI Board (Split View) */}
        {isVsAI && (
           <div className={`bg-surface neo-border neo-shadow p-3 md:p-8 min-h-[500px] flex flex-col relative ${activeBoard !== 'AI' ? 'hidden lg:flex' : 'flex'}`} style={{ border: activeSkin.borderStyle, backgroundColor: 'var(--card-bg)' }}>
              <div className="absolute top-2 left-2 bg-purple text-white px-3 py-1 font-display text-[10px] uppercase neo-border z-10 border-[var(--border)]">AI_OPPONENT: KNUTH_v1.0</div>
              <div className="flex-1 space-y-1.5 md:space-y-4 overflow-y-auto max-h-[60vh] md:max-h-[70vh] pr-2 md:pr-4 custom-scrollbar pt-8">
                 {aiGuesses.map((guess, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ x: -20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     className="flex items-center gap-2 md:gap-4 py-1.5 md:py-2 border-b border-surface-alt"
                     style={{ borderBottomColor: 'var(--surface-alt)' }}
                   >
                     <div className="font-mono text-[10px] opacity-30 w-4 text-primary">{(idx + 1).toString().padStart(2, '0')}</div>
                     <div className="flex gap-1.5 md:gap-2 flex-1 items-center justify-center">
                       {guess.map((c, i) => (
                          <div 
                            key={i} 
                            style={{ backgroundColor: activeSet.colors[config.colorKeys.indexOf(c)] }}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full neo-border neo-shadow relative flex items-center justify-center border-[var(--border)]"
                          >
                             <div className="absolute top-1 left-1 w-[30%] h-[30%] bg-white opacity-30 rounded-full" />
                             {symbolMode && <span className="font-bold text-[10px] md:text-xs text-navy">{COLOR_BLIND_SYMBOLS[c]}</span>}
                          </div>
                       ))}
                     </div>
                     <div className="grid grid-cols-2 gap-1 w-8 md:w-12 text-primary">
                       {Array.from({ length: config.pegs }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full border border-primary ${
                              i < aiFeedback[idx].exact ? 'bg-primary' : 
                              i < aiFeedback[idx].exact + aiFeedback[idx].partial ? 'bg-surface' : 'bg-surface-alt border-surface-alt'
                            }`} 
                            style={{ borderColor: 'var(--border)', backgroundColor: i < aiFeedback[idx].exact ? 'var(--text-primary)' : i < aiFeedback[idx].exact + aiFeedback[idx].partial ? 'var(--surface)' : 'var(--surface-alt)' }}
                          />
                       ))}
                     </div>
                   </motion.div>
                 ))}
                 
                 {!aiGameOver && !gameOver && (
                    <div className="flex items-center justify-center py-10 opacity-40">
                       <motion.div 
                         animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} 
                         transition={{ repeat: Infinity, duration: 2 }}
                         className="flex flex-col items-center gap-2"
                        >
                         <Brain className="w-12 h-12" />
                         <span className="font-mono text-[10px] uppercase">AI CALCULATING...</span>
                       </motion.div>
                    </div>
                 )}
                 
                 {aiGameOver && (
                    <div className="flex-1 flex items-center justify-center">
                       <div className={`p-8 neo-border neo-shadow rotate-[-3deg] uppercase font-display text-4xl text-center ${aiWinStatus ? 'bg-green text-white' : 'bg-hot-pink text-white'}`}>
                          {aiWinStatus ? 'AI SOLVED IT!' : 'AI FAILED!'}
                       </div>
                    </div>
                 )}

                 {isVsAI && aiLog.length > 0 && (
                   <div className="mt-4 border-t-2 border-primary/10 pt-4">
                     <div className="flex justify-between items-center mb-2">
                       <span className="font-display text-xs uppercase opacity-40">AI REASONING LOG</span>
                       <Brain className="w-3 h-3 opacity-40" />
                     </div>
                     <div className="max-h-32 md:max-h-none overflow-y-auto space-y-1">
                       {aiLog.map((log, idx) => (
                         <div key={idx} className="font-mono text-[10px] text-primary opacity-60 bg-surface-alt p-1 px-2 neo-border-l border-l-purple">
                           {log}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
           </div>
        )}
      </main>

      {/* Info Panel Desktop */}
      <aside className="hidden lg:flex lg:w-72 flex-col gap-6 p-8">
        <div className="bg-surface neo-border neo-shadow p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#ddd" strokeWidth="8" />
              <motion.circle 
                cx="80" cy="80" r="70" 
                fill="none" 
                strokeDasharray={440} 
                animate={{ strokeDashoffset: 440 - (440 * timePercentage) / 100 }}
                className={`transition-all duration-1000 ${timeColor}`} 
                strokeWidth="12" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-black text-primary">{minutes}:{seconds.toString().padStart(2, '0')}</span>
              <span className="font-slab text-xs uppercase opacity-40 text-primary">AUTO-LOCK</span>
            </div>
          </div>

          <div className="space-y-4 font-slab">
            <div className="flex justify-between items-center bg-surface-alt p-3 neo-border-b text-primary border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
              <span className="text-sm opacity-50 uppercase">ATTEMPT:</span>
              <span className="text-xl font-bold font-mono text-hot-pink">{guesses.length + 1}/{config.guesses}</span>
            </div>
            <div className="flex justify-between items-center bg-surface-alt p-3 neo-border-b text-primary border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
              <span className="text-sm opacity-50 uppercase">PROTOCOL:</span>
              <span className="text-xl font-bold uppercase">{difficulty}</span>
            </div>
            <div className="flex justify-between items-center bg-surface-alt p-3 neo-border-b text-primary border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
               <span className="text-sm opacity-50 uppercase">HINTS:</span>
               <span className="text-xl font-bold font-mono">{hintsUsed}/3</span>
            </div>
          </div>

          
          <NeoButton 
            color={hintsUsed >= 3 ? 'navy' : user.cp < 25 ? 'white' : 'gold'} 
            disabled={gameOver || hintsUsed >= 3 || user.cp < 25}
            className="w-full mt-8 text-sm" 
            icon={Lightning}
            onClick={useHint}
          >
            {hintsUsed >= 3 ? "NO HINTS LEFT" : user.cp < 25 ? "NEED 25 CP" : "USE HINT — 25 CP"}
          </NeoButton>

           <div className="mt-4 flex gap-2 justify-center">
              {[1, 2, 3].map(h => (
                 <div key={h} className={`w-3 h-3 neo-border border-[var(--border)] ${h <= hintsUsed ? 'bg-gold' : 'bg-surface-alt'}`} style={{ backgroundColor: h <= hintsUsed ? '#FFD600' : 'var(--surface-alt)' }} />
              ))}
          </div>
        </div>
      </aside>

      {/* Mobile Palette FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPalette(true)}
          className="w-14 h-14 bg-hot-pink neo-border neo-shadow flex items-center justify-center border-[var(--border)]"
        >
          <div className="grid grid-cols-2 gap-1">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </motion.button>
      </div>
    </div>
  );
};

// --- Page 5: Post-Game Overlay ---
const ResultOverlay = ({ 
  win, 
  user, 
  difficulty, 
  guessesUsed,
  completedTask,
  onClose 
}: { 
  win: boolean, 
  user: User, 
  difficulty: Difficulty, 
  guessesUsed: number,
  completedTask?: DailyTask | null,
  onClose: (newCp: number) => void 
}) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const delta = win ? config.winCP : config.lossCP;
  const bonus = win ? Math.max(0, (config.guesses - guessesUsed) * 20) : 0;
  const totalDelta = delta + bonus;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 ${win ? 'bg-gold/90 md:bg-gold/90' : 'bg-hot-pink/90 md:bg-hot-pink/90'}`}
    >
      <motion.div 
        initial={{ y: 100, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        className="w-full md:max-w-2xl bg-white md:bg-surface neo-border-t md:neo-border neo-shadow p-6 md:p-12 text-center border-[var(--border)] overflow-y-auto max-h-[95vh] md:max-h-none mt-auto md:mt-0"
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        {completedTask && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 md:mb-8 bg-surface neo-border neo-shadow p-4 flex items-center gap-4 justify-center animate-bounce border-[var(--border)]"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
             <span className="text-3xl md:text-4xl text-hot-pink">🏆</span>
             <div className="text-left">
                <span className="block font-display text-lg md:text-xl uppercase tracking-tighter">TASK COMPLETE</span>
                <span className="block font-slab text-xs md:text-sm uppercase opacity-40">{completedTask.name} +{completedTask.reward} CP</span>
             </div>
          </motion.div>
        )}

        <h1 className="font-display text-5xl md:text-8xl uppercase tracking-tighter leading-none mb-4 break-words">
          {win ? 'CIPHER CRACKED' : 'UNBROKEN CODE'}
        </h1>
        <p className="font-slab text-xl md:text-2xl uppercase mb-8 opacity-60">
          IDENTIFIED IN {guessesUsed} GUESSES
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-center mb-8 md:mb-12">
          <div className="bg-surface-alt neo-border p-4 md:p-6 w-full md:w-auto border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <span className="font-slab block text-xs md:text-sm opacity-40 text-primary uppercase">REWARD EARNED:</span>
            <span className={`font-mono text-3xl md:text-4xl block ${win ? 'text-green' : 'text-hot-pink'}`}>
              {delta > 0 ? '+' : ''}{delta} CP
            </span>
          </div>
          {bonus > 0 && (
            <div className="bg-surface-alt neo-border p-4 md:p-6 w-full md:w-auto border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
              <span className="font-slab block text-xs md:text-sm opacity-40 text-primary uppercase">EFFICIENCY BONUS:</span>
              <span className="font-mono text-3xl md:text-4xl block text-teal">+{bonus} CP</span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <NeoButton color="navy" onClick={() => onClose(user.cp + totalDelta)} className="w-full md:flex-1 min-h-[48px]">RETURN TO TERMINAL</NeoButton>
          <NeoButton color="hot-pink" onClick={() => window.location.reload()} className="w-full md:flex-1 min-h-[48px]">RETRY MODE</NeoButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface LeaderboardEntry {
  playerId: string;
  username: string;
  avatarId: number;
  cp: number;
  winRate: string;
  bestTime: string;
  gamesPlayed: number;
  tier: string;
}

interface LeaderboardStore {
  easy: LeaderboardEntry[];
  medium: LeaderboardEntry[];
  hard: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
}

const SEEDED_LEADERBOARD: LeaderboardStore = {
  easy: [
    { playerId: 'e1', username: 'ROOKIE_7', avatarId: 1, cp: 780, winRate: '65%', bestTime: '0:45', gamesPlayed: 20, tier: 'EASY' },
    { playerId: 'e2', username: 'CADET_MOSS', avatarId: 2, cp: 650, winRate: '60%', bestTime: '1:10', gamesPlayed: 15, tier: 'EASY' },
    { playerId: 'e3', username: 'AGENT_LYLE', avatarId: 3, cp: 520, winRate: '55%', bestTime: '1:30', gamesPlayed: 12, tier: 'EASY' },
    { playerId: 'e4', username: 'SQUIRE_J', avatarId: 4, cp: 480, winRate: '50%', bestTime: '1:45', gamesPlayed: 10, tier: 'EASY' },
    { playerId: 'e5', username: 'NEWBIE_X', avatarId: 5, cp: 300, winRate: '40%', bestTime: '2:15', gamesPlayed: 8, tier: 'EASY' },
  ],
  medium: [
    { playerId: 'm1', username: 'OPERATIVE_K', avatarId: 6, cp: 2400, winRate: '75%', bestTime: '0:55', gamesPlayed: 45, tier: 'MEDIUM' },
    { playerId: 'm2', username: 'CIPHER_99', avatarId: 7, cp: 1950, winRate: '70%', bestTime: '1:15', gamesPlayed: 38, tier: 'MEDIUM' },
    { playerId: 'm3', username: 'NOVA_ACE', avatarId: 8, cp: 1600, winRate: '68%', bestTime: '1:35', gamesPlayed: 30, tier: 'MEDIUM' },
    { playerId: 'm4', username: 'ECHO_FIVE', avatarId: 9, cp: 1200, winRate: '65%', bestTime: '1:50', gamesPlayed: 25, tier: 'MEDIUM' },
    { playerId: 'm5', username: 'VECTOR_Z', avatarId: 10, cp: 950, winRate: '60%', bestTime: '2:05', gamesPlayed: 20, tier: 'MEDIUM' },
  ],
  hard: [
    { playerId: 'h1', username: 'SPECTRE_ONE', avatarId: 11, cp: 7500, winRate: '85%', bestTime: '1:10', gamesPlayed: 85, tier: 'HARD' },
    { playerId: 'h2', username: 'WRAITH_7', avatarId: 12, cp: 6200, winRate: '80%', bestTime: '1:40', gamesPlayed: 70, tier: 'HARD' },
    { playerId: 'h3', username: 'BLACK_OPS_X', avatarId: 13, cp: 5400, winRate: '78%', bestTime: '1:55', gamesPlayed: 60, tier: 'HARD' },
    { playerId: 'h4', username: 'OMEGA_K', avatarId: 14, cp: 4100, winRate: '72%', bestTime: '2:10', gamesPlayed: 50, tier: 'HARD' },
    { playerId: 'h5', username: 'TITAN_EYE', avatarId: 15, cp: 3200, winRate: '68%', bestTime: '2:30', gamesPlayed: 40, tier: 'HARD' },
  ],
  allTime: [] // Will be populated in useEffect or kept as ref
};
SEEDED_LEADERBOARD.allTime = [...SEEDED_LEADERBOARD.hard, ...SEEDED_LEADERBOARD.medium, ...SEEDED_LEADERBOARD.easy].sort((a,b) => b.cp - a.cp).slice(0, 10);
const LeaderboardPage = ({ user, onBack, onReport }: { user: User, onBack: () => void, onReport: (username: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'ALL-TIME'>('ALL-TIME');
  const [store, setStore] = useState<LeaderboardStore>(SEEDED_LEADERBOARD);

  const getActiveList = () => {
    switch(activeTab) {
      case 'EASY': return store.easy;
      case 'MEDIUM': return store.medium;
      case 'HARD': return store.hard;
      default: return store.allTime;
    }
  };

  const list = getActiveList();
  
  // Find current user's rank
  const userRank = list.findIndex(e => e.playerId === user.id) + 1 || Math.floor(Math.random() * 100) + 50;

  return (
    <div className="min-h-screen bg-bg p-6 max-w-5xl mx-auto space-y-8 pb-32" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex justify-between items-end border-b-8 border-primary pb-4" style={{ borderBottomColor: 'var(--border)' }}>
        <h1 className="font-display text-4xl md:text-8xl tracking-tighter uppercase text-primary">TOP OPERATIVES</h1>
        <NeoButton color="white" icon={LogOut} onClick={onBack}>BACK</NeoButton>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
        {['EASY', 'MEDIUM', 'HARD', 'ALL-TIME'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 neo-border font-display text-lg uppercase transition-all flex-shrink-0 ${activeTab === tab ? 'bg-navy text-white neo-shadow' : 'bg-surface text-primary border-[var(--border)]'}`}
            style={{ backgroundColor: activeTab === tab ? 'var(--border)' : 'var(--surface)', boxShadow: activeTab === tab ? '8px 8px 0px var(--shadow)' : 'none' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {list.map((l, i) => (
              <div 
                key={l.playerId}
                className={`flex items-stretch gap-2 md:gap-4 group border-l-[8px] bg-white neo-shadow neo-border p-3 ${i === 0 ? 'border-l-[#FFD600]' : i === 1 ? 'border-l-[#C0C0C0]' : i === 2 ? 'border-l-[#CD7F32]' : 'border-l-primary'}`}
              >
                <div className="w-10 md:w-20 flex items-center justify-center font-display text-2xl md:text-4xl text-primary">
                  {(i + 1).toString().padStart(2, '0')}
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 neo-border overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${l.avatarId}`} alt="avatar" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm md:text-2xl uppercase truncate text-primary">{l.username}</h4>
                  <div className="flex gap-2 font-mono text-[8px] md:text-[10px] uppercase truncate text-primary opacity-40">
                    <span className="font-bold">DIAMOND</span>
                    <span>◆ {l.cp.toLocaleString()} CP</span>
                    <span>{l.winRate} WR</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <button 
                    onClick={() => onReport(l.username)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 md:w-10 md:h-10 flex items-center justify-center neo-border bg-surface text-primary hover:bg-hot-pink hover:text-white border-[var(--border)]"
                    style={{ backgroundColor: 'var(--surface)' }}
                  >
                     <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pinned User Row */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-30">
         <div className="bg-surface neo-border neo-shadow p-4 flex items-center gap-6 border-l-[12px] border-l-hot-pink animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-12 neo-border bg-hot-pink text-white flex items-center justify-center font-display text-xl">
               #{userRank}
            </div>
            <div className="w-10 h-10 neo-border overflow-hidden bg-slate-100">
               <img src={user.avatar} alt="avatar" />
            </div>
            <div className="flex-1">
               <h4 className="font-display text-xl uppercase text-primary">YOU ({user.username})</h4>
               <p className="font-mono text-[10px] uppercase opacity-40 text-primary">CURRENT POSITION IN {activeTab}</p>
            </div>
            <div className="text-right">
               <span className="font-mono text-2xl font-black text-primary">{user.cp}</span>
               <span className="block font-slab text-[10px] uppercase opacity-40 text-primary">TOTAL CP</span>
            </div>
         </div>
      </div>
    </div>
  );
};


// --- Page 6.5: Friends ---
interface Friend {
  username: string;
  avatar: string;
  cp: number;
  status: 'online' | 'offline';
  lastSeen: string;
}

interface FriendRequest {
  from: string;
  avatar: string;
  timestamp: number;
}

interface Challenge {
  id: string;
  from: string;
  difficulty: Difficulty;
  wager: number;
  expiresAt: number;
  seed: string;
}

interface FriendsState {
  friends: Friend[];
  sentRequests: string[];
  receivedRequests: FriendRequest[];
  challenges: Challenge[];
}

const FriendsPage = ({ 
  user,
  friendsState,
  onBack, 
  onSendRequest, 
  onAcceptRequest, 
  onDeclineRequest,
  onCancelRequest,
  onChallenge,
  onAcceptChallenge,
  onDeclineChallenge,
  onReport
}: { 
  user: User,
  friendsState: FriendsState,
  onBack: () => void,
  onSendRequest: (username: string) => void,
  onAcceptRequest: (req: FriendRequest) => void,
  onDeclineRequest: (req: FriendRequest) => void,
  onCancelRequest: (username: string) => void,
  onChallenge: (friend: string, difficulty: Difficulty, wager: number) => void,
  onAcceptChallenge: (challenge: Challenge) => void,
  onDeclineChallenge: (challengeId: string) => void,
  onReport: (username: string) => void
}) => {
  const [search, setSearch] = useState('');
  const [challengingFriend, setChallengingFriend] = useState<string | null>(null);
  const [challengeDiff, setChallengeDiff] = useState<Difficulty>(Difficulty.MEDIUM);
  const [challengeWager, setChallengeWager] = useState(50);

  return (
    <div className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-8 pb-32" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex justify-between items-end border-b-8 border-navy pb-4" style={{ borderBottomColor: 'var(--border)' }}>
        <h1 className="font-display text-4xl md:text-8xl tracking-tighter uppercase text-primary">OPERATIVE NETWORK</h1>
        <NeoButton color="white" icon={LogOut} onClick={onBack}>BACK</NeoButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Requests & Search */}
        <div className="space-y-8">
          <div className="bg-surface neo-border neo-shadow p-6 space-y-6" style={{ backgroundColor: 'var(--card-bg)' }}>
            <h3 className="font-display text-2xl uppercase tracking-tighter text-primary">RECRUIT OPERATIVE</h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ENTER USERNAME..."
                className="flex-1 neo-border p-3 font-mono text-sm focus:outline-none bg-input-bg text-primary border-[var(--border)] uppercase min-h-[44px]"
                style={{ backgroundColor: 'var(--input-bg)' }}
              />
              <NeoButton 
                color="hot-pink" 
                onClick={() => { onSendRequest(search); setSearch(''); }} 
                className="px-4 py-2 text-xs min-h-[44px]"
              >
                SEND
              </NeoButton>
            </div>
          </div>

          {friendsState.receivedRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display text-2xl uppercase tracking-tighter text-hot-pink border-b-4 border-hot-pink">INCOMING CLEARANCE</h3>
              {friendsState.receivedRequests.map(req => (
                <div key={req.from} className="bg-surface neo-border neo-shadow p-4 border-l-[8px] border-l-hot-pink flex flex-col sm:flex-row items-center gap-4 border-[var(--border)]" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-10 neo-border overflow-hidden bg-slate-100 border-[var(--border)]">
                      <img src={req.avatar} alt="avatar" />
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-sm uppercase text-primary">{req.from}</p>
                      <p className="font-mono text-[8px] opacity-40 text-primary uppercase">REQUESTED ACCESS</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => onAcceptRequest(req)} className="flex-1 sm:flex-none p-2 neo-border bg-teal text-white hover:scale-110 border-[var(--border)] flex items-center justify-center"><Check className="w-4 h-4" /> <span className="sm:hidden ml-2 font-display text-xs">ACCEPT</span></button>
                    <button onClick={() => onDeclineRequest(req)} className="flex-1 sm:flex-none p-2 neo-border bg-hot-pink text-white hover:scale-110 border-[var(--border)] flex items-center justify-center"><X className="w-4 h-4" /> <span className="sm:hidden ml-2 font-display text-xs">DECLINE</span></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friendsState.sentRequests.length > 0 && (
            <div className="space-y-4 opacity-70">
              <h3 className="font-display text-xl uppercase tracking-tighter text-primary opacity-40">SENT REQUESTS</h3>
              {friendsState.sentRequests.map(username => (
                <div key={username} className="bg-surface neo-border p-3 flex justify-between items-center">
                  <span className="font-display text-sm uppercase text-primary">{username}</span>
                  <button onClick={() => onCancelRequest(username)} className="text-[10px] font-slab uppercase text-hot-pink hover:underline">CANCEL</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center & Right Column: Friends & Challenges */}
        <div className="lg:col-span-2 space-y-8">
          {friendsState.challenges.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display text-2xl uppercase tracking-tighter text-gold border-b-4 border-gold">PENDING CHALLENGES</h3>
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {friendsState.challenges.map(chall => (
                  <div key={chall.id} className="bg-surface neo-border neo-shadow p-6 space-y-4 border-t-8 border-gold border-[var(--border)]" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="font-slab text-xs uppercase opacity-40 text-primary">INCOMING FROM</p>
                        <h4 className="font-display text-2xl md:text-3xl uppercase text-primary truncate">{chall.from}</h4>
                      </div>
                      <div className="bg-gold neo-border px-3 py-1 flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-lg md:text-xl font-black">◆ {chall.wager}</span>
                      </div>
                    </div>
                    <div className="bg-surface-alt p-2 neo-border flex justify-between font-mono text-[10px] md:text-xs border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
                      <span>LEVEL: {chall.difficulty}</span>
                      <span className="text-hot-pink font-bold">2:15:00 REMAINING</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <NeoButton color="teal" onClick={() => onAcceptChallenge(chall)} className="flex-1 text-sm min-h-[48px]">ACCEPT & PLAY</NeoButton>
                      <button onClick={() => onDeclineChallenge(chall.id)} className="font-slab text-sm uppercase opacity-40 hover:opacity-100 italic py-2">DECLINE CHALLENGE</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-display text-2xl uppercase tracking-tighter text-primary border-b-4 border-primary" style={{ borderBottomColor: 'var(--border)' }}>ACTIVE ROSTER ({friendsState.friends.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {friendsState.friends.map(friend => (
                <div key={friend.username} className="bg-surface neo-border neo-shadow flex flex-col group border-[var(--border)] overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <div className="p-4 flex gap-4 items-center">
                    <div className="relative">
                      <div className="w-12 h-12 neo-border border-[var(--border)] overflow-hidden bg-slate-100">
                        <img src={friend.avatar} alt="avatar" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full neo-border border-[var(--border)] ${friend.status === 'online' ? 'bg-green animate-pulse' : 'bg-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-xl uppercase text-primary">{friend.username}</h4>
                      <div className="flex gap-3 font-mono text-[9px] uppercase opacity-40 text-primary">
                        <span>◆ {friend.cp} CP</span>
                        <span>{friend.status === 'online' ? 'ACTIVE NOW' : `LAST: ${friend.lastSeen}`}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onReport(friend.username)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 neo-border border-[var(--border)] bg-surface text-primary hover:bg-hot-pink hover:text-white"
                      style={{ backgroundColor: 'var(--surface)' }}
                    >
                       <Flag className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col border-t-2 border-primary overflow-hidden" style={{ borderTopColor: 'var(--border)' }}>
                    <div className="flex flex-col md:flex-row">
                      <button 
                        onClick={() => setChallengingFriend(challengingFriend === friend.username ? null : friend.username)}
                        className="flex-1 p-3 font-display text-xs md:text-sm uppercase bg-gold text-primary hover:bg-gold/80 transition-colors border-b-2 md:border-b-0 md:border-r-2 border-primary"
                        style={{ borderBottomColor: 'var(--border)', borderRightColor: 'var(--border)' }}
                      >
                        [ CHALLENGE ]
                      </button>
                      <button className="flex-1 p-3 font-display text-xs md:text-sm uppercase bg-surface text-primary hover:bg-teal hover:text-white transition-colors" style={{ backgroundColor: 'var(--surface)' }}>
                        [ VIEW PROFILE ]
                      </button>
                    </div>
                    <button 
                      onClick={() => onReport(friend.username)}
                      className="md:hidden border-t-2 border-primary p-2 font-display text-[10px] uppercase bg-hot-pink text-white"
                      style={{ borderTopColor: 'var(--border)' }}
                    >
                      REPORT OPERATIVE
                    </button>
                  </div>

                  <AnimatePresence>
                    {challengingFriend === friend.username && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-surface-alt text-primary"
                        style={{ backgroundColor: 'var(--surface-alt)' }}
                      >
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                             {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map(d => (
                               <button 
                                 key={d}
                                 onClick={() => setChallengeDiff(d)}
                                 className={`p-1 neo-border text-[10px] font-display uppercase transition-all ${challengeDiff === d ? 'bg-hot-pink border-hot-pink text-white' : 'bg-surface text-primary/40'}`}
                                 style={{ backgroundColor: challengeDiff === d ? '' : 'var(--surface)' }}
                               >
                                 {d}
                               </button>
                             ))}
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="font-mono text-xs">WAGER: ◆ {challengeWager}</div>
                             <div className="flex gap-2">
                                <button onClick={() => setChallengeWager(Math.max(10, challengeWager - 10))} className="w-6 h-6 neo-border bg-surface text-primary" style={{ backgroundColor: 'var(--surface)' }}>-</button>
                                <button onClick={() => setChallengeWager(Math.min(user.cp, challengeWager + 10))} className="w-6 h-6 neo-border bg-surface text-primary" style={{ backgroundColor: 'var(--surface)' }}>+</button>
                             </div>
                          </div>
                          <NeoButton 
                            color="hot-pink" 
                            className="w-full text-xs" 
                            onClick={() => {
                              onChallenge(friend.username, challengeDiff, challengeWager);
                              setChallengingFriend(null);
                            }}
                          >
                            ISSUE CHALLENGE
                          </NeoButton>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            {friendsState.friends.length === 0 && (
              <div className="py-20 text-center space-y-4 bg-surface-alt neo-border neo-border-dashed border-navy/20" style={{ backgroundColor: 'var(--surface-alt)' }}>
                 <p className="font-display text-2xl uppercase opacity-20 text-primary">NO OPERATIVES IN NETWORK</p>
                 <p className="font-slab text-sm opacity-40 text-primary uppercase">RECRUIT NEW AGENTS TO START CHALLENGES</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StorePage = ({ 
  user,
  onBack,
  owned,
  equipped,
  onPurchase,
  onEquip,
  onUpdateCP
}: { 
  user: User, 
  onBack: () => void,
  owned: StoreOwned,
  equipped: StoreEquipped,
  onPurchase: (type: keyof StoreOwned, id: number, cost: number) => void,
  onEquip: (type: keyof StoreEquipped, id: number) => void,
  onUpdateCP: (delta: number) => void
}) => {
  const [activeTab, setActiveTab] = useState<'AVATARS' | 'SKINS' | 'PEG SETS' | 'BADGES'>('AVATARS');

  const AvatarTab = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
      {AVATARS.map(item => {
        const isOwned = owned.avatars.includes(item.id);
        const isActive = equipped.avatarId === item.id;
        const canAfford = user.cp >= item.cost;

        return (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-surface neo-border neo-shadow flex flex-col relative ${isActive ? 'border-[6px] border-hot-pink' : 'border-[var(--border)]'}`}
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            {isActive && (
              <div className="absolute -top-2 -right-2 bg-hot-pink text-white px-3 py-1 font-display text-xs rotate-12 neo-border z-10 border-[var(--border)]">ACTIVE</div>
            )}
            <div style={{ backgroundColor: item.color }} className="h-24 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center neo-border border-[var(--border)]">
                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.svgSeed}`} alt={item.name} className="w-12 h-12" />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-1">
              <h4 className="font-display text-xl uppercase tracking-tighter text-primary">{item.name}</h4>
              <p className="font-sans text-xs opacity-40 uppercase mb-4 text-primary">{item.title}</p>
              
              {!isOwned && (
                <div className="bg-gold neo-border border-[var(--border)] px-2 py-1 self-start mb-4 flex items-center gap-1">
                  <span className="font-mono text-xs font-black text-primary">◆ {item.cost} CP</span>
                </div>
              )}

              {isOwned ? (
                <NeoButton 
                  color={isActive ? 'navy' : 'teal'} 
                  disabled={isActive}
                  className="w-full text-xs"
                  onClick={() => onEquip('avatarId', item.id)}
                >
                  {isActive ? 'EQUIPPED' : 'EQUIP'}
                </NeoButton>
              ) : (
                <NeoButton 
                  color="hot-pink" 
                  disabled={!canAfford}
                  className={`w-full text-xs ${!canAfford ? 'bg-navy opacity-50' : ''}`}
                  onClick={() => onPurchase('avatars', item.id, item.cost)}
                >
                  {canAfford ? 'UNLOCK' : `NEED ${item.cost - user.cp} CP`}
                </NeoButton>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const SkinTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      {BOARD_SKINS.map(item => {
        const isOwned = owned.skins.includes(item.id);
        const isActive = equipped.skinId === item.id;
        const canAfford = user.cp >= item.cost;

        return (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-surface neo-border neo-shadow flex flex-col border-[var(--border)] w-full ${isActive ? 'rotate-[-1deg] ring-4 ring-hot-pink' : ''}`}
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <div className="h-24 md:h-32 p-4 flex flex-col gap-2 overflow-hidden neo-border-b border-primary" style={{ borderBottomColor: 'var(--border)', backgroundColor: item.bg }}>
               {/* Mini Mockup */}
               {[1,2,3].map(i => (
                 <div key={i} className="flex gap-1">
                    {[1,2,3,4].map(j => (
                      <div key={j} className="w-6 h-6 rounded-full border-2 border-primary opacity-20" style={{ borderColor: 'var(--border)' }} />
                    ))}
                    <div className="flex-1 border-l-4" style={{ borderColor: item.accent }} />
                 </div>
               ))}
            </div>
            <div className="p-4 flex justify-between items-center bg-surface-alt">
               <div>
                  <h4 className="font-display text-xl uppercase text-primary">{item.name}</h4>
                  {!isOwned && <span className="font-mono text-xs text-gold font-bold">◆ {item.cost} CP</span>}
               </div>
               {isOwned ? (
                  <NeoButton color={isActive ? 'navy' : 'teal'} disabled={isActive} className="px-4 py-1 text-sm" onClick={() => onEquip('skinId', item.id)}>
                    {isActive ? 'ACTIVE' : 'APPLY'}
                  </NeoButton>
               ) : (
                  <NeoButton color="hot-pink" disabled={!canAfford} className="px-4 py-1 text-sm" onClick={() => onPurchase('skins', item.id, item.cost)}>
                    UNLOCK
                  </NeoButton>
               )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-12" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="sticky top-0 z-50 bg-nav-bg -mx-6 px-6 py-4 border-b-4 border-orange flex flex-wrap justify-between items-center text-primary gap-4" style={{ backgroundColor: 'var(--nav-bg)' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 neo-border border-[var(--border)] overflow-hidden bg-slate-100">
            <img src={user.avatar} alt="me" />
          </div>
          <span className="font-display text-lg md:text-xl uppercase tracking-tighter">{user.username}</span>
        </div>
        <div className="bg-gold neo-border border-navy px-4 py-1 text-navy flex items-center gap-2">
           <span className="font-mono text-xl md:text-2xl font-black">◆ {user.cp} CP</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="font-display text-6xl md:text-8xl tracking-tighter uppercase text-stroke">CIPHER STORE</h1>
        <p className="font-slab text-xl uppercase opacity-60 italic">SPEND YOUR CP. FLEX YOUR CIPHER.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 border-b-4 border-primary custom-scrollbar no-scrollbar scroll-smooth" style={{ borderBottomColor: 'var(--border)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(['AVATARS', 'SKINS', 'PEG SETS', 'BADGES'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 neo-border font-display text-lg md:text-xl uppercase transition-all flex-shrink-0 ${activeTab === tab ? 'bg-navy text-white neo-shadow' : 'bg-surface text-primary border-[var(--border)]'}`}
            style={{ backgroundColor: activeTab === tab ? 'var(--border)' : 'var(--surface)', boxShadow: activeTab === tab ? '8px 8px 0px var(--shadow)' : 'none' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           transition={{ duration: 0.3 }}
        >
          {activeTab === 'AVATARS' && <AvatarTab />}
          {activeTab === 'SKINS' && <SkinTab />}
          {activeTab === 'PEG SETS' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
               {PEG_SETS.map(set => {
                 const isOwned = owned.pegSets.includes(set.id);
                 const isActive = equipped.pegSetId === set.id;
                 return (
                   <div key={set.id} className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 border-[var(--border)]" style={{ backgroundColor: 'var(--card-bg)' }}>
                      <div className="flex gap-2 justify-center py-4 bg-surface-alt neo-border border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
                        {set.colors.map((c, i) => (
                          <div key={i} style={{ backgroundColor: c }} className="w-6 h-6 rounded-full neo-border border-navy" />
                        ))}
                      </div>
                      <h4 className="font-display text-xl uppercase text-center text-primary">{set.name}</h4>
                      {isOwned ? (
                         <NeoButton color={isActive ? 'navy' : 'teal'} disabled={isActive} onClick={() => onEquip('pegSetId', set.id)}>
                            {isActive ? 'ACTIVE' : 'USE'}
                         </NeoButton>
                      ) : (
                         <NeoButton color="hot-pink" onClick={() => onPurchase('pegSets', set.id, set.cost)}>UNLOCK ◆ {set.cost}</NeoButton>
                      )}
                   </div>
                 );
               })}
             </div>
          )}
          {activeTab === 'BADGES' && (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {BADGES.map(b => {
                  const isOwned = owned.badges.includes(b.id);
                  const isActive = equipped.badgeId === b.id;
                  
                  const BadgeIcon = () => {
                    switch(b.id) {
                      case 0: return <Unlock className="w-8 h-8" />;
                      case 1: return <Shield className="w-8 h-8" />;
                      case 2: return <Lightning className="w-8 h-8" />;
                      case 3: return <Ghost className="w-8 h-8" />;
                      case 4: return <Search className="w-8 h-8" />;
                      case 5: return <Star className="w-8 h-8" />;
                      case 6: return <Brain className="w-8 h-8" />;
                      case 7: return <Calendar className="w-8 h-8" />;
                      default: return <Trophy className="w-8 h-8" />;
                    }
                  };

                  return (
                    <div key={b.id} className={`bg-surface neo-border neo-shadow p-4 flex flex-col items-center gap-2 text-center group cursor-help ${!isOwned ? 'opacity-50' : ''} border-[var(--border)]`} style={{ backgroundColor: 'var(--card-bg)' }}>
                       <div className="text-primary h-12 flex items-center justify-center">
                          <BadgeIcon />
                       </div>
                       <h5 className="font-display text-sm uppercase text-primary">{b.name}</h5>
                       {b.type === 'earned' ? (
                          <div className="font-sans text-[10px] uppercase opacity-40 invisible group-hover:visible text-primary">{b.condition}</div>
                       ) : (
                          !isOwned && <span className="font-mono text-xs font-bold text-hot-pink">◆ {b.cost} CP</span>
                       )}
                       {isOwned ? (
                          <NeoButton color={isActive ? 'navy' : 'teal'} disabled={isActive} className="w-full text-[10px] px-2 py-1" onClick={() => onEquip('badgeId', b.id)}>
                             {isActive ? 'EQUIPPED' : 'EQUIP'}
                          </NeoButton>
                       ) : b.type === 'purchase' ? (
                          <NeoButton color="orange" className="w-full text-[10px] px-2 py-1" onClick={() => onPurchase('badges', b.id, b.cost || 0)}>BUY</NeoButton>
                       ) : (
                          <div className="w-full bg-surface-alt text-muted font-display text-[10px] py-1 neo-border border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>LOCKED</div>
                       )}
                    </div>
                  );
                })}
             </div>
          )}
        </motion.div>
      </AnimatePresence>

      <NeoButton color="white" icon={LogOut} onClick={onBack} className="mt-12">RETURN TO TERMINAL</NeoButton>
    </div>
  );
};

// --- Page 9: Daily Ops ---
const DailyOpsPage = ({ 
  user,
  tasks,
  stats,
  streak,
  onBack,
  onClaim
}: { 
  user: User, 
  tasks: DailyTaskState[],
  stats: TodayStats,
  streak: StreakData,
  onBack: () => void,
  onClaim: (taskId: string) => void
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      const diff = end.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const tasksCompleted = tasks.filter(t => t.status === 'completed' || t.status === 'claimed').length;
  const allComplete = tasksCompleted >= 5;

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6 max-w-4xl mx-auto space-y-8 md:space-y-12 pb-32" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="text-center space-y-2">
        <h1 className="font-display text-5xl md:text-8xl tracking-tighter uppercase text-stroke px-2">DAILY OPS</h1>
        <p className="font-mono text-sm md:text-xl uppercase text-primary opacity-60" style={{ fontSize: 'clamp(14px, 4vw, 20px)' }}>RESETS IN {timeLeft}</p>
      </div>

      {/* Persistence / Streak Card */}
      <div className="bg-gold neo-border neo-shadow p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-navy text-center md:text-left">
        <div className="absolute -top-10 -right-10 text-9xl opacity-10">🔥</div>
        <div className="w-full">
           <h3 className="font-display text-2xl md:text-3xl uppercase tracking-tighter">🔥 OPERATIVE STREAK: {streak.currentStreak} DAYS</h3>
           <p className="font-slab text-sm uppercase opacity-60 mt-1">Next bonus: +500 CP at Day 14</p>
        </div>
        <div className="w-full md:w-64 space-y-2">
           <div className="flex justify-between font-mono text-xs font-bold">
              <span>{streak.currentStreak}/14 DAYS</span>
              <span>{Math.round((streak.currentStreak % 14) / 14 * 100)}%</span>
           </div>
           <div className="h-4 w-full bg-white neo-border p-1 border-navy">
              <motion.div className="h-full bg-navy" initial={{ width: 0 }} animate={{ width: `${(streak.currentStreak % 14) / 14 * 100}%` }} />
           </div>
        </div>
      </div>

      {/* Global Progress */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h4 className="font-display text-2xl uppercase text-primary">OPERATIONAL PROGRESS</h4>
          <span className="font-mono font-bold text-xl text-primary">{tasksCompleted} / 5 TASKS</span>
        </div>
        <div className="h-8 w-full bg-surface neo-border p-1" style={{ backgroundColor: 'var(--surface)' }}>
           <motion.div 
             className={`h-full ${allComplete ? 'bg-green animate-pulse' : 'bg-gold'}`} 
             initial={{ width: 0 }} 
             animate={{ width: `${tasksCompleted / 5 * 100}%` }} 
           />
        </div>
        {allComplete && <p className="font-slab text-center text-green font-black uppercase text-xl">ALL OPS COMPLETE • BONUS UNLOCKED</p>}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {getDailyTasksSeeded(new Date().toISOString().split('T')[0]).map((task, i) => {
          const state = tasks.find(t => t.taskId === task.id) || { status: 'active', progress: 0 };
          const isBonus = task.type === 'bonus';
          const isLocked = isBonus && tasksCompleted < 5;
          const isClaimed = state.status === 'claimed';
          const isReady = state.status === 'completed';

          return (
            <motion.div 
              key={task.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`neo-border neo-shadow p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative border-[var(--border)] ${isReady ? 'bg-gold text-navy' : isClaimed ? 'bg-surface border-l-[12px] border-l-green text-primary' : isLocked ? 'bg-surface-alt opacity-60 text-primary' : 'bg-surface text-primary'}`}
              style={{ backgroundColor: isReady ? '#FFD600' : isClaimed ? 'var(--card-bg)' : isLocked ? 'var(--surface-alt)' : 'var(--card-bg)' }}
            >
              {/* Task Header info */}
               <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`w-10 h-10 md:w-12 md:h-12 neo-border border-[var(--border)] flex-shrink-0 flex items-center justify-center bg-navy text-white ${isClaimed ? 'bg-green' : ''}`}>
                  {isClaimed ? <ClipboardCheck className="w-5 h-5 md:w-6 md:h-6" /> : isBonus ? <Star className="w-5 h-5 md:w-6 md:h-6" /> : <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                <div className="flex-1 md:hidden overflow-hidden">
                  <h5 className="font-display text-lg uppercase tracking-tighter truncate break-words">{task.name}</h5>
                   <div className="font-mono text-sm font-black ml-auto">+{task.reward} CP</div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left w-full overflow-hidden">
                 <h5 className="hidden md:block font-display text-xl uppercase tracking-tighter break-words">{task.name}</h5>
                 <p className="font-slab text-xs md:text-sm opacity-60 uppercase break-words">{task.description}</p>
                 {task.target > 1 && !isClaimed && (
                   <div className="mt-4 w-full h-3 bg-surface-alt neo-border border-[var(--border)] overflow-hidden" style={{ backgroundColor: 'var(--surface-alt)' }}>
                      <div className="h-full bg-navy" style={{ width: `${(state.progress / task.target) * 100}%` }} />
                   </div>
                 )}
              </div>
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-primary/10">
                 <div className="hidden md:block text-left md:text-right">
                    <span className="block font-mono text-xl md:text-2xl font-black">+{task.reward} CP</span>
                    {isClaimed && <span className="text-[10px] font-slab uppercase text-green font-bold">CLAIMED</span>}
                 </div>
                 {isClaimed && <span className="md:hidden text-[10px] font-slab uppercase text-green font-bold">CLAIMED</span>}
                 {isReady && (
                   <motion.button 
                     animate={{ scale: [1, 1.05, 1] }} 
                     transition={{ repeat: Infinity, duration: 1 }}
                     onClick={() => onClaim(task.id)}
                     className="bg-navy text-white neo-border px-6 py-2 font-display uppercase neo-shadow hover:translate-y-[-2px] border-[var(--border)] min-h-[44px] w-full md:w-auto"
                   >
                     CLAIM
                   </motion.button>
                 )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <NeoButton color="white" icon={LogOut} onClick={onBack} className="w-full">RETURN TO HOME</NeoButton>
    </div>
  );
};

// --- Page 10: Landing/Main Updated ---
const LandingBanner = ({ user, setView, tasks }: { user: User, setView: (v: View) => void, tasks: DailyTaskState[] }) => {
  const completed = tasks.filter(t => t.status === 'completed' || t.status === 'claimed').length;
  return (
    <motion.div 
      onClick={() => setView('daily')}
      whileHover={{ y: -4, boxShadow: '12px 12px 0px var(--shadow)' }}
      className="bg-surface neo-border neo-shadow p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group border-[var(--border)]"
      style={{ backgroundColor: 'var(--card-bg)' }}
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-gold neo-border border-navy flex items-center justify-center text-navy group-hover:rotate-12 transition-transform">
           <ClipboardList className="w-10 h-10" />
        </div>
        <div className="text-center md:text-left">
           <h3 className="font-display text-3xl uppercase tracking-tighter group-hover:text-hot-pink transition-colors text-primary">DAILY OPS</h3>
           <p className="font-slab text-sm uppercase opacity-40 italic text-primary">COMPLETE TASKS. EARN MASSIVE CP.</p>
        </div>
      </div>
      <div className="flex flex-col items-center md:items-end gap-2">
         <span className="font-mono text-xl font-black text-primary">{completed} / 6 TASKS</span>
         <div className="w-48 h-4 bg-surface-alt neo-border p-1 border-[var(--border)]" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <div className="h-full bg-gold" style={{ width: `${completed / 6 * 100}%` }} />
         </div>
      </div>
    </motion.div>
  );
};


// --- Mobile Components ---

const MobileDrawer = ({ isOpen, onClose, setView }: { isOpen: boolean, onClose: () => void, setView: (v: View) => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[100]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-64 bg-surface border-l-4 border-navy z-[101] flex flex-col pt-16"
            style={{ backgroundColor: 'var(--surface)' }}
          >

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-primary"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="flex flex-col">
              {[
                { name: 'HOME', view: 'landing' as View },
                { name: 'RANKINGS', view: 'leaderboard' as View },
                { name: 'NETWORK', view: 'friends' as View },
                { name: 'STORE', view: 'store' as View },
                { name: 'DAILY OPS', view: 'daily' as View },
                { name: 'AI LAB', view: 'ai' as View },
                { name: 'PROFILE', view: 'profile' as View }
              ].map(link => (
                <button
                  key={link.name}
                  onClick={() => { setView(link.view); onClose(); }}
                  className="h-16 flex items-center px-6 font-display text-xl uppercase border-b-4 border-[var(--border)] text-primary hover:bg-surface-alt transition-colors"
                  style={{ borderBottomColor: 'var(--border)' }}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const BottomNav = ({ activeView, setView }: { activeView: View, setView: (v: View) => void }) => {
  const tabs = [
    { id: 'landing', icon: '🏠', label: 'HOME' },
    { id: 'leaderboard', icon: '🏆', label: 'RANK' },
    { id: 'store', icon: '🛒', label: 'STORE' },
    { id: 'daily', icon: '📋', label: 'OPS' },
    { id: 'ai', icon: '🤖', label: 'AI LAB' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t-4 border-[var(--border)] h-16 flex items-center justify-around z-50" style={{ backgroundColor: 'var(--surface)', borderTopColor: 'var(--border)' }}>
      {tabs.map(tab => {
        const active = activeView === tab.id;
        return (
          <button 
            key={tab.id}
            onClick={() => setView(tab.id as View)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all border-t-[3px] ${active ? 'border-hot-pink' : 'border-transparent'}`}
          >
            <span className={`text-[20px] ${active ? 'opacity-100' : 'opacity-60 grayscale'}`}>{tab.icon}</span>
            <span className={`text-[10px] font-display font-black mt-0.5 ${active ? 'text-hot-pink' : 'text-muted'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [view, setView] = useState<View>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [isVsAI, setIsVsAI] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState({ win: false, guesses: 0 });
  const [symbolMode, setSymbolMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // New States
  const [todayStats, setTodayStats] = useState<TodayStats>({
    loggedIn: true,
    gamesPlayed: 0,
    wins: 0,
    totalGuesses: 0,
    fastWin: false,
    noHintWin: false,
    hardWin: false,
    mediumPlayed: false,
    easyWinFewGuesses: false,
    mediumWinFewGuesses: false,
    hardWinFewGuesses: false,
    noRemovals: true,
    allColoursUsedInRow: false,
    firstGuessFast: false,
    aiBeatToday: false,
    flawlessStreak: 0,
    guesses: 0,
    time: 0,
    removals: 0
  });

  const [profileStats, setProfileStats] = useState<ProfileStats>({
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    bestStreak: 0,
    avgGuesses: 0,
    fastestWin: 0,
    gamesPlayed: 0,
    hintsUsed: 0,
    byDifficulty: {
      easy: { wins: 0, losses: 0, draws: 0, bestTime: 0, avgGuesses: 0 },
      medium: { wins: 0, losses: 0, draws: 0, bestTime: 0, avgGuesses: 0 },
      hard: { wins: 0, losses: 0, draws: 0, bestTime: 0, avgGuesses: 0 },
    }
  });

  const [dailyTasks, setDailyTasks] = useState<DailyTaskState[]>([]);
  const [owned, setOwned] = useState<StoreOwned>({ avatars: [0], skins: [0], pegSets: [0], badges: [] });
  const [equipped, setEquipped] = useState<StoreEquipped>({ avatarId: 0, skinId: 0, pegSetId: 0, badgeId: null });
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 1, longestStreak: 1, lastCompletedDate: '' });
  const [lastCompletedTask, setLastCompletedTask] = useState<DailyTask | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  const [activeReportTarget, setActiveReportTarget] = useState<string | null>(null);
  const [friendsState, setFriendsState] = useState<FriendsState>({
    friends: [
      { username: 'GHOST_AGENT', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=friend1', cp: 1200, status: 'online', lastSeen: 'NOW' },
      { username: 'NEO_RUNNER', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=friend2', cp: 850, status: 'offline', lastSeen: '2H AGO' }
    ],
    sentRequests: [],
    receivedRequests: [],
    challenges: []
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('cipher_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      loadUserData(u.username);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const loadUserData = (username: string) => {
    const savedStore = localStorage.getItem(getStorageKey(username, 'store'));
    const savedTasks = localStorage.getItem(getStorageKey(username, 'tasks'));
    const savedStats = localStorage.getItem(getStorageKey(username, 'today_stats'));
    const savedProfileStats = localStorage.getItem(getStorageKey(username, 'profile_stats'));
    const savedReports = localStorage.getItem(getStorageKey(username, 'reports'));
    const savedFriends = localStorage.getItem(getStorageKey(username, 'friends'));
    const savedTheme = localStorage.getItem(getStorageKey(username, 'theme'));

    if (savedStore) {
      const { owned: o, equipped: e } = JSON.parse(savedStore);
      if (o) setOwned(o);
      if (e) setEquipped(e);
    }
    if (savedProfileStats) setProfileStats(JSON.parse(savedProfileStats));
    if (savedReports) setReports(JSON.parse(savedReports));
    if (savedFriends) setFriendsState(JSON.parse(savedFriends));
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
    
    const today = new Date().toISOString().split('T')[0];
    if (savedTasks) {
       const parsed = JSON.parse(savedTasks);
       if (parsed.date === today) {
          setDailyTasks(parsed.tasks);
       } else {
          setDailyTasks(getDailyTasksSeeded(today).map(t => ({ taskId: t.id, status: 'active' as const, progress: 0 })));
       }
    } else {
       setDailyTasks(getDailyTasksSeeded(today).map(t => ({ taskId: t.id, status: 'active' as const, progress: 0 })));
    }
    
    if (savedStats) {
       const parsed = JSON.parse(savedStats);
       if (parsed.date === today) setTodayStats(parsed.stats);
    }
  };

  useEffect(() => {
    if (!user) return;
    localStorage.setItem('cipher_user', JSON.stringify(user));
    localStorage.setItem(getStorageKey(user.username, 'store'), JSON.stringify({ owned, equipped }));
    localStorage.setItem(getStorageKey(user.username, 'profile_stats'), JSON.stringify(profileStats));
    localStorage.setItem(getStorageKey(user.username, 'reports'), JSON.stringify(reports));
    localStorage.setItem(getStorageKey(user.username, 'friends'), JSON.stringify(friendsState));
    localStorage.setItem(getStorageKey(user.username, 'theme'), JSON.stringify(darkMode));
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(getStorageKey(user.username, 'tasks'), JSON.stringify({ date: today, tasks: dailyTasks }));
    localStorage.setItem(getStorageKey(user.username, 'today_stats'), JSON.stringify({ date: today, stats: todayStats }));
  }, [user, owned, equipped, dailyTasks, todayStats, profileStats, reports, friendsState, darkMode]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    loadUserData(newUser.username);
    setView('landing');
  };

  const handleToggleDark = () => setDarkMode(!darkMode);

  const handleStartGame = (d: Difficulty, vsAI: boolean = false) => {
    setActiveDifficulty(d);
    setIsVsAI(vsAI);
    setView('game');
  };


  const handleGameEnd = (win: boolean, guesses: number, matchStats?: any) => {
    setGameResult({ win, guesses });
    
    // Update Daily Stats
    const newStats = { ...todayStats };
    newStats.gamesPlayed += 1;
    newStats.totalGuesses += guesses;
    if (win) {
      newStats.wins += 1;
      if (matchStats.time < 90) newStats.fastWin = true;
      if (activeDifficulty === Difficulty.HARD) newStats.hardWin = true;
      if (activeDifficulty === Difficulty.EASY && guesses <= 4) newStats.easyWinFewGuesses = true;
      if (activeDifficulty === Difficulty.MEDIUM && guesses <= 3) newStats.mediumWinFewGuesses = true;
      if (activeDifficulty === Difficulty.HARD && guesses <= 4) newStats.hardWinFewGuesses = true;
      if (matchStats.removals === 0) newStats.noRemovals = true;
      newStats.noHintWin = matchStats.noHintWin;
    }
    if (activeDifficulty === Difficulty.MEDIUM) newStats.mediumPlayed = true;
    setTodayStats(newStats);

    // Update Profile Stats
    const diff = activeDifficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
    const newProfileStats = { ...profileStats };
    newProfileStats.gamesPlayed += 1;
    newProfileStats.byDifficulty[diff].wins += (win ? 1 : 0);
    newProfileStats.byDifficulty[diff].losses += (win ? 0 : 1);
    
    if (win) {
      newProfileStats.wins += 1;
      if (matchStats.time < newProfileStats.fastestWin || newProfileStats.fastestWin === 0) {
        newProfileStats.fastestWin = matchStats.time;
      }
      if (matchStats.time < newProfileStats.byDifficulty[diff].bestTime || newProfileStats.byDifficulty[diff].bestTime === 0) {
        newProfileStats.byDifficulty[diff].bestTime = matchStats.time;
      }
      if (matchStats.noHintWin === false) {
        newProfileStats.hintsUsed += 1; // This is a bit simplified, but close enough
      }
    } else {
      newProfileStats.losses += 1;
    }

    // Averages
    newProfileStats.winRate = Math.round((newProfileStats.wins / newProfileStats.gamesPlayed) * 100);
    
    // Re-calc avg guesses
    const totalGuesses = profileStats.avgGuesses * (newProfileStats.gamesPlayed - 1) + guesses;
    newProfileStats.avgGuesses = totalGuesses / newProfileStats.gamesPlayed;
    
    const diffTotalGuesses = profileStats.byDifficulty[diff].avgGuesses * (newProfileStats.byDifficulty[diff].wins + newProfileStats.byDifficulty[diff].losses + newProfileStats.byDifficulty[diff].draws - 1) + guesses;
    newProfileStats.byDifficulty[diff].avgGuesses = diffTotalGuesses / (newProfileStats.byDifficulty[diff].wins + newProfileStats.byDifficulty[diff].losses + newProfileStats.byDifficulty[diff].draws);

    setProfileStats(newProfileStats);
    
    // Check Tasks
    checkTasks(newStats);
    setShowResult(true);
  };

  const checkTasks = (stats: TodayStats) => {
    const todayTasks = getDailyTasksSeeded(new Date().toISOString().split('T')[0]);
    const newState = [...dailyTasks];
    let justCompleted: DailyTask | null = null;

    todayTasks.forEach(task => {
       const taskState = newState.find(t => t.taskId === task.id);
       if (!taskState || taskState.status !== 'active') return;

       let progress = 0;
       switch(task.id) {
         case 'T01': progress = stats.loggedIn ? 1 : 0; break;
         case 'T02': progress = stats.gamesPlayed; break;
         case 'T03': progress = stats.totalGuesses; break;
         case 'T06': progress = stats.wins; break;
         case 'T07': progress = stats.wins; break;
         case 'T08': progress = stats.fastWin ? 1 : 0; break;
         case 'T09': progress = stats.easyWinFewGuesses ? 1 : 0; break;
         case 'T11': progress = stats.gamesPlayed; break;
         case 'T12': progress = stats.mediumPlayed ? 1 : 0; break;
         case 'T13': progress = stats.hardWin ? 1 : 0; break;
         case 'T14': progress = stats.mediumWinFewGuesses ? 1 : 0; break;
         case 'T15': progress = stats.hardWinFewGuesses ? 1 : 0; break;
         case 'T17': progress = stats.noRemovals ? 1 : 0; break;
       }

       taskState.progress = Math.min(progress, task.target);
       if (taskState.progress >= task.target) {
          taskState.status = 'completed';
          justCompleted = task;
       }
    });

    setDailyTasks(newState);
    if (justCompleted) setLastCompletedTask(justCompleted);
  };

  const handleDeclineChallenge = (id: string) => {
    setFriendsState(s => ({
      ...s,
      challenges: s.challenges.filter(c => c.id !== id)
    }));
  };

  const handleReport = (report: any) => {
    setReports([...reports, { ...report, id: Date.now(), timestamp: Date.now() }]);
    setActiveReportTarget(null);
  };

  const handleSendRequest = (username: string) => {
    if (!username || username === user?.username) return;
    if (friendsState.sentRequests.includes(username)) return;
    setFriendsState(s => ({ ...s, sentRequests: [...s.sentRequests, username] }));
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    setFriendsState(s => ({
      ...s,
      receivedRequests: s.receivedRequests.filter(r => r.from !== req.from),
      friends: [...s.friends, { 
        username: req.from, 
        avatar: req.avatar, 
        cp: 500, 
        status: 'online', 
        lastSeen: 'NOW' 
      }]
    }));
  };

  const handleDeclineRequest = (req: FriendRequest) => {
    setFriendsState(s => ({
      ...s,
      receivedRequests: s.receivedRequests.filter(r => r.from !== req.from)
    }));
  };

  const handleCancelRequest = (username: string) => {
    setFriendsState(s => ({
      ...s,
      sentRequests: s.sentRequests.filter(u => u !== username)
    }));
  };

  const handleChallenge = (friend: string, difficulty: Difficulty, wager: number) => {
    alert(`Challenge issued to ${friend} on ${difficulty} with wager ${wager} CP!`);
  };

  const handleAcceptChallenge = (chall: Challenge) => {
    setActiveDifficulty(chall.difficulty);
    setView('game');
    setFriendsState(s => ({
      ...s,
      challenges: s.challenges.filter(c => c.id !== chall.id)
    }));
  };

  const handleClaim = (taskId: string) => {
    const task = MASTER_TASKS[taskId];
    if (!task || !user) return;
    
    const newState = dailyTasks.map(t => t.taskId === taskId ? { ...t, status: 'claimed' as const } : t);
    setDailyTasks(newState);
    setUser({ ...user, cp: user.cp + task.reward });
    setLastCompletedTask(null);
  };

  const handlePurchase = (type: keyof StoreOwned, id: number, cost: number) => {
    if (!user || user.cp < cost) return;
    setUser({ ...user, cp: user.cp - cost });
    setOwned({ ...owned, [type]: [...owned[type], id] });
  };

  const handleEquip = (type: keyof StoreEquipped, id: number) => {
    setEquipped({ ...equipped, [type]: id });
    if (type === 'avatarId' && user) {
       const av = AVATARS.find(a => a.id === id);
       if (av) setUser({ ...user, avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${av.svgSeed}` });
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Global Accessibility Toggle */}
      <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 bg-surface neo-border p-2 neo-shadow border-[var(--border)]" style={{ backgroundColor: 'var(--surface)' }}>
        <button 
          onClick={() => setSymbolMode(!symbolMode)} 
          className={`px-3 py-1 neo-border font-display text-xs uppercase transition-colors border-[var(--border)] ${symbolMode ? 'bg-primary text-surface' : 'bg-surface text-primary'}`}
          style={symbolMode ? { backgroundColor: 'var(--text-primary)', color: 'var(--surface)' } : { backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
        >
          {symbolMode ? <Eye className="w-4 h-4 inline mr-1" /> : <EyeOff className="w-4 h-4 inline mr-1" />}
          SYMBOLS {symbolMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} setView={setView} />

      <AnimatePresence mode="wait">
        {view === 'loading' && (
          <LoadingScreen key="loading" onComplete={() => setView('auth')} />
        )}

        {view === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AuthScreen onLogin={handleLogin} />
          </motion.div>
        )}

        {view === 'landing' && user && (
          <motion.div key="landing" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="pb-24">
             <LandingPage user={user} setView={setView} onStartGame={(d) => handleStartGame(d, false)} onToggleMenu={() => setIsMenuOpen(true)} onToggleDark={handleToggleDark} darkMode={darkMode} />
          </motion.div>
        )}


        {view === 'profile' && user && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfilePage 
              user={user}
              stats={profileStats}
              ownedAvatars={owned.avatars}
              equippedAvatarId={equipped.avatarId}
              onBack={() => setView('landing')}
              onUpdateAvatar={(url, id) => {
                const av = AVATARS.find(a => a.id === id);
                if (av && user) {
                  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${av.svgSeed}`;
                  setUser({ ...user, avatar: avatarUrl });
                }
                setEquipped({ ...equipped, avatarId: id });
              }}
            />
          </motion.div>
        )}

        {view === 'game' && user && activeDifficulty && (
          <motion.div key="game" initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
            <GameBoard 
              user={user} 
              difficulty={activeDifficulty} 
              isVsAI={isVsAI}
              equipped={equipped}
              onBack={() => setView('landing')} 
              onResult={handleGameEnd}
              symbolMode={symbolMode}
              onUpdateCP={(cp) => setUser({ ...user, cp })}
            />
          </motion.div>
        )}

        {view === 'store' && user && (
           <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StorePage 
                user={user} 
                owned={owned} 
                equipped={equipped}
                onPurchase={handlePurchase}
                onEquip={handleEquip}
                onUpdateCP={(d) => setUser({ ...user, cp: user.cp + d })}
                onBack={() => setView('landing')} 
              />
           </motion.div>
        )}

        {view === 'daily' && user && (
           <motion.div key="daily" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DailyOpsPage 
                user={user} 
                tasks={dailyTasks}
                stats={todayStats}
                streak={streak}
                onBack={() => setView('landing')} 
                onClaim={handleClaim}
              />
           </motion.div>
        )}

        {view === 'leaderboard' && user && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LeaderboardPage 
              user={user}
              onBack={() => setView('landing')} 
              onReport={setActiveReportTarget}
            />
          </motion.div>
        )}

        {view === 'friends' && user && (
          <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <FriendsPage 
               user={user}
               friendsState={friendsState}
               onBack={() => setView('landing')}
               onSendRequest={handleSendRequest}
               onAcceptRequest={handleAcceptRequest}
               onDeclineRequest={handleDeclineRequest}
               onCancelRequest={handleCancelRequest}
               onChallenge={handleChallenge}
               onAcceptChallenge={handleAcceptChallenge}
               onDeclineChallenge={handleDeclineChallenge}
               onReport={setActiveReportTarget}
             />
          </motion.div>
        )}

        {view === 'ai' && user && (
          <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AILabPage 
              onBack={() => setView('landing')}
              onChallenge={(d) => {
                setActiveDifficulty(d);
                setIsVsAI(true);
                setView('game');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeReportTarget && (
          <ReportModal 
            targetUsername={activeReportTarget}
            onClose={() => setActiveReportTarget(null)}
            onSubmit={handleReport}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResult && activeDifficulty && user && (
          <ResultOverlay 
            win={gameResult.win} 
            guessesUsed={gameResult.guesses}
            completedTask={lastCompletedTask}
            user={user}
            difficulty={activeDifficulty}
            onClose={(newCp) => {
              setUser({ ...user, cp: newCp });
              setShowResult(false);
              setView('landing');
              setLastCompletedTask(null);
            }}
          />
        )}
      </AnimatePresence>

      {user && view !== 'loading' && view !== 'auth' && (
        <BottomNav activeView={view} setView={setView} />
      )}
    </div>
  );
}
