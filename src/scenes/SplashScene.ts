import Phaser from 'phaser';

import { AudioManager } from '../audio/AudioManager';
import { MUSIC_SPLASH_LOOP } from '../assets/audio';
import { loadKenneyAssets } from '../assets/loadKenney';
import { SPLASH_SCREEN_BG } from '../assets/splash';

const PROMPT_TEXT = 'Press any to play';
const PROMPT_MARGIN = 64;
const PROMPT_PADDING_X = 28;
const PROMPT_PADDING_Y = 16;
const OVERLAY_ALPHA = 0.62;
const OVERLAY_RADIUS = 14;

export class SplashScene extends Phaser.Scene {
  private audioManager = new AudioManager();
  private promptText!: Phaser.GameObjects.Text;
  private promptOverlay!: Phaser.GameObjects.Graphics;
  private backgroundImage!: Phaser.GameObjects.Image;
  private startTriggered = false;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;
  private pointerDownHandler?: () => void;
  private keyDownHandler?: (event: KeyboardEvent) => void;

  constructor() {
    super('splash');
  }

  preload() {
    loadKenneyAssets(this);
  }

  create() {
    this.startTriggered = false;
    const { width, height } = this.scale;
    this.backgroundImage = this.add.image(width / 2, height / 2, SPLASH_SCREEN_BG);
    this.backgroundImage.setDepth(0);
    this.backgroundImage.setOrigin(0.5, 0.5);
    this.scaleBackground(width, height);

    this.promptOverlay = this.add.graphics();
    this.promptOverlay.setDepth(1);

    this.promptText = this.add.text(0, 0, PROMPT_TEXT, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        fill: true
      }
    });
    this.promptText.setOrigin(0.5);
    this.promptText.setDepth(2);

    this.layoutPrompt(width, height);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.85,
      scale: 1.04,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const handleStart = () => {
      if (this.startTriggered) {
        return;
      }
      this.startTriggered = true;
      this.unlockAudio();
      this.startGame();
    };

    this.pointerDownHandler = handleStart;
    this.input.once('pointerdown', this.pointerDownHandler);
    this.keyDownHandler = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      handleStart();
    };
    this.input.keyboard?.once('keydown', this.keyDownHandler);

    if (!this.sound.locked) {
      this.startSplashMusic();
    }

    this.resizeHandler = (gameSize: Phaser.Structs.Size) => {
      this.scaleBackground(gameSize.width, gameSize.height);
      this.layoutPrompt(gameSize.width, gameSize.height);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioManager.stopMusic();
      if (this.resizeHandler) {
        this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler);
      }
      if (this.pointerDownHandler) {
        this.input.off('pointerdown', this.pointerDownHandler);
      }
      if (this.keyDownHandler) {
        this.input.keyboard?.off('keydown', this.keyDownHandler);
      }
    });
  }

  private unlockAudio() {
    if (!this.sound.locked) {
      return;
    }

    this.sound.unlock();
  }

  private startSplashMusic() {
    this.audioManager.startMusic(this, MUSIC_SPLASH_LOOP, { loop: true });
  }

  private startGame() {
    this.audioManager.stopMusic();
    this.scene.start('game');
  }

  private scaleBackground(viewportWidth: number, viewportHeight: number) {
    const source = this.backgroundImage.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
    const textureWidth = source?.width ?? viewportWidth;
    const textureHeight = source?.height ?? viewportHeight;
    const scale = Math.max(viewportWidth / textureWidth, viewportHeight / textureHeight);
    this.backgroundImage.setScale(scale);
    this.backgroundImage.setPosition(viewportWidth / 2, viewportHeight / 2);
  }

  private layoutPrompt(viewportWidth: number, viewportHeight: number) {
    const promptY = Math.max(0, viewportHeight - PROMPT_MARGIN);
    this.promptText.setPosition(viewportWidth / 2, promptY);

    const bounds = this.promptText.getBounds();
    const overlayWidth = Math.min(viewportWidth - PROMPT_PADDING_X * 2, bounds.width + PROMPT_PADDING_X * 2);
    const overlayHeight = bounds.height + PROMPT_PADDING_Y * 2;
    const clampedOverlayWidth = Math.max(0, overlayWidth);
    const clampedOverlayHeight = Math.max(0, overlayHeight);
    const overlayX = viewportWidth / 2 - clampedOverlayWidth / 2;
    const overlayY = promptY - clampedOverlayHeight / 2;
    this.promptOverlay.clear();
    this.promptOverlay.fillStyle(0x000000, OVERLAY_ALPHA);
    this.promptOverlay.fillRoundedRect(overlayX, overlayY, clampedOverlayWidth, clampedOverlayHeight, OVERLAY_RADIUS);
  }
}
