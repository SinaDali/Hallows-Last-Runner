export function drawKingHollow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  tick: number,
  state: 'idle' | 'walk' | 'attack',
  facing: 'left' | 'right',
  hitFlash: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  if (facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Bobbing values
  let bob = Math.sin(tick * 0.12) * 2.5;
  let walkWobble = 0;
  let legAngle = 0;
  let tilt = 0;

  if (state === 'walk') {
    bob = Math.sin(tick * 0.25) * 3.5;
    walkWobble = Math.sin(tick * 0.25) * 0.05;
    legAngle = Math.sin(tick * 0.25) * 0.35;
    tilt = 0.04;
  } else if (state === 'attack') {
    bob = -2;
    tilt = 0.12;
  }

  ctx.rotate(tilt);

  // 1. BACK LEVEL CAPE PART - Dark red inside
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  let capeWave = Math.sin(tick * 0.1) * 4;
  ctx.moveTo(-18, -10 + bob);
  ctx.bezierCurveTo(-26, 0 + bob + capeWave, -28, 24 + bob + capeWave, -14, 28 + bob);
  ctx.lineTo(-4, 28 + bob);
  ctx.lineTo(-10, -10 + bob);
  ctx.closePath();
  ctx.fill();

  // 2. LEGS & BOOTS
  ctx.fillStyle = '#1c1917'; // very dark brown/black
  // Left leg
  ctx.save();
  ctx.translate(-5, 14 + bob);
  ctx.rotate(state === 'walk' ? legAngle : 0);
  ctx.fillRect(-3, 0, 5, 12);
  // Boot tip
  ctx.fillRect(-5, 9, 7, 3);
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(5, 14 + bob);
  ctx.rotate(state === 'walk' ? -legAngle : 0);
  ctx.fillRect(-2, 0, 5, 12);
  // Boot tip
  ctx.fillRect(-3, 9, 7, 3);
  ctx.restore();

  // 3. MAIN ROBE/BODY
  // Dark Purple Robe
  ctx.fillStyle = '#3b0764'; // violet-950
  ctx.beginPath();
  ctx.moveTo(-14, -10 + bob);
  ctx.lineTo(14, -10 + bob);
  ctx.lineTo(12, 16 + bob);
  ctx.lineTo(-12, 16 + bob);
  ctx.closePath();
  ctx.fill();

  // Gold robe borders
  ctx.fillStyle = '#caa30a';
  ctx.fillRect(-12, 13 + bob, 24, 3);
  ctx.fillRect(-2, -10 + bob, 4, 23); // central vertical hem

  // Gold belt
  ctx.fillStyle = '#eab308'; // gold
  ctx.fillRect(-11, 4 + bob, 22, 4);
  // Teal buckle
  ctx.fillStyle = '#2dd4bf';
  ctx.fillRect(-3, 3 + bob, 6, 6);

  // 4. MAIN FLOWING FOREGROUND CAPE (Wrap around back/side)
  ctx.fillStyle = '#dc2626'; // Red-600
  ctx.strokeStyle = '#991b1b'; // Red-800
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(-16, -10); // Shoulder left
  // Curve down out
  ctx.bezierCurveTo(-34, -2 + bob + capeWave, -36, 18 + bob + capeWave, -24, 24 + bob);
  // Bottom line
  ctx.lineTo(-8, 20 + bob);
  ctx.lineTo(-10, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gold trim on outer cape
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(-24, 24 + bob);
  ctx.lineTo(-20, 24 + bob);
  ctx.bezierCurveTo(-30, 18 + bob + capeWave, -28, -2 + bob + capeWave, -16, -10);
  ctx.lineTo(-18, -10);
  ctx.bezierCurveTo(-30, -2 + bob + capeWave, -32, 18 + bob + capeWave, -24, 24 + bob);
  ctx.closePath();
  ctx.fill();

  // 5. ERMINE FUR COLLAR
  ctx.fillStyle = '#f4f4f5'; // light grey
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, -12 + bob, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Ermine black specks (little pixels)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-8, -13 + bob, 1.5, 2);
  ctx.fillRect(8, -13 + bob, 1.5, 2);
  ctx.fillRect(0, -10 + bob, 1.5, 2);

  // 6. HEAD (Hollow Pumpkin Face)
  ctx.fillStyle = '#c49a6c'; // Burlap brownish tan
  ctx.strokeStyle = '#78350f'; // Dark amber outline
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Draw a rounded head mask
  ctx.ellipse(0, -26 + bob, 18, 16, walkWobble, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Highlight and shading on mask
  ctx.fillStyle = '#dbb58f'; // lighter tan highlight
  ctx.beginPath();
  ctx.ellipse(-5, -28 + bob, 10, 8, walkWobble, 0, Math.PI * 2);
  ctx.fill();

  // Black hollow eyes
  ctx.fillStyle = '#09090b'; // solid black
  ctx.save();
  ctx.translate(walkWobble * 10, 0);
  ctx.beginPath();
  ctx.arc(-6, -24 + bob, 3.5, 0, Math.PI * 2);
  ctx.arc(6, -24 + bob, 3.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Glowing teal specks in hollow eyes
  ctx.fillStyle = '#2dd4bf'; // teal glow glow
  ctx.fillRect(-6.5, -24.5 + bob, 1.5, 1.5);
  ctx.fillRect(5.5, -24.5 + bob, 1.5, 1.5);
  ctx.restore();

  // 7. GOLDEN ROYAL CROWN
  ctx.fillStyle = '#eab308'; // Gold base
  ctx.strokeStyle = '#a16207'; // Golden shadow outline
  ctx.lineWidth = 1;

  ctx.beginPath();
  // Crown points
  let crownY = -37 + bob;
  ctx.moveTo(-13, crownY + 4);
  ctx.lineTo(-12, crownY - 6); // Point 1
  ctx.lineTo(-7, crownY);
  ctx.lineTo(-4, crownY - 9); // Point 2 (center tall peak)
  ctx.lineTo(0, crownY);
  ctx.lineTo(4, crownY - 9); // Point 3 (center tall peak 2)
  ctx.lineTo(7, crownY);
  ctx.lineTo(12, crownY - 6); // Point 4
  ctx.lineTo(13, crownY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bright gold highlight on peaks
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-12, crownY - 5, 1.5, 3);
  ctx.fillRect(-4, crownY - 8, 1.5, 3);
  ctx.fillRect(4, crownY - 8, 1.5, 3);
  ctx.fillRect(11, crownY - 5, 1.5, 3);

  // Teal Jewels on crown
  ctx.fillStyle = '#2dd4bf'; // Cyan jewels
  ctx.fillRect(-9, crownY + 1, 2, 2.5);
  ctx.fillRect(0, crownY + 1, 2, 2.5);
  ctx.fillRect(7, crownY + 1, 2, 2.5);
  // White sparkle coordinate
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-8.5, crownY + 1.5, 1, 1);
  ctx.fillRect(0.5, crownY + 1.5, 1, 1);
  ctx.fillRect(7.5, crownY + 1.5, 1, 1);

  ctx.restore();

  // Draw white silhouette if hit flash
  if (hitFlash) {
    ctx.save();
    ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);
    ctx.rotate(tilt);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(-40, -60, 80, 100);
    ctx.restore();
  }
}

