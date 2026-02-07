import Phaser from 'phaser';

import { AudioManager } from '../audio/AudioManager';
import { FISH_YELLOW_SWIM_ANIM, PLAYER_ANIM_IDLE, PLAYER_ANIM_JUMP, PLAYER_ANIM_WALK, registerKenneyAnims } from '../assets/anims';
import { MUSIC_BG_NORMAL, MUSIC_BG_SLIDE, SFX_PICKUP_COIN, SFX_PLAYER_DEAD, SFX_PLAYER_JUMP, SFX_PLAYER_SLIDE, SFX_PLAYER_STEPS } from '../assets/audio';
import { loadKenneyAssets } from '../assets/loadKenney';
import {
  COIN_1,
  ENEMY_BLOCK_1,
  ENEMY_BLOCK_2,
  FISH_YELLOW_REST,
  FISH_YELLOW_SWIM_B,
  KENNEY_BG_CLOUDS,
  KENNEY_BG_COLOR_DESERT,
  PLAYER_IDLE,
  TERRAIN_GRASS_BOTTOM,
  TERRAIN_GRASS_TOP,
  UI_ARROW_BACK,
  UI_BUTTON_SQUARE_BORDER,
  UI_RECTANGLE_GRADIENT,
  UI_RECTANGLE_DEPTH_LINE,
  UI_ROUND_FLAT
} from '../assets/kenney';

