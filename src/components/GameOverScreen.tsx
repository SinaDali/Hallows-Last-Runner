import React, { useEffect, useState } from 'react';
import { Camera, RotateCcw, Twitter, Trophy, Award } from 'lucide-react';
import { globalSynth } from '../sound';

interface GameOverScreenProps {
  score: number;
  wave: number;
  enemiesDefeated: number;
  timeSurvived: number; // in seconds
  onRestart: () => void;
  userSprite: string | null;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  wave,
  enemiesDefeated,
  timeSurvived,
  onRestart,
  userSprite,
}) => {
  const [rankTitle, setRankTitle] = useState('');
  const [rankBadge, setRankBadge] = useState('');

  // Format survival time to MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Compute Rank Title based on score accomplishments
  useEffect(() => {
    if (score < 1500) {
      setRankTitle('Hollow Squire');
      setRankBadge('🥉');
    } else if (score < 4000) {
      setRankTitle('Misty Wanderer');
      setRankBadge('🥈');
    } else if (score < 8000) {
      setRankTitle('Crown Defender');
      setRankBadge('🥇');
    } else if (score < 15000) {
      setRankTitle('Shadow Slayer');
      setRankBadge('💎');
    } else {
      setRankTitle('King of the Hollows');
      setRankBadge('👑');
    }

    // Play Gameover chord
    globalSynth.playGameOver();
  }, [score]);

  // Dynamic high-res high-score screenshot cardboard builder
  const handleScreenshotSave = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 780;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw cardboard black metallic backdrop
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative nested frames
    ctx.strokeStyle = '#3b0764'; // purple border
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.strokeStyle = '#2dd4bf'; // teal accent trim
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Grid matrix aesthetic background dots
    ctx.fillStyle = 'rgba(124, 58, 237, 0.04)';
    for (let x = 30; x < canvas.width - 30; x += 25) {
      for (let y = 30; y < canvas.height - 30; y += 25) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // 2. Main Title Logo
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("★ HOLLOW'S LAST STAND ★", canvas.width / 2, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText("DEDICATED TO HOLLOWS NFT • PLAYER HIGH-SCORE REGISTER", canvas.width / 2, 85);

    // Divider line
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, 110);
    ctx.lineTo(canvas.width - 35, 110);
    ctx.stroke();

    // 3. Score summary display block
    ctx.fillStyle = '#18181b';
    ctx.fillRect(40, 130, canvas.width - 80, 100);
    ctx.strokeStyle = '#4c1d95';
    ctx.strokeRect(40, 130, canvas.width - 80, 100);

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText("FINAL SCORE ACCOMPLISHED", canvas.width / 2, 160);

    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 42px "Courier New", monospace';
    ctx.fillText(score.toLocaleString() + " PTS", canvas.width / 2, 212);

    // 4. Statistics values
    const stats = [
      { label: 'SOULS CLEANSED', value: `${enemiesDefeated} SHADOWS` },
      { label: 'RESISTED WAVE', value: `WAVE ${wave}` },
      { label: 'SURVIVAL TIMER', value: formatTime(timeSurvived) },
      { label: 'HOLLOW BIND TYPE', value: userSprite ? 'CUSTOM MULTI-NFT IMAGE' : 'DEFAULT KING HOLLOW' },
    ];

    let startY = 280;
    stats.forEach((st) => {
      // Row box backdrop
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, startY, canvas.width - 80, 48);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(40, startY, canvas.width - 80, 48);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(st.label, 60, startY + 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(st.value, canvas.width - 60, startY + 28);

      startY += 62;
    });

    // 5. Title badge block
    ctx.fillStyle = '#12072b';
    ctx.fillRect(40, startY + 10, canvas.width - 80, 95);
    ctx.strokeStyle = '#b45309'; // amber border
    ctx.strokeRect(40, startY + 10, canvas.width - 80, 95);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d97706';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText("ROYAL HOLLOW HONOR TITLE BIND", canvas.width / 2, startY + 36);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText(`${rankBadge} ${rankTitle} ${rankBadge}`, canvas.width / 2, startY + 70);

    // 6. Signatures and verification footers
    ctx.fillStyle = '#52525b';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(`VERIFIED IN CLIENT CONTAINER • STAMP DATE: ${new Date().toLocaleString()}`, canvas.width / 2, canvas.height - 55);
    ctx.fillText("DEVELOPED BY SINADALI • TWITTER: @HOLLOWS_NFT", canvas.width / 2, canvas.height - 40);

    // 7. Trigger standard local browser png download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `hollow_score_${score}.png`;
    link.click();
    
    globalSynth.playCollect();
  };

  return (
    <div id="game-over-screen" className="relative w-full h-full flex items-center justify-center bg-black/85 backdrop-blur-md z-45 animate-fade-in p-4 overflow-y-auto select-none">
      
      {/* Container framing */}
      <div className="w-full max-w-lg bg-zinc-950 border-2 border-violet-950/80 rounded-2xl p-6 md:p-8 flex flex-col justify-center items-stretch text-center shadow-2xl relative">
        {/* Glow behind */}
        <div className="absolute inset-0 bg-red-950/10 blur-3xl pointer-events-none rounded-full" />
        
        {/* Skull Icon Header */}
        <div className="mx-auto w-14 h-14 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-center mb-4 text-red-500 animate-pulse">
          <Award className="w-8 h-8" />
        </div>

        <h1 
          className="font-pixel text-[20px] md:text-[28px] uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-600 block leading-tight font-extrabold mb-2"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Crown Shattered
        </h1>
        
        <p className="text-zinc-500 text-xs tracking-widest font-mono uppercase mb-6">
          Your hollow has fallen in battle!
        </p>

        {/* Big Score Box */}
        <div className="flex flex-col items-center bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5 shadow-inner">
          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Final Score Registry</span>
          <span className="text-yellow-400 text-3xl font-pixel font-black tracking-tighter" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            {score.toLocaleString()}
          </span>
        </div>

        {/* Stat metrics table */}
        <div className="flex flex-col gap-2.5 font-mono text-sm text-zinc-300 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-zinc-900 px-1">
            <span className="text-zinc-500 font-bold uppercase text-xs flex items-center gap-1.5"><Trophy className="w-4 h-4 text-yellow-500" /> Resisted Wave</span>
            <span className="text-yellow-400 font-bold">Wave {wave}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-zinc-900 px-1">
            <span className="text-zinc-500 font-bold uppercase text-xs">Souls Cleansed</span>
            <span className="text-white font-bold">{enemiesDefeated} Shadows</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-zinc-900 px-1">
            <span className="text-zinc-500 font-bold uppercase text-xs">Survival Timer</span>
            <span className="text-white font-bold">{formatTime(timeSurvived)}</span>
          </div>
          
          <div className="flex flex-col bg-violet-950/20 border border-violet-900/30 rounded-lg p-3 text-center mt-3 justify-center items-center">
            <span className="text-[10px] text-violet-400 uppercase tracking-widest font-bold mb-1">Binding Title Achieved</span>
            <span className="text-violet-300 font-bold text-md flex items-center gap-1.5 font-pixel text-xs tracking-wide">
              {rankBadge} {rankTitle} {rankBadge}
            </span>
          </div>
        </div>

        {/* Buttons and Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black font-semibold tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Stand
          </button>

          <button
            onClick={handleScreenshotSave}
            className="w-full py-4 bg-zinc-800 border border-zinc-700 hover:border-teal-500 hover:text-teal-400 text-zinc-200 font-semibold tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-teal-400" />
            Save Poster
          </button>
        </div>

        {/* Social anchor */}
        <a
          href="https://x.com/hollows_nft"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-2 text-xs text-zinc-500 hover:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider font-bold"
        >
          <Twitter className="w-3.5 h-3.5 text-sky-400" />
          Discuss on @hollows_nft
        </a>
      </div>
    </div>
  );
};
export default GameOverScreen;
