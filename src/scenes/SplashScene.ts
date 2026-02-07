import Phaser from 'phaser';

import { AudioManager } from '../audio/AudioManager';
import { MUSIC_SPLASH_LOOP } from '../assets/audio';
import { loadKenneyAssets } from '../assets/loadKenney';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 800;

export class SplashScene extends Phaser.Scene {
  private audioManager = new AudioManager();
  private hasUnlockedAudio = false;
  private promptText!: Phaser.GameObjects.Text;

  constructor() {
    super('splash');
  }

  preload() {
    loadKenneyAssets(this);
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0b0b14).setOrigin(0);

    this.promptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Press any to play', {
      fontSize: '28px',
      color: '#f6f7fb',
      align: 'center'
    });
    this.promptText.setOrigin(0.5);

    const handleStart = () => {
      if (!this.hasUnlockedAudio) {
        this.hasUnlockedAudio = true;
        this.unlockAndStartMusic();
        return;
      }
      this.startGame();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      handleStart();
    };

    this.input.on('pointerdown', handleStart);
    this.input.keyboard?.on('keydown', handleKeyDown);

    if (!this.sound.locked) {
      this.hasUnlockedAudio = true;
      this.startSplashMusic();
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioManager.stopMusic();
      this.input.off('pointerdown', handleStart);
      this.input.keyboard?.off('keydown', handleKeyDown);
    });
  }

  private unlockAndStartMusic() {
    if (!this.sound.locked) {
      this.startSplashMusic();
      return;
    }

    this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
      this.startSplashMusic();
    });
    this.sound.unlock();
  }

  private startSplashMusic() {
    this.audioManager.startMusic(this, MUSIC_SPLASH_LOOP, { loop: true });
  }

  private startGame() {
    this.audioManager.stopMusic();
    this.scene.start('game');
  }
}