export function drawCrawler(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number, hitFlash: boolean) {
  ctx.save();
  ctx.translate(x, y);
  
  const bob = Math.sin(tick * 0.2) * 2;
  const scaleX = 1 + Math.sin(tick * 0.2) * 0.05;
  const scaleY = 1 - Math.sin(tick * 0.2) * 0.05;
  ctx.scale(scaleX, scaleY);

  // Drawing glow
  const gradGlow = ctx.createRadialGradient(0, bob, 2, 0, bob, r * 1.8);
  gradGlow.addColorStop(0, 'rgba(124, 58, 237, 0.45)');
  gradGlow.addColorStop(1, 'rgba(124, 58, 237, 0)');
  ctx.fillStyle = gradGlow;
  ctx.beginPath();
  ctx.arc(0, bob, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Outer dark shadow cloud (base crawler body)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#5b21b6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, bob, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Multi-layered floating flame points (pixel art shadow feel)
  ctx.fillStyle = '#3b0764';
  ctx.fillRect(-r * 0.6, bob + r * 0.4, r * 0.3, 4);
  ctx.fillRect(r * 0.3, bob + r * 0.4, r * 0.3, 4);
  ctx.fillRect(-r * 0.2, bob + r * 0.5, r * 0.4, 5);

  // Glowing bloodshot eyes
  ctx.fillStyle = '#ef4444'; // vivid red
  ctx.fillRect(-r * 0.5, bob - r * 0.25, 3.5, 3.5);
  ctx.fillRect(r * 0.2, bob - r * 0.25, 3.5, 3.5);
  // Angry eye lines
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, bob - r * 0.45);
  ctx.lineTo(-r * 0.3, bob - r * 0.2);
  ctx.moveTo(r * 0.5, bob - r * 0.45);
  ctx.lineTo(r * 0.2, bob - r * 0.2);
  ctx.stroke();

  ctx.restore();

  // Hit Flash
  if (hitFlash) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(0, bob, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawSpecter(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number, hitFlash: boolean) {
  ctx.save();
  ctx.translate(x, y);

  const float = Math.sin(tick * 0.15) * 4;
  
  // Ambient radial teal aura path
  const glow = ctx.createRadialGradient(0, float, 1, 0, float, r * 2.2);
  glow.addColorStop(0, 'rgba(45, 212, 191, 0.4)');
  glow.addColorStop(1, 'rgba(45, 212, 191, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, float, r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Soft floating wispy robe
  ctx.fillStyle = '#0d9488'; // teal-600
  ctx.strokeStyle = '#99f6e4'; // teal-200
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r, float);
  ctx.bezierCurveTo(-r * 0.9, float - r * 2.5, r * 0.9, float - r * 2.5, r, float);
  ctx.bezierCurveTo(r * 1.1, float + r * 1.5, r * 0.4, float + r * 2.2, r * 0.5, float + r * 3.5);
  ctx.lineTo(-r * 0.5, float + r * 3.5);
  ctx.bezierCurveTo(-r * 0.4, float + r * 2.2, -r * 1.1, float + r * 1.5, -r, float);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wispy lines details
  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, float);
  ctx.lineTo(-r * 0.3, float + r * 2);
  ctx.moveTo(r * 0.3, float);
  ctx.lineTo(r * 0.3, float + r * 2);
  ctx.stroke();

  // Glowing neon cyan eyes
  ctx.fillStyle = '#2dd4bf'; // bright teal glow
  ctx.fillRect(-r * 0.4, float - r * 0.4, 4, 3);
  ctx.fillRect(r * 0.1, float - r * 0.4, 4, 3);
  ctx.fillStyle = '#ffffff'; // pinpoint white pupils
  ctx.fillRect(-r * 0.3, float - r * 0.3, 1.5, 1.5);
  ctx.fillRect(r * 0.2, float - r * 0.3, 1.5, 1.5);

  ctx.restore();

  // Hit Flash
  if (hitFlash) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(-r - 2, float - r * 2.5, r * 2 + 4, r * 6);
    ctx.restore();
  }
}

