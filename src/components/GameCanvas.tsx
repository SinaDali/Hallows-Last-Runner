import React, { useEffect, useRef } from 'react';
import { 
  PlayerState, 
  EnemyState, 
  ProjectileState, 
  CollectibleState, 
  ParticleState, 
  FloatingTextState, 
  Pillar 
} from '../types';
import { drawKingHollow, drawCrawler, drawSpecter, drawWarden } from '../utils/graphics';
import { globalSynth } from '../sound';

interface GameCanvasProps {
  userSprite: string | null;
  onGameUpdate: (stats: {
    score: number;
    hp: number;
    specialGauge: number;
    wave: number;
    timeSecs: number;
    enemiesRemaining: number;
  }) => void;
  onGameOver: (finalStats: {
    score: number;
    wave: number;
    enemiesDefeated: number;
    timeSurvived: number;
  }) => void;
  isMuted: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  userSprite,
  onGameUpdate,
  onGameOver,
  isMuted
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  const playerRef = useRef<PlayerState>({
    x: 400, y: 300, vx: 0, vy: 0, radius: 18,
    hp: 100, maxHp: 100, speed: 3.8,
    facing: 'right', moveState: 'idle',
    attackCooldown: 0, specialCharge: 0, invincibilityFrames: 0,
  });

  const enemiesRef = useRef<EnemyState[]>([]);
  const projectilesRef = useRef<ProjectileState[]>([]);
  const collectiblesRef = useRef<CollectibleState[]>([]);
  const particlesRef = useRef<ParticleState[]>([]);
  const floatingTextsRef = useRef<FloatingTextState[]>([]);

  const scoreRef = useRef<number>(0);
  const waveRef = useRef<number>(1);
  const enemiesDefeatedRef = useRef<number>(0);
  const timeSurvivedRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });

  const waveSpawnTotalRef = useRef<number>(12);
  const waveSpawnedRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const isTransitioningWaveRef = useRef<boolean>(false);
  const waveTransitionTimerRef = useRef<number>(0);

  const shakeDurationRef = useRef<number>(0);
  const shakeIntensityRef = useRef<number>(0);

  const pillars: Pillar[] = [
    { x: 200, y: 170, radius: 26, height: 62 },
    { x: 600, y: 170, radius: 26, height: 62 },
    { x: 200, y: 430, radius: 26, height: 62 },
    { x: 600, y: 430, radius: 26, height: 62 },
  ];

  const portals = [
    { x: 80, y: 90, color: '#a78bfa' },
    { x: 720, y: 90, color: '#a78bfa' },
    { x: 80, y: 510, color: '#a78bfa' },
    { x: 720, y: 510, color: '#a78bfa' },
    { x: 400, y: 60, color: '#2dd4bf' },
    { x: 400, y: 540, color: '#2dd4bf' },
  ];

  const onGameUpdateRef = useRef(onGameUpdate);
  const onGameOverRef = useRef(onGameOver);
  const isMutedRef = useRef(isMuted);

  // ==================== SPRITE LOADING ====================
  const userImgRef = useRef<HTMLImageElement | null>(null);
  const defaultSpriteRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Load Default PNG
    const defaultImg = new Image();
    defaultImg.src = '/assets/king-hollow-default.png';
    defaultImg.onload = () => {
      defaultSpriteRef.current = defaultImg;
      console.log("✅ Default King Hollow PNG loaded in Game");
    };
    defaultImg.onerror = () => console.error("❌ Failed to load default PNG in GameCanvas");

    // Load User Sprite
    if (userSprite) {
      const img = new Image();
      img.src = userSprite;
      img.onload = () => userImgRef.current = img;
    } else {
      userImgRef.current = null;
    }
  }, [userSprite]);

  useEffect(() => { onGameUpdateRef.current = onGameUpdate; }, [onGameUpdate]);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Main Game Loop (shortened for clarity - logic same)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let tick = 0;
    let gameActive = true;

    // ... (all your game logic functions like triggerShake, spawnParticles, etc. remain the same) ...

    const gameTick = () => {
      tick++;
      const player = playerRef.current;

      if (player.hp <= 0 && gameActive) {
        gameActive = false;
        // ... game over logic ...
        return;
      }

      // === All game logic (movement, enemies, etc.) stays the same ===

      // ==================== PLAYER DRAWING ====================
      const bob = Math.sin(tick * 0.12) * 2;
      ctx.save();
      ctx.translate(player.x, player.y + bob - 15);
      if (player.facing === 'left') ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false;

      if (userImgRef.current) {
        ctx.drawImage(userImgRef.current, -28, -36, 56, 72);
      } else if (defaultSpriteRef.current) {
        ctx.drawImage(defaultSpriteRef.current, -28, -36, 56, 72);
      } else {
        drawKingHollow(ctx, 0, 0, 56, 72, tick, player.moveState, 'right', false);
      }

      if (player.invincibilityFrames > 0 && Math.floor(tick / 4) % 2 === 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
        ctx.fillRect(-28, -36, 56, 72);
      }
      ctx.restore();

      // Crown
      ctx.fillStyle = '#caa30a';
      ctx.beginPath();
      const crownY = player.y - 42 + bob;
      ctx.moveTo(player.x - 8, crownY);
      ctx.lineTo(player.x - 6, crownY - 3);
      ctx.lineTo(player.x - 3, crownY - 1);
      ctx.lineTo(player.x, crownY - 5);
      ctx.lineTo(player.x + 3, crownY - 1);
      ctx.lineTo(player.x + 6, crownY - 3);
      ctx.lineTo(player.x + 8, crownY);
      ctx.lineTo(player.x - 8, crownY);
      ctx.fill();

      ctx.restore();

      // ... rest of drawing (enemies, pillars, etc.) same as before ...

      if (gameActive) animFrame = requestAnimationFrame(gameTick);
    };

    gameTick();

    return () => {
      gameActive = false;
      cancelAnimationFrame(animFrame);
    };
  }, [userSprite]);

  return (
    <div id="canvas-container" className="relative border-4 border-zinc-900 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center max-w-[808px] w-full max-h-[608px] h-full" style={{ aspectRatio: '4/3' }}>
      <div className="absolute inset-0 border border-violet-950/20 pointer-events-none rounded-xl" />
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="w-full h-full object-contain cursor-crosshair"
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.4)_100%)] select-none" />
    </div>
  );
};

export default GameCanvas;