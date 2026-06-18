import React, { useEffect, useState } from 'react';
import { Heart, RefreshCw, Volume2, VolumeX, ShieldAlert, Zap, Timer } from 'lucide-react';
import { globalSynth } from '../sound';

interface GameHUDProps {
  score: number;
  highScore: number;
  wave: number;
  timeSecs: number;
  enemiesRemaining: number;
  hp: number;
  maxHp: number;
  specialGauge: number; // 0 to 100
  onMuteToggle: () => void;
  isMuted: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  wave,
  timeSecs,
  enemiesRemaining,
  hp,
  maxHp,
  specialGauge,
  onMuteToggle,
  isMuted,
}) => {
  const [showTutorial, setShowTutorial] = useState(true);

  // Format survival seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Fade out tutorial overlay after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTutorial(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  // Proportions
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const heartScaleClass = hpPercent <= 25 ? 'animate-bounce text-red-500' : 'text-rose-500';

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono select-none z-30">
      
      {/* Top row: Heath left, Waver center, Score high right */}
      <div className="w-full flex justify-between items-start">
        
        {/* PLAYER HEART RELIC CARD */}
        <div className="flex flex-col gap-1 pointer-events-auto bg-zinc-950/85 border border-zinc-800/60 backdrop-blur-md rounded-xl p-3 shadow-lg max-w-[210px] w-full items-start">
          <div className="flex items-center gap-2 mb-1.5 w-full">
            <Heart className={`w-5 h-5 ${heartScaleClass}`} fill={hpPercent > 0 ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest cursor-default">Hollow Health</span>
            {hpPercent <= 25 && hpPercent > 0 && (
              <span className="text-[10px] font-bold text-red-400 animate-pulse flex items-center gap-0.5 ml-auto">
                <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL
              </span>
            )}
          </div>
          
          {/* Glowing proportional lifebar */}
          <div className="w-full h-3.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 
                  ? 'bg-gradient-to-r from-red-700 to-rose-500' 
                  : hpPercent > 25 
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500' 
                    : 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
            {/* Gloss shine */}
            <div className="absolute top-0 inset-x-0 h-1 bg-white/10" />
          </div>

          <div className="flex justify-between w-full text-[10px] text-zinc-500 font-bold mt-1">
            <span>HP: <strong className="text-white font-semibold">{hp} / {maxHp}</strong></span>
            <span>{Math.round(hpPercent)}%</span>
          </div>
        </div>

        {/* MIDDLE WAVE STATUS BANNER */}
        <div className="flex flex-col items-center bg-zinc-950/90 border-2 border-violet-900/65 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-xl text-center self-start">
          <div className="font-pixel text-xs text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 font-bold uppercase tracking-wide" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            WAVE {wave}
          </div>
          
          <div className="text-[10px] text-zinc-400 font-bold tracking-widest mt-1 uppercase">
            {enemiesRemaining > 0 ? `Shadows: ${enemiesRemaining}` : 'Wave Cleared!'}
          </div>

          <div className="text-[10px] text-teal-400 font-semibold flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-teal-950/20 border border-teal-500/20 rounded-md">
            <Timer className="w-3.5 h-3.5 text-teal-400" />
            <span>{formatTime(timeSecs)}</span>
          </div>
        </div>

        {/* RIGHT SCORE METRICS CARD */}
        <div className="flex flex-col gap-1 items-end text-right">
          <div className="flex flex-col bg-zinc-950/85 border border-zinc-800/60 backdrop-blur-md rounded-xl p-3 shadow-lg min-w-[140px]">
            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold">Score Registry</span>
            <span className="text-white text-lg font-bold tracking-tight">{score.toLocaleString()}</span>
            
            <div className="border-t border-zinc-900 my-1 pt-1 flex justify-between gap-3 text-[9px] text-zinc-500 font-bold uppercase select-none">
              <span>Best</span>
              <span className="text-yellow-400">{highScore.toLocaleString()}</span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button 
            onClick={onMuteToggle}
            className="mt-2 p-2.5 bg-zinc-950/85 border border-zinc-800/60 hover:border-zinc-600 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer pointer-events-auto self-end flex items-center justify-center shadow-md active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
          </button>
        </div>

      </div>

      {/* Bottom Row: Tutorial on launch (left), Special Detonator (right) */}
      <div className="w-full flex items-end justify-between">
        
        {/* TUTORIAL FLOATER */}
        {showTutorial ? (
          <div className="flex flex-col bg-zinc-950/95 border border-zinc-800/80 backdrop-blur-lg rounded-xl p-3.5 max-w-[260px] shadow-2xl animate-fade-in pointer-events-auto">
            <h4 className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-1.5">🕹️ HOLLOW TRIAL MANIFEST</h4>
            <ul className="text-[10px] text-zinc-300 flex flex-col gap-1 leading-relaxed">
              <li>• <span className="text-yellow-400 font-bold">WASD / Arrow Keys</span> to glide Hollow</li>
              <li>• <span className="text-yellow-400 font-bold">Mouse Aim + Click</span> to slash Crescents</li>
              <li>• <span className="text-yellow-400 font-bold">Defeat enemies</span> to collect glowing souls</li>
              <li>• <span className="text-yellow-400 font-bold">SPACEBAR</span> triggers Hollow Blast at 100%</li>
            </ul>
          </div>
        ) : (
          <div /> // spacer
        )}

        {/* SOUL RESONANCE SPACEBAR GAUGE */}
        <div className="flex flex-col gap-1.5 pointer-events-auto bg-zinc-950/85 border border-zinc-800/60 backdrop-blur-md rounded-xl p-3 shadow-lg max-w-[260px] w-full select-none items-stretch">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-teal-400 uppercase tracking-widest flex items-center gap-1 select-none">
              <Zap className={`w-3.5 h-3.5 ${specialGauge === 100 ? 'text-teal-400 animate-pulse' : 'text-zinc-500'}`} />
              Resonance Gauge
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] ${specialGauge === 100 ? 'bg-teal-950 border border-teal-500 text-teal-300 animate-bounce' : 'bg-zinc-900 text-zinc-500'}`}>
              {specialGauge === 100 ? 'READY' : 'CHARGING'}
            </span>
          </div>

          <div className="w-full h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ${
                specialGauge === 100 
                  ? 'bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-300 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-800 to-teal-600'
              }`}
              style={{ width: `${specialGauge}%` }}
            />
            <div className="absolute top-0 inset-x-0 h-0.5 bg-white/10" />
          </div>

          {specialGauge === 100 ? (
            <div className="text-[9px] font-pixel text-center text-teal-400 font-bold tracking-wider animate-pulse pt-0.5">
              [SPACEBAR] - TRIGGER SOUL RESONANCE!
            </div>
          ) : (
            <div className="flex justify-between text-[9px] text-zinc-500 font-bold pt-0.5">
              <span>Suck fallen souls to charge</span>
              <span>{Math.round(specialGauge)}%</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default GameHUD;