export function drawWarden(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number, hitFlash: boolean) {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(tick * 0.08) * 1.5;

  // Dark orange active core ground glow
  const glow = ctx.createRadialGradient(0, bob, 5, 0, bob, r * 2.0);
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, bob, r * 2.0, 0, Math.PI * 2);
  ctx.fill();

  // Outer Stone Shield Shell
  ctx.fillStyle = '#27272a'; // zinc-800
  ctx.strokeStyle = '#ea580c'; // deep orange outline
  ctx.lineWidth = 2.5;

  // Draw hex/shield monolith
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r + bob);
  ctx.lineTo(r * 0.8, -r + bob);
  ctx.lineTo(r * 1.1, bob);
  ctx.lineTo(r * 0.8, r + bob);
  ctx.lineTo(-r * 0.8, r + bob);
  ctx.lineTo(-r * 1.1, bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Deep magma lava cracks
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.3 + bob);
  ctx.lineTo(-r * 0.2, -r * 0.6 + bob);
  ctx.lineTo(r * 0.3, -r * 0.2 + bob);
  ctx.lineTo(-r * 0.1, r * 0.4 + bob);
  ctx.stroke();

  // Warden face core overlay (dark hood mask)
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.25 + bob, r * 0.4, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing demonic horns
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  // Left horn
  ctx.moveTo(-r * 0.4, -r * 0.5 + bob);
  ctx.bezierCurveTo(-r * 0.7, -r * 1.1 + bob, -r * 1.1, -r * 1.0 + bob, -r * 0.8, -r * 0.4 + bob);
  ctx.closePath();
  // Right horn
  ctx.moveTo(r * 0.4, -r * 0.5 + bob);
  ctx.bezierCurveTo(r * 0.7, -r * 1.1 + bob, r * 1.1, -r * 1.0 + bob, r * 0.8, -r * 0.4 + bob);
  ctx.closePath();
  ctx.fill();

  // Glowing orange magma mask eyes
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-5, -r * 0.3 + bob, 3, 3);
  ctx.fillRect(2, -r * 0.3 + bob, 3, 3);

  // Heavy shoulder guards
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-r * 1.15, bob - 2, r * 0.35, r * 0.5);
  ctx.fillRect(r * 0.8, bob - 2, r * 0.35, r * 0.5);

  ctx.restore();

  // Hit Flash
  if (hitFlash) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(0, bob, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
