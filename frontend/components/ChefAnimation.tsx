'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ChefAnimationProps {
  estado: string;
}

const STATIONS = [
  { id: 'ingredients', label: 'Buscando ingredientes', emoji: '🥚' },
  { id: 'mixing', label: 'Mezclando masa', emoji: '🥣' },
  { id: 'baking', label: 'Horneando', emoji: '🔥' },
  { id: 'decorating', label: 'Decorando', emoji: '🎨' },
  { id: 'packaging', label: 'Empacando', emoji: '📦' },
];

function ChefSVG({ station, progress }: { station: string; progress: number }) {
  const armAngle =
    station === 'mixing' ? Math.sin(progress * Math.PI * 4) * 25 :
    station === 'decorating' ? Math.sin(progress * Math.PI * 6) * 15 :
    station === 'packaging' ? -20 : 0;

  const bodyBob =
    station === 'ingredients' ? Math.sin(progress * Math.PI * 3) * 2 :
    station === 'mixing' ? Math.sin(progress * Math.PI * 4) * 3 : 0;

  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      {/* Shadow */}
      <ellipse cx="60" cy="112" rx="20" ry="4" fill="rgba(0,0,0,0.08)" />

      {/* Body group with bob */}
      <g transform={`translate(0, ${bodyBob})`}>
        {/* Legs */}
        <rect x="48" y="88" width="8" height="16" rx="3" fill="#5B4636" />
        <rect x="64" y="88" width="8" height="16" rx="3" fill="#5B4636" />

        {/* Shoes */}
        <ellipse cx="52" cy="104" rx="6" ry="3" fill="#3D2B1F" />
        <ellipse cx="68" cy="104" rx="6" ry="3" fill="#3D2B1F" />

        {/* Apron */}
        <rect x="42" y="62" width="36" height="30" rx="4" fill="#FFF5E6" stroke="#E8D5B7" strokeWidth="1" />
        <line x1="60" y1="62" x2="60" y2="92" stroke="#E8D5B7" strokeWidth="0.5" />

        {/* Torso */}
        <rect x="44" y="56" width="32" height="34" rx="6" fill="#E11D48" />

        {/* Arms */}
        <g transform={`rotate(${-armAngle}, 44, 62)`}>
          <rect x="28" y="58" width="16" height="8" rx="4" fill="#E11D48" />
          <circle cx="26" cy="62" r="5" fill="#FBBF24" />
        </g>
        <g transform={`rotate(${armAngle}, 76, 62)`}>
          <rect x="76" y="58" width="16" height="8" rx="4" fill="#E11D48" />
          <circle cx="94" cy="62" r="5" fill="#FBBF24" />
        </g>

        {/* Head */}
        <circle cx="60" cy="42" r="16" fill="#FBBF24" />

        {/* Face */}
        <circle cx="54" cy="40" r="2" fill="#3D2B1F" />
        <circle cx="66" cy="40" r="2" fill="#3D2B1F" />
        <path d="M55 48 Q60 52 65 48" fill="none" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />

        {/* Chef hat */}
        <ellipse cx="60" cy="30" rx="14" ry="4" fill="white" stroke="#E8D5B7" strokeWidth="0.5" />
        <rect x="48" y="18" width="24" height="14" rx="6" fill="white" stroke="#E8D5B7" strokeWidth="0.5" />
        <circle cx="52" cy="22" r="5" fill="white" />
        <circle cx="60" cy="19" r="5" fill="white" />
        <circle cx="68" cy="22" r="5" fill="white" />
      </g>

      {/* Station-specific items */}
      {station === 'ingredients' && (
        <g>
          <motion.text
            x="96" y="50" fontSize="14"
            animate={{ y: [50, 45, 50] }}
            transition={{ duration: 1, repeat: Infinity }}
          >🥚</motion.text>
          <motion.text
            x="16" y="55" fontSize="12"
            animate={{ y: [55, 50, 55] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          >🥛</motion.text>
        </g>
      )}

      {station === 'mixing' && (
        <motion.ellipse
          cx="60" cy="78" rx="10" ry="5"
          fill="#F5DEB3" stroke="#D2B48C" strokeWidth="1"
          animate={{ ry: [5, 6, 5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}

      {station === 'baking' && (
        <g>
          <rect x="80" y="70" width="24" height="20" rx="3" fill="#8B4513" />
          <rect x="82" y="72" width="20" height="10" rx="2" fill="#FF6B35" opacity="0.8" />
          <motion.rect
            x="84" y="74" width="4" height="6" rx="1"
            fill="#FFD700"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.rect
            x="90" y="73" width="4" height="7" rx="1"
            fill="#FF4500"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
        </g>
      )}

      {station === 'decorating' && (
        <g>
          <rect x="45" y="82" width="30" height="10" rx="3" fill="#F5DEB3" stroke="#D2B48C" strokeWidth="0.5" />
          <motion.circle
            cx="52" cy="80" r="2" fill="#E11D48"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.circle
            cx="60" cy="79" r="2" fill="#FF69B4"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle
            cx="68" cy="80" r="2" fill="#FFD700"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          />
        </g>
      )}

      {station === 'packaging' && (
        <g>
          <motion.g
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <rect x="78" y="74" width="22" height="18" rx="2" fill="#D2B48C" stroke="#8B4513" strokeWidth="0.5" />
            <line x1="78" y1="80" x2="100" y2="80" stroke="#8B4513" strokeWidth="0.5" />
            <line x1="89" y1="74" x2="89" y2="92" stroke="#8B4513" strokeWidth="0.5" />
          </motion.g>
        </g>
      )}
    </svg>
  );
}

function CompletedCake() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      {/* Plate */}
      <ellipse cx="60" cy="100" rx="35" ry="6" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="1" />

      {/* Cake base */}
      <rect x="35" y="75" width="50" height="22" rx="4" fill="#F5DEB3" stroke="#D2B48C" strokeWidth="1" />

      {/* Frosting drip */}
      <path d="M35 78 Q40 85 45 78 Q50 85 55 78 Q60 85 65 78 Q70 85 75 78 Q80 85 85 78"
        fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* Cake middle layer */}
      <rect x="38" y="70" width="44" height="10" rx="3" fill="#FBBF24" />

      {/* Frosting drip top */}
      <path d="M38 72 Q43 78 48 72 Q53 78 58 72 Q63 78 68 72 Q73 78 78 72"
        fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

      {/* Candle */}
      <rect x="58" y="55" width="4" height="16" rx="1" fill="#E11D48" />
      <motion.ellipse
        cx="60" cy="52" rx="4" ry="6"
        fill="#FFD700"
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <ellipse cx="60" cy="52" rx="2" ry="3" fill="#FFF5E6" />

      {/* Decorations */}
      <circle cx="45" cy="80" r="2" fill="#E11D48" />
      <circle cx="55" cy="78" r="2" fill="#FF69B4" />
      <circle cx="65" cy="79" r="2" fill="#10b981" />
      <circle cx="75" cy="80" r="2" fill="#FFD700" />

      {/* Sparkles */}
      <motion.g
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
      >
        <text x="25" y="50" fontSize="10">✨</text>
      </motion.g>
      <motion.g
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      >
        <text x="85" y="45" fontSize="10">✨</text>
      </motion.g>
      <motion.g
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
      >
        <text x="55" y="35" fontSize="10">⭐</text>
      </motion.g>
    </svg>
  );
}

export default function ChefAnimation({ estado }: ChefAnimationProps) {
  const [stationIndex, setStationIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const isActive = ['PENDIENTE', 'REVISANDO'].includes(estado);
  const isDone = estado === 'COTIZADA' || estado === 'ACEPTADA';

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          setStationIndex((i) => (i + 1) % STATIONS.length);
          return 0;
        }
        return p + 0.02;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  if (isDone) return null;

  const currentStation = STATIONS[stationIndex];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0.75rem',
      gap: '0.5rem',
    }}>
      <div style={{ width: '100px', height: '100px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStation.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ChefSVG station={currentStation.id} progress={progress} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.75rem',
        color: '#666',
      }}>
        <span>{currentStation.emoji}</span>
        <span>{currentStation.label}</span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >...</motion.span>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {STATIONS.map((s, i) => (
          <motion.div
            key={s.id}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i === stationIndex ? '#E11D48' : '#E0E0E0',
            }}
            animate={i === stationIndex ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}
