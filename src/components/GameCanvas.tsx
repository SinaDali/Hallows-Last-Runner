import React, { useEffect, useRef, useState } from 'react';
import { 
  PlayerState, 
  EnemyState, 
  ProjectileState, 
  CollectibleState, 
  ParticleState, 
  FloatingTextState, 
  Pillar,
  HighScore 
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

  // Keyboard input state map
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  // Game instance parameters
  const playerRef = useRef<PlayerState>({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 18,
    hp: 100,
    maxHp: 100,
    speed: 3.8,
    facing: 'right',
    moveState: 'idle',
    attackCooldown: 0,
    specialCharge: 0,
    invincibilityFrames: 0,
  });

  const enemiesRef = useRef<EnemyState[]>([]);
  const projectilesRef = useRef<ProjectileState[]>([]);
  const collectiblesRef = useRef<CollectibleState[]>([]);
  const particlesRef = useRef<ParticleState[]>([]);
  const floatingTextsRef = useRef<FloatingTextState[]>([]);

  // Engine state counters
  const scoreRef = useRef<number>(0);
  const waveRef = useRef<number>(1);
  const enemiesDefeatedRef = useRef<number>(0);
  const timeSurvivedRef = useRef<number>(0); // in seconds
  const isMouseDownRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });

  // Spawning controls
  const waveSpawnTotalRef = useRef<number>(12);
  const waveSpawnedRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const isTransitioningWaveRef = useRef<boolean>(false);
  const waveTransitionTimerRef = useRef<number>(0);

  // Screen shake metrics
  const shakeDurationRef = useRef<number>(0);
  const shakeIntensityRef = useRef<number>(0);

  // Static Columns
  const pillars: Pillar[] = [
    { x: 200, y: 170, radius: 26, height: 62 },
    { x: 600, y: 170, radius: 26, height: 62 },
    { x: 200, y: 430, radius: 26, height: 62 },
    { x: 600, y: 430, radius: 26, height: 62 },
  ];

  // Portals
  const portals = [
    { x: 80, y: 90, color: '#a78bfa' },
    { x: 720, y: 90, color: '#a78bfa' },
    { x: 80, y: 510, color: '#a78bfa' },
    { x: 720, y: 510, color: '#a78bfa' },
    { x: 400, y: 60, color: '#2dd4bf' },
    { x: 400, y: 540, color: '#2dd4bf' },
  ];

  // Cache user custom image
  const [userImg, setUserImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (userSprite) {
      const img = new Image();
      img.src = userSprite;
      img.onload = () => setUserImg(img);
    } else {
      setUserImg(null);
    }
  }, [userSprite]);

  // Main Loop orchestrator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let tick = 0;
    let gameActive = true;

    // Helper functions inside loop scope
    const triggerShake = (dur: number, intensity: number) => {
      shakeDurationRef.current = dur;
      shakeIntensityRef.current = intensity;
    };

    const spawnParticles = (x: number, y: number, color: string, count: number, speedMultiplier = 1.0) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 2 + 1) * speedMultiplier;
        particlesRef.current.push({
          id: Math.random().toString(),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1,
          color,
          alpha: 1.0,
          life: 0,
          maxLife: Math.random() * 20 + 15,
        });
      }
    };

    const spawnDamageText = (x: number, y: number, text: string, color: string) => {
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        x,
        y: y - 10,
        text,
        color,
        life: 0,
        maxLife: 40,
      });
    };

    // Initialize Wave configurations
    const initWave = (w: number) => {
      waveRef.current = w;
      isTransitioningWaveRef.current = true;
      waveTransitionTimerRef.current = 150; // frames to delay before spawning
      waveSpawnedRef.current = 0;
      waveSpawnTotalRef.current = 8 + w * 5; // ramp enemy headcount incrementally
      
      if (!isMuted) {
        globalSynth.playWaveComplete();
      }
      
      triggerShake(15, 3);
      spawnDamageText(400, 200, `WAVE ${w} SURVIVAL`, '#facc15');
    };

    // Fire default wave
    initWave(1);

    // Canvas keyboard binding
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space') {
        const player = playerRef.current;
        if (player.specialCharge >= 100 && gameActive) {
          triggerSpecialPower();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Translate coordinates accurately inside the CSS resized 800x600 canvas
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePosRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    // ULTIMATE FULLSCREEN WIPE RESONANCE DETONATION
    const triggerSpecialPower = () => {
      const player = playerRef.current;
      player.specialCharge = 0;
      
      if (!isMuted) {
        globalSynth.playSpecial();
      }
      
      triggerShake(45, 12);
      spawnDamageText(player.x, player.y - 25, "RESONANCE DETONATED!", '#06b6d4');

      // Wipe all current enemy projectiles
      projectilesRef.current = projectilesRef.current.filter(p => p.isPlayerOwned);

      // Inflict critical splash values to all shadow beasts
      enemiesRef.current.forEach((en) => {
        const dx = en.x - player.x;
        const dy = en.y - player.y;
        const dist = Math.hypot(dx, dy);
        
        // Fullscreen dynamic range
        if (dist < 420) {
          const dmg = 85;
          en.hp -= dmg;
          en.hitFlash = 12;
          
          // Knock shadows backwards dramatically away from center core
          const pushForce = 12;
          en.vx = (dx / dist) * pushForce;
          en.vy = (dy / dist) * pushForce;

          spawnDamageText(en.x, en.y - 12, `${dmg}`, '#2dd4bf');
          spawnParticles(en.x, en.y, '#2dd4bf', 15, 1.5);
        }
      });
    };

    // Clock ticker in seconds
    const intervalId = setInterval(() => {
      if (gameActive) {
        timeSurvivedRef.current += 1;
      }
    }, 1000);

    // Background Misty overlay particles (drawn behind models)
    interface GroundGlyph {
      x: number;
      y: number;
      size: number;
      alpha: number;
      fadeSpeed: number;
    }
    const glyphs: GroundGlyph[] = [];

    // Periodic emitter function helper
    const gameTick = () => {
      tick++;
      const player = playerRef.current;

      if (player.hp <= 0 && gameActive) {
        gameActive = false;
        clearInterval(intervalId);
        onGameOver({
          score: scoreRef.current,
          wave: waveRef.current,
          enemiesDefeated: enemiesDefeatedRef.current,
          timeSurvived: timeSurvivedRef.current,
        });
        return;
      }

      // Decrement timers
      if (player.invincibilityFrames > 0) player.invincibilityFrames--;
      if (player.attackCooldown > 0) player.attackCooldown--;

      // 1. INPUT HANDLE (WASD movement physics)
      let dx = 0;
      let dy = 0;
      if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= 1;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= 1;
      if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        // Normalize diagonals
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }

      // Dampen velocity to create slide glide feel
      player.vx = player.vx * 0.72 + dx * player.speed * 0.28;
      player.vy = player.vy * 0.72 + dy * player.speed * 0.28;

      player.x += player.vx;
      player.y += player.vy;

      // Update movement animations states
      if (Math.hypot(player.vx, player.vy) > 0.4) {
        player.moveState = 'walk';
        if (player.vx > 0.1) player.facing = 'right';
        if (player.vx < -0.1) player.facing = 'left';
      } else {
        player.moveState = 'idle';
      }

      // Constrain inside map borders
      const borderPad = 15;
      if (player.x < borderPad) { player.x = borderPad; player.vx = 0; }
      if (player.x > 800 - borderPad) { player.x = 800 - borderPad; player.vx = 0; }
      if (player.y < borderPad) { player.y = borderPad; player.vy = 0; }
      if (player.y > 600 - borderPad) { player.y = 600 - borderPad; player.vy = 0; }

      // Obstacle Stone Pillars slide collisions
      pillars.forEach((p) => {
        const pdx = player.x - p.x;
        const pdy = player.y - p.y;
        const dist = Math.hypot(pdx, pdy);
        const minDist = player.radius + p.radius;
        if (dist < minDist) {
          const overlap = minDist - dist;
          // Shove player gently away along collision normal
          player.x += (pdx / dist) * overlap;
          player.y += (pdy / dist) * overlap;
        }
      });

      // 2. SHOOTING HANDLE (Mouse left inputs)
      // Check mouse target position relative to player
      const angleToMouse = Math.atan2(
        mousePosRef.current.y - player.y,
        mousePosRef.current.x - player.x
      );

      // Left-clicks emit Royal light slash shapes
      if (isMouseDownRef.current && player.attackCooldown <= 0) {
        player.attackCooldown = 20; // attack speed delay rate
        player.moveState = 'attack';

        if (!isMuted) {
          globalSynth.playSlash();
        }

        // Slight screen recoil
        triggerShake(6, 1.2);

        // Spawn crescent projectile
        projectilesRef.current.push({
          id: Math.random().toString(),
          isPlayerOwned: true,
          x: player.x + Math.cos(angleToMouse) * 15,
          y: player.y + Math.sin(angleToMouse) * 15,
          vx: Math.cos(angleToMouse) * 6.5,
          vy: Math.sin(angleToMouse) * 6.5,
          radius: 16,
          damage: 15 + Math.floor(waveRef.current * 1.5),
          color: '#facc15',
          type: 'slice',
          life: 45, // frames span survival duration before fading
        });

        // Spawn a trailing gold sword slash crescent arc particle
        spawnParticles(player.x, player.y, '#facc15', 3, 0.4);
      }

      // 3. COMBAT WAVE ENGINE & Portal spawning
      if (isTransitioningWaveRef.current) {
        waveTransitionTimerRef.current--;
        if (waveTransitionTimerRef.current <= 0) {
          isTransitioningWaveRef.current = false;
        }
      } else {
        // Periodically spawn shadow creeps based on wave guidelines
        if (waveSpawnedRef.current < waveSpawnTotalRef.current) {
          spawnTimerRef.current--;
          if (spawnTimerRef.current <= 0) {
            // Pick a spawner portal
            const portal = portals[Math.floor(Math.random() * portals.length)];
            
            // Craft enemy specs based on active difficulty levels
            const randType = Math.random();
            let type: 'crawler' | 'specter' | 'warden' = 'crawler';
            let hp = 15 + waveRef.current * 4;
            let speed = 1.45 + Math.min(1.2, waveRef.current * 0.12);
            let size = 15;

            // Introduce specter on Wave 2+, warden on Wave 3+
            if (waveRef.current >= 3 && randType > 0.8) {
              type = 'warden';
              hp = 80 + waveRef.current * 12;
              speed = 0.85 + Math.min(0.4, waveRef.current * 0.04);
              size = 25;
            } else if (waveRef.current >= 2 && randType > 0.5) {
              type = 'specter';
              hp = 12 + waveRef.current * 3;
              speed = 2.15 + Math.min(0.6, waveRef.current * 0.08);
              size = 12;
            }

            enemiesRef.current.push({
              id: Math.random().toString(),
              type,
              x: portal.x,
              y: portal.y,
              vx: 0,
              vy: 0,
              radius: size,
              hp,
              maxHp: hp,
              speed,
              hitFlash: 0,
              shootCooldown: 60 + Math.random() * 80,
            });

            // Spark effects at portal
            spawnParticles(portal.x, portal.y, '#c084fc', 8, 1.2);
            waveSpawnedRef.current++;
            
            // Faster spawns in advanced waves
            spawnTimerRef.current = Math.max(30, 110 - waveRef.current * 12);
          }
        } else if (enemiesRef.current.length === 0 && !isTransitioningWaveRef.current) {
          // All shadows in active wave cleared -> trigger next
          initWave(waveRef.current + 1);
        }
      }

      // 4. SHADOW CREEPS MOVEMENT & ATTACKS
      enemiesRef.current.forEach((en) => {
        // Diminish friction momentum, move towards player
        const dx = player.x - en.x;
        const dy = player.y - en.y;
        const dist = Math.hypot(dx, dy);

        let targetVx = (dx / dist) * en.speed;
        let targetVy = (dy / dist) * en.speed;

        // Specter unique bouncing flow
        if (en.type === 'specter') {
          // If too close, cycle around side to float back defensively
          if (dist < 190) {
            targetVx = -targetVx * 0.5 + Math.cos(tick * 0.05) * 1.5;
            targetVy = -targetVy * 0.5 + Math.sin(tick * 0.05) * 1.5;
          }
          
          // Specter shoots projectiles
          en.shootCooldown--;
          if (en.shootCooldown <= 0) {
            en.shootCooldown = 150 + Math.random() * 80;
            const angle = Math.atan2(dy, dx);
            
            // Spawn teal projectile
            projectilesRef.current.push({
              id: Math.random().toString(),
              isPlayerOwned: false,
              x: en.x,
              y: en.y,
              vx: Math.cos(angle) * 3.2,
              vy: Math.sin(angle) * 3.2,
              radius: 6.5,
              damage: 10 + waveRef.current * 1.5,
              color: '#2dd4bf',
              type: 'orb',
              life: 140,
            });

            spawnParticles(en.x, en.y, '#2dd4bf', 4, 0.4);
          }
        } else if (en.type === 'warden') {
          // Warden fires ground shockwaves and heavy magma fireballs
          en.shootCooldown--;
          if (en.shootCooldown <= 0) {
            en.shootCooldown = 220 + Math.random() * 100;
            const angle = Math.atan2(dy, dx);

            // Large heavy fire projectile
            projectilesRef.current.push({
              id: Math.random().toString(),
              isPlayerOwned: false,
              x: en.x,
              y: en.y,
              vx: Math.cos(angle) * 2.2,
              vy: Math.sin(angle) * 2.2,
              radius: 12,
              damage: 22 + waveRef.current * 2,
              color: '#f97316',
              type: 'heavy',
              life: 200,
            });

            spawnParticles(en.x, en.y, '#ea580c', 8, 0.6);
          }
        }

        en.vx = en.vx * 0.8 + targetVx * 0.2;
        en.vy = en.vy * 0.8 + targetVy * 0.2;

        en.x += en.vx;
        en.y += en.vy;

        // Slide collisions against static stone columns
        pillars.forEach((p) => {
          const pdx = en.x - p.x;
          const pdy = en.y - p.y;
          const pdist = Math.hypot(pdx, pdy);
          const pMin = en.radius + p.radius;
          if (pdist < pMin) {
            const overlap = pMin - pdist;
            en.x += (pdx / pdist) * overlap;
            en.y += (pdy / pdist) * overlap;
          }
        });

        // Push apart overlapping enemies (Boids spacing)
        enemiesRef.current.forEach((en2) => {
          if (en2.id === en.id) return;
          const edx = en2.x - en.x;
          const edy = en2.y - en.y;
          const edist = Math.hypot(edx, edy);
          const eMin = en.radius + en2.radius;
          if (edist < eMin) {
            const overlap = (eMin - edist) * 0.35;
            en.x -= (edx / edist) * overlap;
            en.y -= (edy / edist) * overlap;
            en2.x += (edx / edist) * overlap;
            en2.y += (edy / edist) * overlap;
          }
        });

        // Touch player damage collision
        const touchDist = Math.hypot(player.x - en.x, player.y - en.y);
        if (touchDist < player.radius + en.radius && player.invincibilityFrames <= 0 && gameActive) {
          const dmg = en.type === 'warden' ? 20 : 10;
          player.hp -= dmg;
          player.invincibilityFrames = 50; // frames
          
          if (!isMuted) {
            globalSynth.playPlayerDamage();
          }

          // Shove players back from impact
          const angle = Math.atan2(player.y - en.y, player.x - en.x);
          player.vx += Math.cos(angle) * 5;
          player.vy += Math.sin(angle) * 5;

          triggerShake(12, 4.5);
          spawnDamageText(player.x, player.y - 12, `-${dmg}`, '#ef4444');
          spawnParticles(player.x, player.y, '#dc2626', 10, 1.2);
        }
      });

      // 5. PROJECTILES UPDATER
      projectilesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Collides stone columns
        pillars.forEach((pillar) => {
          if (Math.hypot(p.x - pillar.x, p.y - pillar.y) < p.radius + pillar.radius) {
            p.life = 0; // shatter projectile
            spawnParticles(p.x, p.y, p.color, 4, 0.5);
          }
        });

        if (p.isPlayerOwned) {
          // Collide with shadow creeps
          enemiesRef.current.forEach((en) => {
            const hitDist = Math.hypot(en.x - p.x, en.y - p.y);
            if (hitDist < en.radius + p.radius) {
              p.life = 0; // absorb shot
              en.hp -= p.damage;
              en.hitFlash = 6; // flash frame ticker

              // Slight push shadow back from hit
              const angle = Math.atan2(en.y - p.y, en.x - p.x);
              en.vx += Math.cos(angle) * 1.5;
              en.vy += Math.sin(angle) * 1.5;

              if (!isMuted) {
                globalSynth.playHit();
              }

              spawnDamageText(en.x, en.y - 12, `${p.damage}`, '#facc15');
              spawnParticles(en.x, en.y, '#facc15', 6, 0.8);

              // Creep dead
              if (en.hp <= 0) {
                enemiesDefeatedRef.current++;
                
                // Score values
                let reward = 100;
                if (en.type === 'specter') reward = 150;
                if (en.type === 'warden') reward = 400;
                scoreRef.current += reward;

                // Spawns 2-3 soul firefly cells
                const drops = en.type === 'warden' ? 6 : en.type === 'specter' ? 3 : 2;
                for (let i = 0; i < drops; i++) {
                  collectiblesRef.current.push({
                    id: Math.random().toString(),
                    x: en.x + (Math.random() * 20 - 10),
                    y: en.y + (Math.random() * 20 - 10),
                    value: 4,
                    radius: 3.5,
                    color: '#2dd4bf',
                    isSpecialCharge: true,
                  });
                }

                // Extra visual dust
                spawnParticles(en.x, en.y, '#caa30a', 8, 0.4);
                spawnParticles(en.x, en.y, '#a78bfa', 8, 1.2);
              }
            }
          });
        } else {
          // Collide with Player
          const playerDist = Math.hypot(player.x - p.x, player.y - p.y);
          if (playerDist < player.radius + p.radius && player.invincibilityFrames <= 0 && gameActive) {
            p.life = 0;
            player.hp -= p.damage;
            player.invincibilityFrames = 50;

            if (!isMuted) {
              globalSynth.playPlayerDamage();
            }

            triggerShake(12, 4.0);
            spawnDamageText(player.x, player.y - 12, `-${p.damage}`, '#ef4444');
            spawnParticles(player.x, player.y, '#dc2626', 10, 1.0);
          }
        }
      });

      // Filter off-boundaries and dead projectiles
      projectilesRef.current = projectilesRef.current.filter(
        (p) => p.life > 0 && p.x > 0 && p.x < 800 && p.y > 0 && p.y < 600
      );

      // Clean dead enemies
      enemiesRef.current = enemiesRef.current.filter((en) => en.hp > 0);

      // 6. SOUL COLLECTIBLES PHYSICS (Vacuum system)
      collectiblesRef.current.forEach((col) => {
        const dx = player.x - col.x;
        const dy = player.y - col.y;
        const dist = Math.hypot(dx, dy);

        // Vacuum pull range
        if (dist < 165) {
          // Accelerate floating speed vacuum style
          const pullForce = Math.max(2.5, 9.5 - dist * 0.05);
          col.x += (dx / dist) * pullForce;
          col.y += (dy / dist) * pullForce;
        }

        // Touches player
        if (dist < player.radius + col.radius && gameActive) {
          col.radius = 0; // mark collected
          
          if (!isMuted) {
            globalSynth.playCollect();
          }

          // Inc charge
          player.specialCharge = Math.min(100, player.specialCharge + col.value);
          
          // Heal tiny amount
          player.hp = Math.min(player.maxHp, player.hp + 1);

          spawnParticles(player.x, player.y, '#2dd4bf', 3, 0.4);
        }
      });

      // Filter collected
      collectiblesRef.current = collectiblesRef.current.filter((col) => col.radius > 0);

      // 7. PARTICLES AND DEBRIS STEP
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1.0 - p.life / p.maxLife;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      // Floating damage texts step
      floatingTextsRef.current.forEach((t) => {
        t.y -= 0.65;
        t.life++;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter((t) => t.life < t.maxLife);

      // Spawns decorative glowing floor runes (glyphs)
      if (Math.random() < 0.035) {
        glyphs.push({
          x: Math.random() * 760 + 20,
          y: Math.random() * 560 + 20,
          size: Math.random() * 3 + 2,
          alpha: 0.1,
          fadeSpeed: 0.005,
        });
      }
      glyphs.forEach((gl) => {
        if (gl.alpha < 0.65) gl.alpha += gl.fadeSpeed;
      });

      // 8. GRAPHICS DRAW MATRICES
      ctx.save();
      
      // Screen Shake translation
      if (shakeDurationRef.current > 0) {
        const shakeX = (Math.random() * 2 - 1) * shakeIntensityRef.current;
        const shakeY = (Math.random() * 2 - 1) * shakeIntensityRef.current;
        ctx.translate(shakeX, shakeY);
        shakeDurationRef.current--;
      }

      ctx.fillStyle = '#0f0d13'; // dark charcoal moody purple room background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw masonry floor tiles grid lines
      ctx.strokeStyle = '#1e1b29';
      ctx.lineWidth = 1.5;
      const tSize = 50;
      for (let x = 0; x < canvas.width; x += tSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += tSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw faint cracks and ground rubble details
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#27203b';
      // Static decorative floor ruins
      ctx.beginPath();
      ctx.moveTo(350, 240); ctx.lineTo(365, 245); ctx.lineTo(360, 255);
      ctx.moveTo(480, 480); ctx.lineTo(495, 475); ctx.stroke();

      // Draw ground magical glowing runic glyph points
      glyphs.forEach((gl) => {
        ctx.fillStyle = `rgba(139, 92, 246, ${gl.alpha * 0.4})`; // purple glow
        ctx.beginPath();
        ctx.arc(gl.x, gl.y, gl.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(45, 212, 191, ${gl.alpha})`; // teal glowing diamond center
        ctx.fillRect(gl.x - gl.size / 2, gl.y - gl.size / 2, gl.size, gl.size);
      });

      // Draw portals and vortices
      portals.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(tick * 0.04);
        
        // Draw spinning galaxy spiral
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(15, -15, 28, 5, 30, 20);
          ctx.rotate(Math.PI / 2);
        }
        ctx.stroke();

        // Portal centerpiece core
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Collectible soul fireflies
      collectiblesRef.current.forEach((col) => {
        // Pulsing scale
        const sizeRatio = 1 + Math.sin(tick * 0.15 + col.x) * 0.2;
        const radius = col.radius * sizeRatio;
        
        const grad = ctx.createRadialGradient(col.x, col.y, 1, col.x, col.y, radius * 3);
        grad.addColorStop(0, 'rgba(45, 212, 191, 0.85)');
        grad.addColorStop(1, 'rgba(45, 212, 191, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(col.x, col.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(col.x, col.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spawn portal weather mists (drawn beneath characters)
      ctx.fillStyle = 'rgba(124, 58, 237, 0.015)'; // purple fog
      ctx.beginPath();
      ctx.arc(400, 300, 260 + Math.sin(tick * 0.01) * 20, 0, Math.PI * 2);
      ctx.fill();

      // Render Projectiles
      projectilesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        
        if (p.type === 'slice') {
          // Draw crescent light projection slashes
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, -Math.PI / 2.5, Math.PI / 2.5);
          ctx.arc(p.radius * 0.35, 0, p.radius * 0.85, Math.PI / 2.5, -Math.PI / 2.5, true);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          // Orbs and Fireballs
          const pRadGlow = ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, p.radius * 1.8);
          pRadGlow.addColorStop(0, '#ffffff');
          pRadGlow.addColorStop(0.3, p.color);
          pRadGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = pRadGlow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3D Y-SORTING ARRANGEMENT OF PLAYERS, ENEMIES, AND ARCH COLUMNS
      // Build list of drawables and sort them by current coordinate Y
      interface Renderable {
        type: 'player' | 'enemy' | 'pillar';
        y: number;
        index?: number;
        x?: number;
        obj?: any;
      }
      const sortedQueue: Renderable[] = [];

      sortedQueue.push({ type: 'player', y: player.y, x: player.x });
      enemiesRef.current.forEach((en, i) => {
        sortedQueue.push({ type: 'enemy', y: en.y, x: en.x, index: i, obj: en });
      });
      pillars.forEach((p, i) => {
        // Pillars are anchored at lower base (p.y)
        sortedQueue.push({ type: 'pillar', y: p.y, x: p.x, index: i, obj: p });
      });

      // Sort ascending based on bottom y plane
      sortedQueue.sort((a, b) => a.y - b.y);

      // Render in depth y order
      sortedQueue.forEach((item) => {
        if (item.type === 'player') {
          if (userImg) {
            // Draw uploaded Hollow character image bobbing
            const bob = Math.sin(tick * 0.12) * 2;
            ctx.save();
            ctx.translate(player.x, player.y + bob - 15);
            if (player.facing === 'left') {
              ctx.scale(-1, 1);
            }
            
            // Draw custom sprite
            ctx.drawImage(userImg, -28, -36, 56, 72);

            // If taking damage, flash red overlay
            if (player.invincibilityFrames > 0 && Math.floor(tick / 4) % 2 === 0) {
              ctx.globalCompositeOperation = 'source-atop';
              ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
              ctx.fillRect(-28, -36, 56, 72);
            }
            ctx.restore();

            // Render a floating gold indicator crown over their custom NFT
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

          } else {
            // Default King Hollow drawing algorithm 
            drawKingHollow(
              ctx,
              player.x,
              player.y,
              56,
              72,
              tick,
              player.moveState,
              player.facing,
              player.invincibilityFrames > 0 && Math.floor(tick / 3) % 2 === 0
            );
          }
        } 
        else if (item.type === 'enemy') {
          const en = item.obj as EnemyState;
          if (en.type === 'crawler') {
            drawCrawler(ctx, en.x, en.y, en.radius, tick, en.hitFlash > 0);
          } else if (en.type === 'specter') {
            drawSpecter(ctx, en.x, en.y, en.radius, tick, en.hitFlash > 0);
          } else if (en.type === 'warden') {
            drawWarden(ctx, en.x, en.y, en.radius, tick, en.hitFlash > 0);
          }
        } 
        else if (item.type === 'pillar') {
          const pil = item.obj as Pillar;
          ctx.save();
          ctx.translate(pil.x, pil.y);

          // Draw cylindrical ground base shadow glow
          const colG = ctx.createRadialGradient(0, 5, 2, 0, 5, pil.radius * 2.0);
          colG.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
          colG.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = colG;
          ctx.beginPath();
          ctx.ellipse(0, 5, pil.radius * 1.5, 9, 0, 0, Math.PI * 2);
          ctx.fill();

          // 1. Column Shaft Body (Crumbling grey stonework)
          ctx.fillStyle = '#3f3f46'; // zinc-700
          ctx.strokeStyle = '#18181b'; // boundaries
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.rect(-pil.radius, -pil.height, pil.radius * 2, pil.height);
          ctx.fill();
          ctx.stroke();

          // Left-side stone shade block
          ctx.fillStyle = '#27272a'; // zinc-800
          ctx.fillRect(-pil.radius, -pil.height, pil.radius, pil.height);

          // Stonework masonry seams
          ctx.strokeStyle = '#1e1b29';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-pil.radius, -pil.height * 0.65); ctx.lineTo(pil.radius, -pil.height * 0.65);
          ctx.moveTo(-pil.radius, -pil.height * 0.3); ctx.lineTo(pil.radius, -pil.height * 0.3);
          ctx.moveTo(0, -pil.height); ctx.lineTo(0, -pil.height * 0.65);
          ctx.moveTo(-10, -32); ctx.lineTo(-10, 0);
          ctx.stroke();

          // 2. Pillar Decorative Column Head (Top rim)
          ctx.fillStyle = '#52525b'; // zinc-600
          ctx.beginPath();
          ctx.rect(-pil.radius * 1.15, -pil.height - 8, pil.radius * 2.3, 8);
          ctx.fill();
          ctx.stroke();

          // Top rim dark shadow side
          ctx.fillStyle = '#27272a';
          ctx.fillRect(-pil.radius * 1.15, -pil.height - 8, pil.radius * 1.15, 8);

          // 3. Spawning Flickering Torch light structures
          const flameY = -pil.height + 15;
          
          // Torch handle back plate bracket
          ctx.fillStyle = '#b45309'; // bronze gold
          ctx.fillRect(-2, flameY, 4, 10);
          
          // Flame colors flickers
          const flameBob = Math.sin(tick * 0.3) * 1.8;
          const fRadius = 5.5 + Math.sin(tick * 0.3) * 0.8;
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(0, flameY - 3 + flameBob, fRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, flameY - 1 + flameBob, fRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Emit spark dots flying up occasionally
          if (Math.random() < 0.12) {
            particlesRef.current.push({
              id: Math.random().toString(),
              x: pil.x + (Math.random() * 8 - 4),
              y: pil.y + flameY - 4,
              vx: (Math.random() * 0.6 - 0.3),
              vy: -0.65 - Math.random() * 0.5,
              size: 2,
              color: '#f97316',
              alpha: 1.0,
              life: 0,
              maxLife: 20 + Math.random() * 15,
            });
          }

          ctx.restore();
        }
      });

      // Render Sparks Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1.0;

      // Render Floating Damage Alerts
      floatingTextsRef.current.forEach((t) => {
        ctx.fillStyle = t.color;
        ctx.font = 'bold 10px "Press Start 2P"';
        ctx.textAlign = 'center';
        // Apply slight dropshadow stroke
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
      });

      // 9. MAP MIST CEILING OVERLAY
      ctx.fillStyle = 'rgba(24, 24, 27, 0.12)'; // faint ambient twilight grey
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.restore();

      // Dispatch state updates to HTML HUD at moderated frequency (once per 12 frames)
      if (tick % 12 === 0) {
        onGameUpdate({
          score: scoreRef.current,
          hp: player.hp,
          specialGauge: player.specialCharge,
          wave: waveRef.current,
          timeSecs: timeSurvivedRef.current,
          enemiesRemaining: enemiesRef.current.length + (waveSpawnTotalRef.current - waveSpawnedRef.current),
        });
      }

      // Chain next animation frame
      if (gameActive) {
        animFrame = requestAnimationFrame(gameTick);
      }
    };

    // Kickstart game update loop
    gameTick();

    return () => {
      gameActive = false;
      cancelAnimationFrame(animFrame);
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [userImg, onGameUpdate, onGameOver, isMuted]);

  return (
    <div id="canvas-container" className="relative border-4 border-zinc-900 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center max-w-[808px] w-full max-h-[608px] h-full" style={{ aspectRatio: '4/3' }}>
      
      {/* Outer Stone Brick / Relic Border design */}
      <div className="absolute inset-0 border border-violet-950/20 pointer-events-none rounded-xl" />
      
      {/* Dynamic 800x600 Sandbox Arena */}
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="w-full h-full object-contain cursor-crosshair"
      />
      
      {/* Retro scanline overlay effect screen filters */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.4)_100%)] select-none" />
      
    </div>
  );
};
export default GameCanvas;