type SpawnType = 'obstacle' | 'coin';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 800;
const PLAYER_SPEED = 360;
const JUMP_VELOCITY = -520;
const BASE_FALL_SPEED = 180;
const FALL_SPEED_INCREASE = 12;
const BASE_SPAWN_INTERVAL = 900;
const MIN_SPAWN_INTERVAL = 320;
const COIN_CHANCE = 0.22;
const COIN_SCALE = 0.55;
const CLOUD_SCROLL_SPEED = 0.006;
const BASE_BG_COLOR = 0x9fd7ff;
const HUD_HEIGHT = 56;
const HUD_PADDING = 16;
const HUD_CONTENT_OFFSET_Y = 4;
const HUD_DEPTH = 10;
const HUD_TEXT_DEPTH = 12;
const HUD_COIN_SCALE = 0.35;
const HUD_COIN_GAP = 6;
const HUD_FISH_SCALE = 0.4;
const HUD_FISH_GAP = 8;
const HUD_GROUP_GAP = 16;
const GAME_OVER_OVERLAY_ALPHA = 0.55;
const GAME_OVER_PANEL_MAX_WIDTH = 0.78;
const GAME_OVER_PANEL_MAX_HEIGHT = 0.6;
const GAME_OVER_PANEL_DEPTH = 110;
const GAME_OVER_OVERLAY_DEPTH = 100;
const GAME_OVER_TEXT_DEPTH = 120;
const GAME_OVER_BACK_PLATE_TINT = 0x6c717f;
const GAME_OVER_BUTTON_HOVER_SCALE = 1.03;
const GAME_OVER_BUTTON_PRESS_SCALE = 0.97;
const GAME_OVER_BACK_PLATE_EXTRA = 18;
const GAME_OVER_BACK_PLATE_OFFSET_X = 6;
const GAME_OVER_BACK_PLATE_OFFSET_Y = 8;
const FISH_SPAWN_INTERVAL = 2600;
const FISH_SPAWN_VARIANCE = 900;
const FISH_SPAWN_MARGIN = 40;
const FISH_MIN_SPEED = 120;
const FISH_MAX_SPEED = 180;
const FISH_MIN_HEIGHT = 60;
const FISH_MAX_HEIGHT = 160;
const FISH_MAX_POWER = 4;
const FISH_PULSE_MULTIPLIER = 1.12;
const FISH_PULSE_DURATION = 220;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private fishPickups!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };
  private moveDirection = 0;
  private startTime = 0;
  private lastSpawnTime = 0;
  private lastFishSpawnTime = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image;
  private coinText!: Phaser.GameObjects.Text;
  private coinGroup!: Phaser.GameObjects.Container;
  private fishIcon!: Phaser.GameObjects.Image;
  private fishOverlay!: Phaser.GameObjects.Rectangle;
  private fishText!: Phaser.GameObjects.Text;
  private fishGroup!: Phaser.GameObjects.Container;
  private fishPowerProgress = 0;
  private fishPowerCount = 0;
  private fishPulseTween?: Phaser.Tweens.Tween;
  private hudBackground!: Phaser.GameObjects.Image;
  private coinsCollected = 0;
  private gameOver = false;
  private lastScoreValue = 0;
  private slideActive = false;
  private slideEndTime = 0;
  private currentMoveSpeed = PLAYER_SPEED;
  private currentJumpVelocity = JUMP_VELOCITY;
  private lastLeftTapTime = 0;
  private lastRightTapTime = 0;
  private slideEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private baseColor!: Phaser.GameObjects.Rectangle;
  private desertBackground!: Phaser.GameObjects.Image;
  private cloudLayer!: Phaser.GameObjects.TileSprite;
  private groundTopY = 0;
  private gameOverOverlay?: Phaser.GameObjects.Rectangle;
  private gameOverContainer?: Phaser.GameObjects.Container;
  private gameOverBackPlate?: Phaser.GameObjects.Image;
  private gameOverPanel?: Phaser.GameObjects.Image;
  private gameOverPanelWidth = 0;
  private gameOverPanelHeight = 0;
  private gameOverTitleText?: Phaser.GameObjects.Text;
  private gameOverScoreText?: Phaser.GameObjects.Text;
  private gameOverButtons: Phaser.GameObjects.Container[] = [];
  private gameOverArrow?: Phaser.GameObjects.Image;
  private audioManager = new AudioManager();
  private nextStepSfxTime = 0;
  private nextSlideSfxTime = 0;
  private pointerDownHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerUpHandler?: () => void;
  private keyDownHandler?: (event: KeyboardEvent) => void;

  constructor() {
    super('game');
  }

  preload() {
    loadKenneyAssets(this);
  }

  create() {
    const { width, height } = this.scale;
    this.baseColor = this.add.rectangle(0, 0, width, height, BASE_BG_COLOR).setOrigin(0).setDepth(-30);
    this.desertBackground = this.add.image(0, 0, KENNEY_BG_COLOR_DESERT).setOrigin(0).setDepth(-20);
    this.cloudLayer = this.add.tileSprite(0, 0, width, height, KENNEY_BG_CLOUDS).setOrigin(0).setDepth(-10);
    this.resizeBackgrounds(width, height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    registerKenneyAnims(this);

    const groundTopTexture = this.textures.get(TERRAIN_GRASS_TOP);
    const groundBottomTexture = this.textures.get(TERRAIN_GRASS_BOTTOM);
    const groundTopSource = groundTopTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
    const groundBottomSource = groundBottomTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
    const groundTileWidth = groundTopSource?.width ?? 32;
    const groundTopHeight = groundTopSource?.height ?? 32;
    const groundBottomHeight = groundBottomSource?.height ?? 32;
    const groundInset = Math.floor(groundBottomHeight * 0.35);
    const groundBottomY = height - groundBottomHeight + groundInset;
    const groundTopY = groundBottomY - groundTopHeight;
    this.groundTopY = groundTopY;
    const tilesAcross = Math.ceil(GAME_WIDTH / groundTileWidth) + 1;
    const groundVisuals = this.add.group();
    const groundColliders = this.physics.add.staticGroup();

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, groundTopY - 80, PLAYER_IDLE);
    const playerBodyWidth = this.player.width * 0.65;
    const playerBodyHeight = this.player.height * 0.78;
    this.player.setSize(playerBodyWidth, playerBodyHeight);
    this.player.setOffset((this.player.width - playerBodyWidth) / 2, this.player.height - playerBodyHeight);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(900);
    this.player.anims.play(PLAYER_ANIM_IDLE);

    this.slideEmitter = this.add.particles(0, 0, UI_ROUND_FLAT, {
      emitting: false,
      lifespan: 260,
      speed: { min: 10, max: 40 },
      quantity: 2,
      scale: { start: 0.18, end: 0.02 },
      alpha: { start: 0.8, end: 0 },
      angle: { min: 160, max: 200 },
      blendMode: Phaser.BlendModes.ADD
    });
    this.slideEmitter.setDepth(5);
    this.slideEmitter.startFollow(this.player, 0, this.player.displayHeight * 0.15);

    for (let i = 0; i < tilesAcross; i += 1) {
      const x = i * groundTileWidth;
      const bottomTile = this.add.image(x, groundBottomY, TERRAIN_GRASS_BOTTOM).setOrigin(0, 0).setDepth(-5);
      groundVisuals.add(bottomTile);
      const topTile = groundColliders.create(x, groundTopY, TERRAIN_GRASS_TOP) as Phaser.Physics.Arcade.Image;
      topTile.setOrigin(0, 0);
      topTile.setDepth(-5);
      const colliderHeight = Math.max(4, Math.floor(groundTopHeight * 0.25));
      topTile.setSize(groundTileWidth, colliderHeight);
      topTile.setOffset(0, 0);
      topTile.refreshBody();
    }

    this.obstacles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });
    this.coins = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image });
    this.fishPickups = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });

    this.physics.add.collider(this.player, groundColliders);
    this.physics.add.collider(this.coins, groundColliders, (coin) => {
      const target = coin as Phaser.Physics.Arcade.Image;
      target.destroy();
    });
    this.physics.add.collider(this.obstacles, groundColliders, (obstacle) => {
      const target = obstacle as Phaser.Physics.Arcade.Sprite;
      target.destroy();
    });
    this.physics.add.collider(this.player, this.obstacles, () => this.handleGameOver());
    this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
      const target = coin as Phaser.Physics.Arcade.Image;
      target.destroy();
      this.coinsCollected += 1;
      this.audioManager.playSfx(this, SFX_PICKUP_COIN);
    });
    this.physics.add.overlap(this.player, this.fishPickups, (_player, fish) => {
      const target = fish as Phaser.Physics.Arcade.Sprite;
      target.destroy();
      this.setFishPowerCount(this.fishPowerCount + 1);
      this.audioManager.playSfx(this, SFX_PICKUP_COIN);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('A,D,SPACE') as { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };

    this.pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver) {
        return;
      }
      this.moveDirection = pointer.x < GAME_WIDTH / 2 ? -1 : 1;
    };
    this.input.on('pointerdown', this.pointerDownHandler);

    this.pointerUpHandler = () => {
      if (this.gameOver) {
        return;
      }
      this.moveDirection = 0;
    };
    this.input.on('pointerup', this.pointerUpHandler);

    this.keyDownHandler = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      if (this.gameOver) {
        return;
      }
      this.handleDoubleTap(event);
    };
    this.input.keyboard?.on('keydown', this.keyDownHandler);

    this.createHud(width);

    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '28px',
      color: '#f6f7fb',
      align: 'center'
    });
    this.statusText.setOrigin(0.5);
    this.statusText.setDepth(20);

    this.startTime = this.time.now;
    this.lastSpawnTime = this.time.now;
    this.lastFishSpawnTime = this.time.now;
    this.gameOver = false;
    this.coinsCollected = 0;
    this.slideActive = false;
    this.slideEndTime = 0;
    this.currentMoveSpeed = PLAYER_SPEED;
    this.currentJumpVelocity = JUMP_VELOCITY;
    this.lastLeftTapTime = 0;
    this.lastRightTapTime = 0;
    this.slideEmitter.stop();
    this.player.clearTint();
    this.setFishPowerCount(0);
    this.nextStepSfxTime = 0;
    this.nextSlideSfxTime = 0;

    this.audioManager.startMusic(this, MUSIC_BG_NORMAL, { loop: true });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioManager.stopMusic();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.destroyGameOverModal();
      if (this.pointerDownHandler) {
        this.input.off('pointerdown', this.pointerDownHandler);
      }
      if (this.pointerUpHandler) {
        this.input.off('pointerup', this.pointerUpHandler);
      }
      if (this.keyDownHandler) {
        this.input.keyboard?.off('keydown', this.keyDownHandler);
      }
    });
  }

  update(time: number, delta: number) {
    this.cloudLayer.tilePositionX += delta * CLOUD_SCROLL_SPEED;

    if (this.gameOver) {
      return;
    }

    this.updateSlideMax(time);
    this.handleMovement();
    this.handleSpawning(time);
    this.handleFishSpawning(time);
    this.cleanupOffscreen();
    this.updateScore(time);
  }

  private handleMovement() {
    let direction = this.moveDirection;
    const left = this.cursors.left?.isDown || this.keys.A.isDown;
    const right = this.cursors.right?.isDown || this.keys.D.isDown;
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const isGrounded = playerBody.blocked.down || playerBody.touching.down;

    if (left) {
      direction = -1;
    } else if (right) {
      direction = 1;
    }

    if (isGrounded && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.player.setVelocityY(this.currentJumpVelocity);
      this.audioManager.playSfx(this, SFX_PLAYER_JUMP);
    }

    this.player.setVelocityX(direction * this.currentMoveSpeed);
    this.updateStepSfx(isGrounded);

    if (!isGrounded) {
      this.player.anims.play(PLAYER_ANIM_JUMP, true);
      return;
    }

    if (direction === 0) {
      this.player.anims.play(PLAYER_ANIM_IDLE, true);
    } else {
      this.player.setFlipX(direction < 0);
      this.player.anims.play(PLAYER_ANIM_WALK, true);
    }
  }

  private handleSpawning(time: number) {
    const elapsedSeconds = (time - this.startTime) / 1000;
    const fallSpeed = BASE_FALL_SPEED + elapsedSeconds * FALL_SPEED_INCREASE;
    const spawnInterval = Math.max(
      MIN_SPAWN_INTERVAL,
      BASE_SPAWN_INTERVAL - elapsedSeconds * 12
    );

    if (time - this.lastSpawnTime < spawnInterval) {
      return;
    }

    this.lastSpawnTime = time;
    const spawnType: SpawnType = Math.random() < COIN_CHANCE ? 'coin' : 'obstacle';
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const y = -30;

    if (spawnType === 'coin') {
      const coin = this.coins.create(x, y, COIN_1) as Phaser.Physics.Arcade.Image;
      coin.setScale(COIN_SCALE);
      const coinRadius = Math.min(coin.width, coin.height) / 2;
      coin.setCircle(coinRadius);
      coin.setOffset((coin.width - coinRadius * 2) / 2, (coin.height - coinRadius * 2) / 2);
      coin.setVelocityY(fallSpeed * 0.9);
    } else {
      const obstacleTexture = Math.random() < 0.5 ? ENEMY_BLOCK_1 : ENEMY_BLOCK_2;
      const obstacle = this.obstacles.create(x, y, obstacleTexture) as Phaser.Physics.Arcade.Sprite;
      const obstacleBodyWidth = obstacle.width * 0.8;
      const obstacleBodyHeight = obstacle.height * 0.8;
      obstacle.setSize(obstacleBodyWidth, obstacleBodyHeight);
      obstacle.setOffset((obstacle.width - obstacleBodyWidth) / 2, (obstacle.height - obstacleBodyHeight) / 2);
      obstacle.setVelocityY(fallSpeed);
    }
  }

  private handleFishSpawning(time: number) {
    if (this.slideActive) {
      return;
    }
    const spawnInterval = FISH_SPAWN_INTERVAL + Phaser.Math.Between(-FISH_SPAWN_VARIANCE, FISH_SPAWN_VARIANCE);
    if (time - this.lastFishSpawnTime < spawnInterval) {
      return;
    }

    this.lastFishSpawnTime = time;
    const direction = Math.random() < 0.5 ? 1 : -1;
    const x = direction > 0 ? -FISH_SPAWN_MARGIN : GAME_WIDTH + FISH_SPAWN_MARGIN;
    const y = this.groundTopY - Phaser.Math.Between(FISH_MIN_HEIGHT, FISH_MAX_HEIGHT);
    const speed = Phaser.Math.Between(FISH_MIN_SPEED, FISH_MAX_SPEED) * direction;
    const fish = this.fishPickups.create(x, y, FISH_YELLOW_REST) as Phaser.Physics.Arcade.Sprite;
    const fishBody = fish.body as Phaser.Physics.Arcade.Body;
    fish.setVelocityX(speed);
    fishBody.setAllowGravity(false);
    fish.setFlipX(direction > 0);
    fish.setData('baseSpeed', speed);
    fish.setData('pulseActive', false);
    fish.setData('lastFrameKey', '');
    fish.anims.play(FISH_YELLOW_SWIM_ANIM);
    fish.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      const lastFrameKey = fish.getData('lastFrameKey') as string;
      if (frame.textureKey === FISH_YELLOW_SWIM_B && lastFrameKey !== FISH_YELLOW_SWIM_B) {
        this.applyFishPulse(fish);
      }
      fish.setData('lastFrameKey', frame.textureKey);
    });
  }

  private cleanupOffscreen() {
    this.obstacles.children.each((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > GAME_HEIGHT + 60) {
        sprite.destroy();
      }
      return true;
    });

    this.coins.children.each((child) => {
      const image = child as Phaser.Physics.Arcade.Image;
      if (image.y > GAME_HEIGHT + 60) {
        image.destroy();
      }
      return true;
    });

    this.fishPickups.children.each((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < -FISH_SPAWN_MARGIN * 2 || sprite.x > GAME_WIDTH + FISH_SPAWN_MARGIN * 2) {
        sprite.destroy();
      }
      return true;
    });
  }

  private updateScore(time: number) {
    const elapsedSeconds = Math.max(0, (time - this.startTime) / 1000);
    this.lastScoreValue = Math.floor(elapsedSeconds * 10 + this.coinsCollected * 50);
    this.scoreText.setText(`${this.lastScoreValue}`);
    this.timeText.setText(`${elapsedSeconds.toFixed(1)}s`);
    this.coinText.setText(`${this.coinsCollected}`);
    this.layoutHud(this.scale.width);
  }

  private handleGameOver() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.deactivateSlideMax();
    this.player.setVelocity(0, 0);
    this.obstacles.setVelocityY(0);
    this.coins.setVelocityY(0);
    this.fishPickups.setVelocityX(0);
    this.moveDirection = 0;
    this.statusText.setText('');
    this.showGameOverModal();
    this.audioManager.playSfx(this, SFX_PLAYER_DEAD);
  }

  private showGameOverModal() {
    this.destroyGameOverModal();

    const { width, height } = this.scale;
    this.gameOverOverlay = this.add.rectangle(0, 0, width, height, 0x000000, GAME_OVER_OVERLAY_ALPHA)
      .setOrigin(0, 0)
      .setDepth(GAME_OVER_OVERLAY_DEPTH);
    this.gameOverOverlay.setScrollFactor(0);
    this.gameOverOverlay.setInteractive();

    const panelTexture = this.textures.get(UI_RECTANGLE_DEPTH_LINE);
    const panelSource = panelTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
    this.gameOverPanelWidth = panelSource?.width ?? 420;
    this.gameOverPanelHeight = panelSource?.height ?? 320;

    this.gameOverBackPlate = this.add.image(0, 0, UI_RECTANGLE_GRADIENT).setOrigin(0.5);
    this.gameOverBackPlate.setTint(GAME_OVER_BACK_PLATE_TINT);
    this.gameOverBackPlate.setAlpha(0.7);
    this.gameOverBackPlate.setScrollFactor(0);

    this.gameOverPanel = this.add.image(0, 0, UI_RECTANGLE_DEPTH_LINE).setOrigin(0.5);
    this.gameOverPanel.setScrollFactor(0);

    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#141421',
      strokeThickness: 4,
      align: 'center'
    };

    const scoreStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '24px',
      color: '#f6f7fb',
      stroke: '#141421',
      strokeThickness: 3,
      align: 'center'
    };

    const buttonStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '22px',
      color: '#f6f7fb',
      stroke: '#1d1e2c',
      strokeThickness: 3,
      align: 'center'
    };

    this.gameOverTitleText = this.add.text(0, 0, 'Game Over', titleStyle).setOrigin(0.5);
    this.gameOverScoreText = this.add.text(0, 0, `Score: ${this.lastScoreValue}`, scoreStyle).setOrigin(0.5);

    const retryButton = this.createGameOverButton('Reintentar', buttonStyle, () => {
      this.destroyGameOverModal();
      this.scene.restart();
    });
    const homeButton = this.createGameOverButton('Inicio', buttonStyle, () => {
      this.exitToSplash();
    });

    this.gameOverArrow = this.add.image(0, 0, UI_ARROW_BACK).setOrigin(0.5);
    this.gameOverArrow.setScrollFactor(0);
    this.gameOverArrow.setInteractive({ useHandCursor: true });
    this.gameOverArrow.on('pointerover', () => {
      this.gameOverArrow?.setScale(GAME_OVER_BUTTON_HOVER_SCALE);
    });
    this.gameOverArrow.on('pointerout', () => {
      this.gameOverArrow?.setScale(1);
    });
    this.gameOverArrow.on('pointerdown', () => {
      this.gameOverArrow?.setScale(GAME_OVER_BUTTON_PRESS_SCALE);
    });
    this.gameOverArrow.on('pointerup', () => {
      this.exitToSplash();
    });

    this.gameOverButtons = [retryButton, homeButton];
    this.gameOverContainer = this.add.container(0, 0, [
      this.gameOverBackPlate,
      this.gameOverPanel,
      this.gameOverTitleText,
      this.gameOverScoreText,
      retryButton,
      homeButton,
      this.gameOverArrow
    ]);
    this.gameOverContainer.setDepth(GAME_OVER_PANEL_DEPTH);
    this.gameOverContainer.setScrollFactor(0);

    this.layoutGameOverModal(width, height, true);
  }

  private createGameOverButton(
    label: string,
    textStyle: Phaser.Types.GameObjects.Text.TextStyle,
    onClick: () => void
  ) {
    const buttonImage = this.add.image(0, 0, UI_BUTTON_SQUARE_BORDER).setOrigin(0.5);
    buttonImage.setScrollFactor(0);
    const buttonText = this.add.text(0, 0, label, textStyle).setOrigin(0.5);
    const container = this.add.container(0, 0, [buttonImage, buttonText]);
    container.setDepth(GAME_OVER_TEXT_DEPTH);
    container.setScrollFactor(0);
    this.updateGameOverButtonHitArea(container, buttonImage.displayWidth, buttonImage.displayHeight);
    container.on('pointerover', () => {
      container.setScale(GAME_OVER_BUTTON_HOVER_SCALE);
    });
    container.on('pointerout', () => {
      container.setScale(1);
    });
    container.on('pointerdown', () => {
      container.setScale(GAME_OVER_BUTTON_PRESS_SCALE);
    });
    container.on('pointerup', () => {
      container.setScale(GAME_OVER_BUTTON_HOVER_SCALE);
      onClick();
    });
    return container;
  }

  private updateGameOverButtonHitArea(container: Phaser.GameObjects.Container, width: number, height: number) {
    container.setSize(width, height);
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (container.input) {
      container.input.cursor = 'pointer';
    }
  }

  private layoutGameOverModal(viewportWidth: number, viewportHeight: number, animate = false) {
    if (
      !this.gameOverContainer ||
      !this.gameOverPanel ||
      !this.gameOverBackPlate ||
      !this.gameOverTitleText ||
      !this.gameOverScoreText
    ) {
      return;
    }

    const panelWidth = this.gameOverPanelWidth || 420;
    const panelHeight = this.gameOverPanelHeight || 320;
    const maxPanelWidth = viewportWidth * GAME_OVER_PANEL_MAX_WIDTH;
    const maxPanelHeight = viewportHeight * GAME_OVER_PANEL_MAX_HEIGHT;
    const baseScale = Math.min(maxPanelWidth / panelWidth, maxPanelHeight / panelHeight);
    const minPanelHeight = Math.min(340, viewportHeight * 0.82);
    const desiredMinHeight = Math.max(300, minPanelHeight);
    const minHeightScale = desiredMinHeight / panelHeight;
    const panelScale = Math.min(Math.max(baseScale, minHeightScale), maxPanelWidth / panelWidth, maxPanelHeight / panelHeight);
    const panelDisplayWidth = panelWidth * panelScale;
    const panelDisplayHeight = panelHeight * panelScale;

    this.gameOverOverlay?.setSize(viewportWidth, viewportHeight);
    this.gameOverOverlay?.setDisplaySize(viewportWidth, viewportHeight);

    this.gameOverContainer.setPosition(viewportWidth / 2, viewportHeight / 2);
    this.gameOverPanel.setScale(1);
    this.gameOverPanel.setDisplaySize(panelDisplayWidth, panelDisplayHeight);
    this.gameOverBackPlate.setDisplaySize(
      panelDisplayWidth + GAME_OVER_BACK_PLATE_EXTRA,
      panelDisplayHeight + GAME_OVER_BACK_PLATE_EXTRA
    );
    this.gameOverBackPlate.setPosition(GAME_OVER_BACK_PLATE_OFFSET_X, GAME_OVER_BACK_PLATE_OFFSET_Y);

    const paddingX = Math.round(Math.min(36, Math.max(20, panelDisplayWidth * 0.1)));
    const paddingY = Math.round(Math.min(36, Math.max(22, panelDisplayHeight * 0.12)));
    const wrapWidth = Math.max(120, panelDisplayWidth - paddingX * 2);
    const titleFontSize = Math.round(Phaser.Math.Clamp(36 * panelScale, 32, 38));
    const scoreFontSize = Math.round(Phaser.Math.Clamp(24 * panelScale, 22, 26));
    const buttonFontSize = Math.round(Phaser.Math.Clamp(22 * panelScale, 20, 24));
    this.gameOverTitleText.setFontSize(titleFontSize);
    this.gameOverScoreText.setFontSize(scoreFontSize);
    this.gameOverTitleText.setWordWrapWidth(wrapWidth);
    this.gameOverScoreText.setWordWrapWidth(wrapWidth);

    const titleHeight = this.gameOverTitleText.getBounds().height;
    const scoreHeight = this.gameOverScoreText.getBounds().height;
    let verticalSpacing = Math.max(18, panelDisplayHeight * 0.08);
    let buttonSpacing = Math.max(16, panelDisplayHeight * 0.06);
    const buttonWidth = panelDisplayWidth - paddingX * 2;
    const baseButtonHeight = Math.max(44, panelDisplayHeight * 0.16);
    const retryButtonHeight = baseButtonHeight * 1.08;
    const homeButtonHeight = baseButtonHeight;
    const availableHeight = panelDisplayHeight - paddingY * 2;
    const baseContentHeight =
      titleHeight + scoreHeight + retryButtonHeight + homeButtonHeight + verticalSpacing * 2 + buttonSpacing;
    if (baseContentHeight > availableHeight) {
      const spacingScale = Math.max(0.6, availableHeight / baseContentHeight);
      verticalSpacing *= spacingScale;
      buttonSpacing *= spacingScale;
    }

    const topY = -panelDisplayHeight * 0.5 + paddingY + titleHeight * 0.5;
    this.gameOverTitleText.setPosition(0, topY);
    const scoreY = topY + titleHeight * 0.5 + verticalSpacing + scoreHeight * 0.5;
    this.gameOverScoreText.setPosition(0, scoreY);

    const [retryButton, homeButton] = this.gameOverButtons;
    if (retryButton && homeButton) {
      const retryImage = retryButton.getAt(0) as Phaser.GameObjects.Image;
      const retryText = retryButton.getAt(1) as Phaser.GameObjects.Text;
      retryImage.setDisplaySize(buttonWidth, retryButtonHeight);
      this.updateGameOverButtonHitArea(retryButton, buttonWidth, retryButtonHeight);
      retryText.setFontSize(buttonFontSize);
      const firstButtonY = scoreY + scoreHeight * 0.5 + verticalSpacing + retryButtonHeight * 0.5;
      retryButton.setPosition(0, firstButtonY);

      const homeImage = homeButton.getAt(0) as Phaser.GameObjects.Image;
      const homeText = homeButton.getAt(1) as Phaser.GameObjects.Text;
      homeImage.setDisplaySize(buttonWidth, homeButtonHeight);
      this.updateGameOverButtonHitArea(homeButton, buttonWidth, homeButtonHeight);
      homeText.setFontSize(buttonFontSize);
      homeButton.setPosition(0, firstButtonY + retryButtonHeight * 0.5 + buttonSpacing + homeButtonHeight * 0.5);
    }

    if (this.gameOverArrow) {
      const arrowSize = Math.min(panelDisplayWidth, panelDisplayHeight) * 0.12;
      const arrowMargin = Math.max(10, Math.min(14, panelDisplayWidth * 0.04));
      const arrowYOffset = Math.round(Math.min(10, panelDisplayHeight * 0.03));
      this.gameOverArrow.setDisplaySize(arrowSize, arrowSize);
      this.gameOverArrow.setPosition(
        -panelDisplayWidth * 0.5 + arrowMargin + arrowSize * 0.5,
        Math.max(
          -panelDisplayHeight * 0.5 + arrowMargin + arrowSize * 0.5,
          this.gameOverTitleText.getBounds().centerY + arrowYOffset
        )
      );
      this.gameOverArrow.setScale(1);
    }

    if (animate) {
      this.gameOverContainer.setScale(0.95);
      this.tweens.add({
        targets: this.gameOverContainer,
        scale: 1,
        duration: 160,
        ease: 'Back.easeOut'
      });
    } else {
      this.gameOverContainer.setScale(1);
    }
  }

  private destroyGameOverModal() {
    this.gameOverButtons.forEach((button) => button.destroy(true));
    this.gameOverButtons = [];
    this.gameOverArrow?.destroy(true);
    this.gameOverArrow = undefined;
    this.gameOverTitleText?.destroy();
    this.gameOverTitleText = undefined;
    this.gameOverScoreText?.destroy();
    this.gameOverScoreText = undefined;
    this.gameOverBackPlate?.destroy();
    this.gameOverBackPlate = undefined;
    this.gameOverPanel?.destroy();
    this.gameOverPanel = undefined;
    this.gameOverContainer?.destroy(true);
    this.gameOverContainer = undefined;
    this.gameOverOverlay?.destroy();
    this.gameOverOverlay = undefined;
  }

  private exitToSplash() {
    this.destroyGameOverModal();
    this.scene.stop('game');
    this.scene.start('splash');
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.resizeBackgrounds(gameSize.width, gameSize.height);
    this.resizeHud(gameSize.width);
    this.layoutGameOverModal(gameSize.width, gameSize.height);
  }

  private resizeBackgrounds(width: number, height: number) {
    this.baseColor.setSize(width, height);
    this.baseColor.setDisplaySize(width, height);
    this.desertBackground.setDisplaySize(width, height);
    const cloudHeight = this.getCloudBandHeight(height);
    this.cloudLayer.setPosition(0, 0);
    this.cloudLayer.setSize(width, cloudHeight);
    this.cloudLayer.setDisplaySize(width, cloudHeight);
  }

  private createHud(viewportWidth: number) {
    this.hudBackground = this.add.image(0, 0, UI_RECTANGLE_GRADIENT).setOrigin(0, 0);
    this.hudBackground.setAlpha(0.85);
    this.hudBackground.setDepth(HUD_DEPTH);
    this.hudBackground.setDisplaySize(viewportWidth, HUD_HEIGHT);

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '18px',
      color: '#f6f7fb',
      stroke: '#1d1e2c',
      strokeThickness: 2
    };

    this.scoreText = this.add.text(0, 0, '', textStyle).setOrigin(0, 0.5);
    this.scoreText.setDepth(HUD_TEXT_DEPTH);

    this.timeText = this.add.text(0, 0, '', textStyle).setOrigin(0.5, 0.5);
    this.timeText.setDepth(HUD_TEXT_DEPTH);

    this.coinIcon = this.add.image(0, 0, COIN_1).setOrigin(0, 0.5);
    this.coinIcon.setScale(HUD_COIN_SCALE);
    this.coinIcon.setDepth(HUD_TEXT_DEPTH);

    this.coinText = this.add.text(0, 0, '', textStyle).setOrigin(0, 0.5);
    this.coinText.setDepth(HUD_TEXT_DEPTH);

    this.coinGroup = this.add.container(0, 0, [this.coinIcon, this.coinText]);
    this.coinGroup.setDepth(HUD_TEXT_DEPTH);

    this.fishIcon = this.add.image(0, 0, FISH_YELLOW_REST).setOrigin(0, 0.5);
    this.fishIcon.setScale(HUD_FISH_SCALE);
    this.fishIcon.setDepth(HUD_TEXT_DEPTH);

    this.fishOverlay = this.add.rectangle(0, 0, 1, 1, 0x0b0b0b, 0.65).setOrigin(0, 0);
    this.fishOverlay.setDepth(HUD_TEXT_DEPTH + 1);

    this.fishText = this.add.text(0, 0, '0/4', textStyle).setOrigin(0, 0.5);
    this.fishText.setDepth(HUD_TEXT_DEPTH);

    this.fishGroup = this.add.container(0, 0, [this.fishIcon, this.fishOverlay, this.fishText]);
    this.fishGroup.setDepth(HUD_TEXT_DEPTH);

    this.setFishPowerProgress(0);
    this.stopFishPulse();
    this.resizeHud(viewportWidth);
  }

  private resizeHud(viewportWidth: number) {
    this.hudBackground.setDisplaySize(viewportWidth, HUD_HEIGHT);
    this.layoutHud(viewportWidth);
  }

  private layoutHud(viewportWidth: number) {
    const centerY = HUD_HEIGHT / 2 + HUD_CONTENT_OFFSET_Y;
    this.hudBackground.setPosition(0, 0);
    this.scoreText.setPosition(HUD_PADDING, centerY);
    this.timeText.setPosition(viewportWidth / 2, centerY);

    const coinTextWidth = this.coinText.width;
    const coinIconWidth = this.coinIcon.displayWidth;
    const coinBlockWidth = coinIconWidth + HUD_COIN_GAP + coinTextWidth;
    const fishTextWidth = this.fishText.width;
    const fishIconWidth = this.fishIcon.displayWidth;
    const fishBlockWidth = fishIconWidth + HUD_FISH_GAP + fishTextWidth;
    const rightGroupWidth = fishBlockWidth + HUD_GROUP_GAP + coinBlockWidth;
    const fishBlockX = viewportWidth - HUD_PADDING - rightGroupWidth;
    const coinBlockX = fishBlockX + fishBlockWidth + HUD_GROUP_GAP;

    this.coinIcon.setPosition(0, 0);
    this.coinText.setPosition(coinIconWidth + HUD_COIN_GAP, 0);
    this.coinGroup.setPosition(coinBlockX, centerY);

    const fishIconHeight = this.fishIcon.displayHeight;
    this.fishIcon.setPosition(0, 0);
    this.fishOverlay.setPosition(0, -fishIconHeight / 2);
    this.fishText.setPosition(fishIconWidth + HUD_FISH_GAP, 0);
    this.fishGroup.setPosition(fishBlockX, centerY);
    this.setFishPowerProgress(this.fishPowerProgress);
  }

  private setFishPowerProgress(progress: number) {
    this.fishPowerProgress = Phaser.Math.Clamp(progress, 0, 1);
    const iconWidth = this.fishIcon.displayWidth;
    const iconHeight = this.fishIcon.displayHeight;
    const overlayHeight = iconHeight * (1 - this.fishPowerProgress);
    this.fishOverlay.setDisplaySize(iconWidth, overlayHeight);
    this.fishOverlay.setVisible(overlayHeight > 0);
  }

  private setFishPowerCount(count: number) {
    this.fishPowerCount = Phaser.Math.Clamp(count, 0, FISH_MAX_POWER);
    this.fishText.setText(`${this.fishPowerCount}/${FISH_MAX_POWER}`);
    this.setFishPowerProgress(this.fishPowerCount / FISH_MAX_POWER);
    if (this.fishPowerCount >= FISH_MAX_POWER) {
      this.startFishPulse();
    } else {
      this.stopFishPulse();
    }
    this.layoutHud(this.scale.width);
  }

  private startFishPulse() {
    if (this.fishPulseTween) {
      return;
    }
    this.fishGroup.setScale(1);
    this.fishPulseTween = this.tweens.add({
      targets: this.fishGroup,
      scale: FISH_PULSE_MULTIPLIER,
      duration: FISH_PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private stopFishPulse() {
    if (this.fishPulseTween) {
      this.fishPulseTween.stop();
      this.fishPulseTween = undefined;
    }
    this.fishGroup?.setScale(1);
  }

  private handleDoubleTap(event: KeyboardEvent) {
    const now = this.time.now;
    const isLeft = event.code === 'ArrowLeft' || event.code === 'KeyA';
    const isRight = event.code === 'ArrowRight' || event.code === 'KeyD';

    if (!isLeft && !isRight) {
      return;
    }

    if (isLeft) {
      if (now - this.lastLeftTapTime <= 220) {
        this.tryActivateSlideMax();
        this.lastLeftTapTime = 0;
        return;
      }
      this.lastLeftTapTime = now;
    }

    if (isRight) {
      if (now - this.lastRightTapTime <= 220) {
        this.tryActivateSlideMax();
        this.lastRightTapTime = 0;
        return;
      }
      this.lastRightTapTime = now;
    }
  }

  private tryActivateSlideMax() {
    if (this.slideActive) {
      return;
    }
    if (this.fishPowerCount < FISH_MAX_POWER) {
      return;
    }
    this.activateSlideMax();
  }

  private activateSlideMax() {
    this.slideActive = true;
    this.slideEndTime = this.time.now + 3000;
    this.currentMoveSpeed = PLAYER_SPEED * 2.4;
    this.currentJumpVelocity = JUMP_VELOCITY * 1.3;
    this.setFishPowerCount(0);
    this.player.setTint(0x7ffcff);
    this.slideEmitter.start();
    this.audioManager.startMusic(this, MUSIC_BG_SLIDE, { loop: true });
  }

  private updateSlideMax(time: number) {
    if (!this.slideActive) {
      return;
    }
    if (time < this.slideEndTime) {
      return;
    }
    this.deactivateSlideMax();
  }

  private deactivateSlideMax() {
    if (!this.slideActive) {
      return;
    }
    this.slideActive = false;
    this.currentMoveSpeed = PLAYER_SPEED;
    this.currentJumpVelocity = JUMP_VELOCITY;
    this.slideEmitter.stop();
    this.player.clearTint();
    this.nextSlideSfxTime = 0;
    this.audioManager.startMusic(this, MUSIC_BG_NORMAL, { loop: true });
  }

  private updateStepSfx(isGrounded: boolean) {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const isMoving = Math.abs(playerBody.velocity.x) > 0.1;

    if (this.slideActive) {
      if (!isMoving) {
        this.nextSlideSfxTime = 0;
        return;
      }
      const now = this.time.now;
      if (this.nextSlideSfxTime === 0 || now >= this.nextSlideSfxTime) {
        this.audioManager.playSfx(this, SFX_PLAYER_SLIDE);
        this.nextSlideSfxTime = now + Phaser.Math.Between(120, 180);
      }
      this.nextStepSfxTime = 0;
      return;
    }

    if (!isGrounded || !isMoving) {
      this.nextStepSfxTime = 0;
      return;
    }

    const now = this.time.now;
    if (this.nextStepSfxTime === 0 || now >= this.nextStepSfxTime) {
      this.audioManager.playSfx(this, SFX_PLAYER_STEPS);
      this.nextStepSfxTime = now + Phaser.Math.Between(140, 180);
    }
  }

  private applyFishPulse(fish: Phaser.Physics.Arcade.Sprite) {
    const baseSpeed = fish.getData('baseSpeed') as number;
    if (!Number.isFinite(baseSpeed)) {
      return;
    }

    const pulseActive = fish.getData('pulseActive') as boolean;
    if (pulseActive) {
      return;
    }

    const fishBody = fish.body as Phaser.Physics.Arcade.Body;
    fish.setData('pulseActive', true);
    fishBody.setVelocityX(baseSpeed * FISH_PULSE_MULTIPLIER);

    const existingTween = fish.getData('pulseTween') as Phaser.Tweens.Tween | undefined;
    existingTween?.stop();

    const tween = this.tweens.add({
      targets: fishBody.velocity,
      x: baseSpeed,
      duration: FISH_PULSE_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => {
        fish.setData('pulseActive', false);
        fish.setData('pulseTween', undefined);
      }
    });

    fish.setData('pulseTween', tween);
  }

  private getCloudBandHeight(viewportHeight: number) {
    const texture = this.textures.get(KENNEY_BG_CLOUDS);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
    const textureHeight = source?.height ?? viewportHeight;
    const desiredHeight = Math.floor(viewportHeight * 0.25);
    return Math.max(1, Math.min(desiredHeight, textureHeight));
  }
}
