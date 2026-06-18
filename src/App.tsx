import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameHUD } from './components/GameHUD';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { globalSynth } from './sound';

type GameScreen = 'start' | 'playing' | 'gameover';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [userSprite, setUserSprite] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  // High Scores
  const [highScore, setHighScore] = useState<number>(0);

  // Real-time HUD numbers
  const [hudStats, setHudStats] = useState({
    score: 0,
    hp: 100,
    specialGauge: 0,
    wave: 1,
    timeSecs: 0,
    enemiesRemaining: 0,
  });

  // Final Results numbers
  const [gameOverStats, setGameOverStats] = useState({
    score: 0,
    wave: 1,
    enemiesDefeated: 0,
    timeSurvived: 0,
  });

  // Load High Score on mount
  useEffect(() => {
    const saved = localStorage.getItem('hollows_last_stand_best');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) {
        setHighScore(parsed);
      }
    }
    
    // Set synth default volume state
    globalSynth.muted = isMuted;
  }, []);

  const handleStartGame = () => {
    // Reset stats for fresh play
    setHudStats({
      score: 0,
      hp: 100,
      specialGauge: 0,
      wave: 1,
      timeSecs: 0,
      enemiesRemaining: 0,
    });
    setScreen('playing');
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    globalSynth.muted = nextMute;
    if (!nextMute) {
      globalSynth.playCollect();
    }
  };

  const handleSpriteUpload = (dataUrl: string | null) => {
    setUserSprite(dataUrl);
  };

  // Moderated progress updates received relative to engine events
  const handleGameUpdate = (stats: {
    score: number;
    hp: number;
    specialGauge: number;
    wave: number;
    timeSecs: number;
    enemiesRemaining: number;
  }) => {
    setHudStats(stats);

    // Sync high score live if current score surpasses previous record
    if (stats.score > highScore) {
      setHighScore(stats.score);
      localStorage.setItem('hollows_last_stand_best', stats.score.toString());
    }
  };

  const handleGameOver = (finalStats: {
    score: number;
    wave: number;
    enemiesDefeated: number;
    timeSurvived: number;
  }) => {
    setGameOverStats(finalStats);
    
    // Final check for high score sync
    if (finalStats.score > highScore) {
      setHighScore(finalStats.score);
      localStorage.setItem('hollows_last_stand_best', finalStats.score.toString());
    }

    setScreen('gameover');
  };

  const handleBackToStart = () => {
    setScreen('start');
  };

  return (
    <div id="relic-cabinet" className="w-screen h-screen flex items-center justify-center bg-[#050309] overflow-hidden select-none select-none text-white font-mono">
      
      {screen === 'start' && (
        <StartScreen
          onStartGame={handleStartGame}
          userSprite={userSprite}
          onSpriteUpload={handleSpriteUpload}
        />
      )}

      {screen === 'playing' && (
        <div id="playing-stage" className="relative w-full h-full flex items-center justify-center p-3 animate-fade-in">
          
          {/* Main 2D Pixel physics draw board */}
          <GameCanvas
            userSprite={userSprite}
            onGameUpdate={handleGameUpdate}
            onGameOver={handleGameOver}
            isMuted={isMuted}
          />

          {/* Interactive HTML overlay HUD */}
          <GameHUD
            score={hudStats.score}
            highScore={highScore}
            wave={hudStats.wave}
            timeSecs={hudStats.timeSecs}
            enemiesRemaining={hudStats.enemiesRemaining}
            hp={hudStats.hp}
            maxHp={100}
            specialGauge={hudStats.specialGauge}
            onMuteToggle={handleMuteToggle}
            isMuted={isMuted}
          />
        </div>
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          score={gameOverStats.score}
          wave={gameOverStats.wave}
          enemiesDefeated={gameOverStats.enemiesDefeated}
          timeSurvived={gameOverStats.timeSurvived}
          onRestart={handleStartGame}
          userSprite={userSprite}
        />
      )}

    </div>
  );
}
