import React, { useEffect, useRef, useState } from 'react';
import { Twitter, UploadCloud, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { drawKingHollow } from '../utils/graphics';
import { globalSynth } from '../sound';

interface StartScreenProps {
  onStartGame: () => void;
  userSprite: string | null;
  onSpriteUpload: (dataUrl: string | null) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  userSprite,
  onSpriteUpload,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Background Particles + Mist Animation Loop
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let tick = 0;

    // Resizing
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Spawn stars/particles
    interface Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      color: string;
      alpha: number;
      alphaDir: number;
    }
    const particles: Particle[] = [];
    const colors = ['#2dd4bf', '#a78bfa', '#facc15', '#f87171'];
    
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.1,
        alphaDir: Math.random() > 0.5 ? 0.01 : -0.01,
      });
    }

    // Mist clouds
    interface MistCloud {
      x: number;
      y: number;
      vx: number;
      size: number;
      alpha: number;
    }
    const mistClouds: MistCloud[] = [];
    for (let i = 0; i < 6; i++) {
      mistClouds.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight - 200) + 100,
        vx: Math.random() * 0.3 + 0.1,
        size: Math.random() * 150 + 100,
        alpha: Math.random() * 0.15 + 0.05,
      });
    }

    const draw = () => {
      tick++;
      ctx.fillStyle = '#09090b'; // solid dark charcoal zinc-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw glowing circular gradient in center
      const centerGrad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.6
      );
      centerGrad.addColorStop(0, '#12072b'); // dark purple focus
      centerGrad.addColorStop(1, '#020005'); // true pure black
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Animate and draw star fields
      particles.forEach((p) => {
        p.y -= p.speed;
        p.alpha += p.alphaDir;

        if (p.alpha >= 0.8) {
          p.alpha = 0.8;
          p.alphaDir = -0.005;
        } else if (p.alpha <= 0.05) {
          p.alpha = 0.05;
          p.alphaDir = 0.005;
        }

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. Drawing flowing mist weather clouds
      mistClouds.forEach((c) => {
        c.x += c.vx;
        if (c.x - c.size > canvas.width) {
          c.x = -c.size;
          c.y = Math.random() * (canvas.height - 200) + 100;
        }

        const mistGlow = ctx.createRadialGradient(
          c.x + c.size / 2,
          c.y + c.size / 2,
          1,
          c.x + c.size / 2,
          c.y + c.size / 2,
          c.size
        );
        mistGlow.addColorStop(0, `rgba(139, 92, 246, ${c.alpha})`); // purple haze
        mistGlow.addColorStop(0.5, `rgba(45, 212, 191, ${c.alpha * 0.4})`); // teal merge
        mistGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = mistGlow;
        ctx.beginPath();
        ctx.arc(c.x + c.size / 2, c.y + c.size / 2, c.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw simple geometric retro grid accents in margins
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)'; // solid faint purple grid lines
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Avatar Preview Loop
  useEffect(() => {
    const canvas = avatarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let tick = 0;
    
    // User image loaded cache
    let loadedUserImg: HTMLImageElement | null = null;
    if (userSprite) {
      const img = new Image();
      img.src = userSprite;
      img.onload = () => {
        loadedUserImg = img;
      };
    }

    const drawPreview = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 15;

      // Under-foot shadow glow
      const shadowGrad = ctx.createRadialGradient(cx, cy + 18, 2, cx, cy + 18, 32);
      shadowGrad.addColorStop(0, 'rgba(45, 212, 191, 0.45)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (loadedUserImg) {
        // Draw loaded user character with procedurally calculated bobbing and floating sparks
        const bob = Math.sin(tick * 0.12) * 5;
        ctx.save();
        ctx.translate(cx, cy + bob - 15);
        ctx.imageSmoothingEnabled = false;
        
        // Draw image keeping centered alignment
        ctx.drawImage(loadedUserImg, -28, -36, 56, 72);
        ctx.restore();

        // Draw small gold indicator crown right above to show integration
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        const crownY = cy - 44 + bob;
        ctx.moveTo(cx - 10, crownY);
        ctx.lineTo(cx - 8, crownY - 4);
        ctx.lineTo(cx - 4, crownY - 1);
        ctx.lineTo(cx, crownY - 7);
        ctx.lineTo(cx + 4, crownY - 1);
        ctx.lineTo(cx + 8, crownY - 4);
        ctx.lineTo(cx + 10, crownY);
        ctx.lineTo(cx - 10, crownY);
        ctx.fill();
      } else {
        // Render beautiful procedural King Hollow sprite
        drawKingHollow(ctx, cx, cy - 15, 56, 72, tick, 'idle', 'right', false);
      }

      // Small ambient firefly magic pixels floating up from the hollow
      if (Math.random() < 0.15) {
        ctx.fillStyle = '#2dd4bf';
        ctx.fillRect(
          cx + (Math.random() * 50 - 25),
          cy + 10 - Math.random() * 50,
          2.5,
          2.5
        );
      }

      animFrame = requestAnimationFrame(drawPreview);
    };

    drawPreview();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [userSprite]);

  // Audio Toggle
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    globalSynth.muted = nextState;
    if (!nextState) {
      globalSynth.playCollect();
    }
  };

  // Image File Handling
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadStatus('❌ Image files only!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        onSpriteUpload(e.target.result);
        setUploadStatus('✅ Hollow Image Bound Successfully!');
        if (!isMuted) {
          globalSynth.playWaveComplete();
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const startAndPlaySound = () => {
    if (!isMuted) {
      globalSynth.playSpecial();
    }
    onStartGame();
  };

  const clearHollow = () => {
    onSpriteUpload(null);
    setUploadStatus(null);
    if (!isMuted) globalSynth.playHit();
  };

  return (
    <div id="start-screen" className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden select-none select-none text-white font-mono z-10 p-6 md:p-10">
      {/* Background canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full object-cover -z-10" />

      {/* Top Header Actions */}
      <div id="top-row" className="w-full flex items-center justify-between z-20">
        <button
          id="btn-volume"
          onClick={toggleMute}
          className="p-3 bg-zinc-900/85 border border-zinc-700/80 rounded-lg text-teal-400 hover:text-teal-300 hover:border-teal-500 transition-all flex items-center gap-2 text-sm max-sm:px-2 cursor-pointer shadow-lg active:scale-95"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-teal-400" />}
          <span className="hidden sm:inline font-bold uppercase tracking-wider">{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>

        <div id="author-tag" className="hidden md:flex flex-col items-end text-zinc-400 text-xs text-right">
          <span className="font-semibold text-zinc-500 uppercase tracking-widest text-[9px]">Dedicated project</span>
          <span className="text-teal-400 font-bold tracking-tight">Hollows NFT Fan game</span>
        </div>

        <button
          id="btn-help"
          onClick={() => {
            setShowHelp(!showHelp);
            if (!isMuted) globalSynth.playCollect();
          }}
          className="px-4 py-2 border border-violet-500/50 bg-violet-950/70 hover:bg-violet-900/90 text-violet-300 text-xs uppercase font-bold tracking-widest rounded-md cursor-pointer transition-all active:scale-95"
        >
          {showHelp ? 'Hide Controls' : 'Show Manual'}
        </button>
      </div>

      {/* Central Screen Body */}
      <div id="screen-body" className="flex flex-col items-center justify-center max-w-2xl text-center w-full my-auto transition-all duration-300">
        {/* Title container */}
        <div id="title-holder" className="flex flex-col items-center gap-1.5 mb-5 select-none scale-100 relative">
          <div className="absolute -top-10 -left-10 text-teal-500 animate-pulse opacity-45">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-6 -right-10 text-purple-500 animate-bounce opacity-40">
            <Sparkles className="w-6 h-6" />
          </div>

          <h1 
            id="main-title" 
            className="font-pixel text-[26px] md:text-[42px] font-bold leading-tight tracking-normal py-4 text-center cursor-default uppercase"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              textShadow: '0 4px 0 #3b0764, 0 8px 0 #1e1b4b, 0 12px 18px rgba(124, 58, 237, 0.6)'
            }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 block mb-1">
              Hollow's
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-violet-200 to-purple-500 block">
              Last Stand
            </span>
          </h1>
          
          <div id="sub-title" className="text-zinc-400 text-xs tracking-widest font-pixel">
            Fan Game by <span className="text-yellow-400 font-semibold hover:underline cursor-pointer">SinaDali</span>
          </div>
        </div>

        {/* Column wrapper for layout: Image uploader with live preview */}
        <div id="avatar-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full bg-zinc-950/65 border border-zinc-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl mb-6">
          
          {/* Animated Avatar Preview */}
          <div id="avatar-col" className="flex flex-col items-center border border-zinc-800/50 bg-black/45 rounded-xl p-4 relative min-h-[220px] justify-center">
            <div id="avatar-glow" className="absolute inset-0 bg-violet-600/5 blur-3xl rounded-full" />
            
            <span className="text-violet-300 text-[10px] uppercase tracking-widest font-pixel mb-1 text-zinc-500 font-semibold">Active Hollow</span>
            
            <canvas 
              ref={avatarCanvasRef} 
              width={140} 
              height={140} 
              className="w-32 h-32 relative border border-dashed border-teal-500/20 bg-zinc-900/10 rounded-xl"
            />

            <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest mt-2 flex items-center gap-1 cursor-default">
              {userSprite ? '👑 CROWNED CUSTOM NFT' : '👑 DEFAULT KING HOLLOW'}
            </span>
            
            {userSprite && (
              <button
                id="btn-remove"
                onClick={clearHollow}
                className="mt-2 text-[9px] text-red-400 hover:text-red-300 hover:underline uppercase tracking-widest font-bold"
              >
                Reset to King Hollow
              </button>
            )}
          </div>

          {/* Interactive Drag Drop Sprite Uploader */}
          <div id="uploader-col" className="flex flex-col items-stretch h-full justify-center">
            <div
              id="drop-zone"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[170px] ${
                dragOver 
                  ? 'border-teal-400 bg-teal-950/15' 
                  : userSprite 
                    ? 'border-purple-500/60 bg-purple-950/10' 
                    : 'border-zinc-800 bg-zinc-900/35 hover:border-zinc-700/80'
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              <UploadCloud className={`w-8 h-8 mb-2 ${userSprite ? 'text-purple-400' : 'text-zinc-400'}`} />
              
              <span className="text-xs text-zinc-200 uppercase font-bold tracking-wider mb-1">
                {userSprite ? 'Upload Replacement' : 'Bind Your Hollow image'}
              </span>
              <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[210px] mx-auto select-none">
                Drag and drop your own Hollow image or browse JPG/PNG. Transparent backgrounds recommended!
              </p>
            </div>

            {uploadStatus && (
              <div id="upload-status" className="mt-3 text-[10px] text-center font-bold tracking-wider animate-pulse text-teal-400">
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Buttons Row */}
        <div id="actions-row" className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full">
          <button
            id="btn-play"
            onClick={startAndPlaySound}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black font-pixel text-sm uppercase rounded-xl font-extrabold cursor-pointer transition-all hover:scale-105 active:scale-95 glowing-btn-teal flex items-center justify-center gap-3 border border-emerald-400/30"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Enter the Arena
          </button>
        </div>
      </div>

      {/* Manual Overlay if active */}
      {showHelp && (
        <div id="manual-modal" className="absolute inset-10 select-none z-50 bg-black/95 border border-violet-500/40 rounded-2xl p-6 md:p-8 flex flex-col justify-between backdrop-blur-xl transition-all shadow-2xl animate-fade-in text-left">
          <div className="flex flex-col gap-4">
            <h2 className="font-pixel text-md tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase border-b border-zinc-800 pb-3" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              HOLLOW MANUAL
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs leading-relaxed text-zinc-300">
              <div className="flex flex-col gap-3">
                <h3 className="text-teal-400 font-bold uppercase tracking-wider">🎮 CONTROLS</h3>
                <ul className="list-none flex flex-col gap-1.5">
                  <li><span className="text-yellow-400 font-bold font-pixel text-[10px] mr-2">W, A, S, D</span> / <span className="text-yellow-400 font-bold font-pixel text-[10px] mr-1">ARROWS</span> : Move Hollow</li>
                  <li><span className="text-yellow-400 font-bold font-pixel text-[10px] mr-2">MOUSE AIM</span> : Point void focus direction</li>
                  <li><span className="text-yellow-400 font-bold font-pixel text-[10px] mr-2">LEFT CLICK</span> : Cast Light Crescent Slashes</li>
                  <li><span className="text-yellow-400 font-bold font-pixel text-[10px] mr-2">SPACEBAR</span> : Detonate Hollow Resonance Blast</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-teal-400 font-bold uppercase tracking-wider">🔮 RESONANCE POWER</h3>
                <p>
                  Defeating Shadow Creeps drops glowing Soul Fireflies. Collecting them charges your <span className="text-teal-300 font-bold">Resonance Gauge</span>.
                </p>
                <p>
                  At <span className="text-teal-300 font-bold">100% capacity</span>, hit <span className="text-yellow-300 font-extrabold uppercase">SPACEBAR</span> to unleash a magnificent fullscreen wipe that vaporizes nearby entities with severe damage!
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
            <span className="text-[10px] text-zinc-500 font-bold">Tip: Custom uploaded Hollows will bob, walk, and battle seamlessly!</span>
            <button
              onClick={() => {
                setShowHelp(false);
                if (!isMuted) globalSynth.playCollect();
              }}
              className="px-4 py-2 border border-teal-500 bg-teal-950/40 text-teal-400 text-xs font-bold uppercase tracking-widest rounded-md cursor-pointer transition-all hover:bg-teal-900 active:scale-95"
            >
              Understand
            </button>
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div id="footer-row" className="w-full flex flex-col sm:flex-row items-center justify-between pointer-events-auto border-t border-zinc-950/40 pt-4 text-center text-[10px] text-zinc-500 gap-3 z-20 select-none">
        <span className="cursor-default">
          Hollow's Last Stand (c) 2026. This is a modular fan production. All IP belongs to respective founders.
        </span>
        
        <a
          id="twitter-anchor"
          href="https://x.com/hollows_nft"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/25 border border-sky-800/30 hover:border-sky-500 hover:bg-sky-900/40 text-sky-400 hover:text-sky-300 transition-all text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer active:scale-95"
          onClick={() => {
            if (!isMuted) globalSynth.playCollect();
          }}
        >
          <Twitter className="w-3.5 h-3.5" />
          Visit @hollows_nft
        </a>
      </div>
    </div>
  );
};
export default StartScreen;
