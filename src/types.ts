export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  facing: 'left' | 'right';
  moveState: 'idle' | 'walk' | 'attack';
  attackCooldown: number;
  specialCharge: number; // 0 to 100
  invincibilityFrames: number;
}

export type EnemyType = 'crawler' | 'specter' | 'warden';

export interface EnemyState {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  hitFlash: number; // tick frames
  shootCooldown: number;
}

export interface ProjectileState {
  id: string;
  isPlayerOwned: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  type: 'slice' | 'orb' | 'heavy' | 'wave';
  life: number; // ticks left
}

export interface CollectibleState {
  id: string;
  x: number;
  y: number;
  value: number; // raw value
  radius: number;
  color: string;
  isSpecialCharge: boolean;
}

export interface ParticleState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingTextState {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Pillar {
  x: number;
  y: number;
  radius: number;
  height: number;
}

export interface HighScore {
  name: string;
  score: number;
  wave: number;
  date: string;
}
