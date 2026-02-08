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
  UI_BUTTON_SQUARE_BORDER,
  UI_RECTANGLE_GRADIENT,
  UI_RECTANGLE_GRADIENT_2,
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
const HUD_BASE_HEIGHT = 76;
const HUD_BASE_PADDING = 20;
const HUD_BASE_OUTER_PADDING = 12;
const HUD_BASE_INNER_MARGIN = 8;
const HUD_BASE_CONTENT_OFFSET_Y = 0;
const HUD_DEPTH = 10;
const HUD_TEXT_DEPTH = 12;
const HUD_BASE_SCORE_FONT_SIZE = 32;
const HUD_BASE_TIME_FONT_SIZE = 26;
const HUD_BASE_STAT_FONT_SIZE = 24;
const HUD_BASE_COIN_SCALE = 0.45;
const HUD_BASE_COIN_GAP = 9;
const HUD_BASE_FISH_SCALE = 0.5;
const HUD_BASE_FISH_GAP = 9;
const HUD_BASE_GROUP_GAP = 18;
const HUD_MAX_SCALE = 1.35;
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
const FISH_PULSE_MULTIPLIER = 1.1;
const FISH_PULSE_DURATION = 220;
const GROUND_VISUAL_DROP_RATIO = 0.45;
const MOBILE_JOYSTICK_BASE_SIZE = 140;
const MOBILE_JOYSTICK_THUMB_SIZE = 70;
const MOBILE_JOYSTICK_RADIUS = 48;
const MOBILE_JOYSTICK_DEADZONE = 0.15;
const MOBILE_JUMP_BUTTON_SIZE = 120;
const MOBILE_JUMP_DOUBLE_TAP_WINDOW_MS = 260;
const MOBILE_CONTROL_MARGIN = 24;
const MOBILE_JUMP_BUTTON_DEPTH = 20;
const MOBILE_JOYSTICK_DEPTH = 18;
const CAMERA_LERP = 0.1;
const CAMERA_OFFSET_RATIO = 0.12;

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
  private hudInnerPanel!: Phaser.GameObjects.Image;
  private uiScale = 1;
  private hudHeight = HUD_BASE_HEIGHT;
  private hudPadding = HUD_BASE_PADDING;
  private hudOuterPadding = HUD_BASE_OUTER_PADDING;
  private hudInnerMargin = HUD_BASE_INNER_MARGIN;
  private hudContentOffsetY = HUD_BASE_CONTENT_OFFSET_Y;
  private hudScoreFontSize = HUD_BASE_SCORE_FONT_SIZE;
  private hudTimeFontSize = HUD_BASE_TIME_FONT_SIZE;
  private hudStatFontSize = HUD_BASE_STAT_FONT_SIZE;
  private hudCoinScale = HUD_BASE_COIN_SCALE;
  private hudFishScale = HUD_BASE_FISH_SCALE;
  private hudCoinGap = HUD_BASE_COIN_GAP;
  private hudFishGap = HUD_BASE_FISH_GAP;
  private hudGroupGap = HUD_BASE_GROUP_GAP;
  private coinsCollected = 0;
  private gameOver = false;
  private lastScoreValue = 0;
  private slideActive = false;
  private slideEndTime = 0;
  private currentMoveSpeed = PLAYER_SPEED;
  private currentJumpVelocity = JUMP_VELOCITY;
  private lastLeftTapTime = 0;
  private lastRightTapTime = 0;
  private lastJumpTapTime = 0;
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
  private audioManager = new AudioManager();
  private nextStepSfxTime = 0;
  private nextSlideSfxTime = 0;
  private keyDownHandler?: (event: KeyboardEvent) => void;
  private mobileControlsEnabled = false;
  private joystickContainer?: Phaser.GameObjects.Container;
  private joystickBase?: Phaser.GameObjects.Image;
  private joystickThumb?: Phaser.GameObjects.Image;
  private joystickRadius = 0;
  private joystickCenter = new Phaser.Math.Vector2(0, 0);
  private joystickPointerId?: number;
  private joystickMoveHandler?: (pointer: Phaser.Input.Pointer) => void;
  private joystickUpHandler?: (pointer: Phaser.Input.Pointer) => void;
  private jumpButton?: Phaser.GameObjects.Container;
  private jumpButtonImage?: Phaser.GameObjects.Image;
  private jumpButtonText?: Phaser.GameObjects.Text;
  private jumpButtonHitbox?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('game');
  }

  preload() {
    loadKenneyAssets(this);
  }

  create() {
    const { width, height } = this.scale;
    this.baseColor = this.add.rectangle(0, 0, width, height, BASE_BG_COLOR).setOrigin(0).setDepth(-30);
    this.baseColor.setScrollFactor(0);
    this.desertBackground = this.add.image(0, 0, KENNEY_BG_COLOR_DESERT).setOrigin(0).setDepth(-20);
    this.desertBackground.setScrollFactor(0);
    this.cloudLayer = this.add.tileSprite(0, 0, width, height, KENNEY_BG_CLOUDS).setOrigin(0).setDepth(-10);
    this.cloudLayer.setScrollFactor(0);
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
    const groundVisualDrop = Math.round(groundBottomHeight * GROUND_VISUAL_DROP_RATIO);
    const groundBottomY = height - groundBottomHeight + groundInset + groundVisualDrop;
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

    const worldWidth = GAME_WIDTH;
    const worldHeight = GAME_HEIGHT;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    const followOffsetX = 0;
    const followOffsetY = Math.round(-height * CAMERA_OFFSET_RATIO);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    this.cameras.main.setFollowOffset(followOffsetX, followOffsetY);

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

    const enableMobileControls = this.shouldUseMobileControls();

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

    this.createHud(width, height);
    if (enableMobileControls) {
      this.createMobileControls(width, height);
    } else {
      this.destroyMobileControls();
    }

    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '28px',
      color: '#f6f7fb',
      align: 'center'
    });
    this.statusText.setOrigin(0.5);
    this.statusText.setDepth(20);
    this.statusText.setScrollFactor(0);

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
    this.lastJumpTapTime = 0;
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
      if (this.keyDownHandler) {
        this.input.keyboard?.off('keydown', this.keyDownHandler);
      }
      if (this.joystickMoveHandler) {
        this.input.off('pointermove', this.joystickMoveHandler);
      }
      if (this.joystickUpHandler) {
        this.input.off('pointerup', this.joystickUpHandler);
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
      this.tryJump();
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
    this.resetJoystick();
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

    this.gameOverButtons = [retryButton, homeButton];
    this.gameOverContainer = this.add.container(0, 0, [
      this.gameOverBackPlate,
      this.gameOverPanel,
      this.gameOverTitleText,
      this.gameOverScoreText,
      retryButton,
      homeButton
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
    buttonImage.setName('image');
    const buttonText = this.add.text(0, 0, label, textStyle).setOrigin(0.5);
    buttonText.setName('text');
    const hitbox = this.add.rectangle(0, 0, buttonImage.displayWidth, buttonImage.displayHeight, 0x000000, 0);
    hitbox.setOrigin(0.5);
    hitbox.setScrollFactor(0);
    hitbox.setName('hitbox');
    hitbox.setInteractive({ useHandCursor: true });
    const container = this.add.container(0, 0, [buttonImage, buttonText, hitbox]);
    container.setDepth(GAME_OVER_TEXT_DEPTH);
    container.setScrollFactor(0);
    this.updateGameOverButtonHitArea(container, buttonImage.displayWidth, buttonImage.displayHeight);
    hitbox.on('pointerover', () => {
      container.setScale(GAME_OVER_BUTTON_HOVER_SCALE);
    });
    hitbox.on('pointerout', () => {
      container.setScale(1);
    });
    hitbox.on('pointerdown', () => {
      container.setScale(GAME_OVER_BUTTON_PRESS_SCALE);
    });
    hitbox.on('pointerup', () => {
      container.setScale(GAME_OVER_BUTTON_HOVER_SCALE);
      onClick();
    });
    return container;
  }

  private updateGameOverButtonHitArea(container: Phaser.GameObjects.Container, width: number, height: number) {
    const hitbox = container.getByName('hitbox') as Phaser.GameObjects.Rectangle | null;
    if (!hitbox) {
      return;
    }
    hitbox.setSize(width, height);
    hitbox.setDisplaySize(width, height);
    hitbox.setPosition(0, 0);
    hitbox.setOrigin(0.5);
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
      const retryImage = retryButton.getByName('image') as Phaser.GameObjects.Image;
      const retryText = retryButton.getByName('text') as Phaser.GameObjects.Text;
      retryImage.setDisplaySize(buttonWidth, retryButtonHeight);
      this.updateGameOverButtonHitArea(retryButton, buttonWidth, retryButtonHeight);
      retryText.setFontSize(buttonFontSize);
      const firstButtonY = scoreY + scoreHeight * 0.5 + verticalSpacing + retryButtonHeight * 0.5;
      retryButton.setPosition(0, firstButtonY);

      const homeImage = homeButton.getByName('image') as Phaser.GameObjects.Image;
      const homeText = homeButton.getByName('text') as Phaser.GameObjects.Text;
      homeImage.setDisplaySize(buttonWidth, homeButtonHeight);
      this.updateGameOverButtonHitArea(homeButton, buttonWidth, homeButtonHeight);
      homeText.setFontSize(buttonFontSize);
      homeButton.setPosition(0, firstButtonY + retryButtonHeight * 0.5 + buttonSpacing + homeButtonHeight * 0.5);
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
    this.resizeHud(gameSize.width, gameSize.height);
    this.layoutGameOverModal(gameSize.width, gameSize.height);

    const shouldEnableMobileControls = this.shouldUseMobileControls();
    if (!shouldEnableMobileControls) {
      this.destroyMobileControls();
      return;
    }

    if (!this.mobileControlsEnabled) {
      this.createMobileControls(gameSize.width, gameSize.height);
      return;
    }

    this.layoutMobileControls(gameSize.width, gameSize.height);
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

  private createHud(viewportWidth: number, viewportHeight: number) {
    this.hudBackground = this.add.image(0, 0, UI_RECTANGLE_GRADIENT).setOrigin(0, 0);
    this.hudBackground.setAlpha(1);
    this.hudBackground.setDepth(HUD_DEPTH);
    this.hudBackground.setDisplaySize(viewportWidth, HUD_BASE_HEIGHT);
    this.hudBackground.setScrollFactor(0);
    this.hudInnerPanel = this.add.image(0, 0, UI_RECTANGLE_GRADIENT_2).setOrigin(0.5, 0.5);
    this.hudInnerPanel.setAlpha(1);
    this.hudInnerPanel.setDepth(HUD_DEPTH + 1);
    this.hudInnerPanel.setDisplaySize(viewportWidth, HUD_BASE_HEIGHT);
    this.hudInnerPanel.setScrollFactor(0);

    const scoreStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${HUD_BASE_SCORE_FONT_SIZE}px`,
      fontStyle: '700',
      color: '#ffffff',
      stroke: '#0c1b2d',
      strokeThickness: 2
    };

    const timeStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${HUD_BASE_TIME_FONT_SIZE}px`,
      fontStyle: '600',
      color: '#e6efff',
      stroke: '#0c1b2d',
      strokeThickness: 2
    };

    const statStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${HUD_BASE_STAT_FONT_SIZE}px`,
      fontStyle: '600',
      color: '#f6f7fb',
      stroke: '#0c1b2d',
      strokeThickness: 2
    };

    this.scoreText = this.add.text(0, 0, '', scoreStyle).setOrigin(0, 0.5);
    this.scoreText.setDepth(HUD_TEXT_DEPTH);
    this.scoreText.setShadow(0, 2, '#0b0b0b', 2, true, true);
    this.scoreText.setScrollFactor(0);

    this.timeText = this.add.text(0, 0, '', timeStyle).setOrigin(0.5, 0.5);
    this.timeText.setDepth(HUD_TEXT_DEPTH);
    this.timeText.setShadow(0, 2, '#0b0b0b', 2, true, true);
    this.timeText.setScrollFactor(0);

    this.coinIcon = this.add.image(0, 0, COIN_1).setOrigin(0, 0.5);
    this.coinIcon.setScale(HUD_BASE_COIN_SCALE);
    this.coinIcon.setDepth(HUD_TEXT_DEPTH);
    this.coinIcon.setScrollFactor(0);

    this.coinText = this.add.text(0, 0, '', statStyle).setOrigin(0, 0.5);
    this.coinText.setDepth(HUD_TEXT_DEPTH);
    this.coinText.setShadow(0, 2, '#0b0b0b', 2, true, true);
    this.coinText.setScrollFactor(0);

    this.coinGroup = this.add.container(0, 0, [this.coinIcon, this.coinText]);
    this.coinGroup.setDepth(HUD_TEXT_DEPTH);
    this.coinGroup.setScrollFactor(0);

    this.fishIcon = this.add.image(0, 0, FISH_YELLOW_REST).setOrigin(0, 0.5);
    this.fishIcon.setScale(HUD_BASE_FISH_SCALE);
    this.fishIcon.setDepth(HUD_TEXT_DEPTH);
    this.fishIcon.setScrollFactor(0);

    this.fishOverlay = this.add.rectangle(0, 0, 1, 1, 0x0b0b0b, 0.65).setOrigin(0, 0);
    this.fishOverlay.setDepth(HUD_TEXT_DEPTH + 1);
    this.fishOverlay.setScrollFactor(0);

    this.fishText = this.add.text(0, 0, '0/4', statStyle).setOrigin(0, 0.5);
    this.fishText.setDepth(HUD_TEXT_DEPTH);
    this.fishText.setShadow(0, 2, '#0b0b0b', 2, true, true);
    this.fishText.setScrollFactor(0);

    this.fishGroup = this.add.container(0, 0, [this.fishIcon, this.fishOverlay, this.fishText]);
    this.fishGroup.setDepth(HUD_TEXT_DEPTH);
    this.fishGroup.setScrollFactor(0);

    this.setFishPowerProgress(0);
    this.stopFishPulse();
    this.resizeHud(viewportWidth, viewportHeight);
  }

  private resizeHud(viewportWidth: number, viewportHeight: number) {
    this.applyHudScale(viewportWidth, viewportHeight);
    const baseWidth = Math.max(0, viewportWidth - this.hudOuterPadding * 2);
    this.hudBackground.setDisplaySize(baseWidth, this.hudHeight);
    const innerWidth = Math.max(0, baseWidth - this.hudInnerMargin * 2);
    const innerHeight = Math.max(0, this.hudHeight - this.hudInnerMargin * 2);
    this.hudInnerPanel.setDisplaySize(innerWidth, innerHeight);
    this.scoreText.setFontSize(this.hudScoreFontSize);
    this.timeText.setFontSize(this.hudTimeFontSize);
    this.coinText.setFontSize(this.hudStatFontSize);
    this.fishText.setFontSize(this.hudStatFontSize);
    this.coinIcon.setScale(this.hudCoinScale);
    this.fishIcon.setScale(this.hudFishScale);
    this.layoutHud(viewportWidth);
  }

  private applyHudScale(viewportWidth: number, viewportHeight: number) {
    const baseScale = Math.min(viewportWidth / GAME_WIDTH, viewportHeight / GAME_HEIGHT);
    this.uiScale = Phaser.Math.Clamp(baseScale, 1, HUD_MAX_SCALE);
    this.hudHeight = Math.round(HUD_BASE_HEIGHT * this.uiScale);
    this.hudPadding = Math.round(HUD_BASE_PADDING * this.uiScale);
    this.hudOuterPadding = Math.round(HUD_BASE_OUTER_PADDING * this.uiScale);
    this.hudInnerMargin = Math.round(HUD_BASE_INNER_MARGIN * this.uiScale);
    this.hudContentOffsetY = Math.round(HUD_BASE_CONTENT_OFFSET_Y * this.uiScale);
    this.hudScoreFontSize = Math.round(HUD_BASE_SCORE_FONT_SIZE * this.uiScale);
    this.hudTimeFontSize = Math.round(HUD_BASE_TIME_FONT_SIZE * this.uiScale);
    this.hudStatFontSize = Math.round(HUD_BASE_STAT_FONT_SIZE * this.uiScale);
    this.hudCoinScale = HUD_BASE_COIN_SCALE * this.uiScale;
    this.hudFishScale = HUD_BASE_FISH_SCALE * this.uiScale;
    this.hudCoinGap = Math.round(HUD_BASE_COIN_GAP * this.uiScale);
    this.hudFishGap = Math.round(HUD_BASE_FISH_GAP * this.uiScale);
    this.hudGroupGap = Math.round(HUD_BASE_GROUP_GAP * this.uiScale);
  }

  private layoutHud(viewportWidth: number) {
    const baseX = this.hudOuterPadding;
    const baseY = this.hudOuterPadding;
    const baseWidth = Math.max(0, viewportWidth - this.hudOuterPadding * 2);
    const innerX = baseX + this.hudInnerMargin;
    const innerY = baseY + this.hudInnerMargin;
    const innerWidth = Math.max(0, baseWidth - this.hudInnerMargin * 2);
    const innerHeight = Math.max(0, this.hudHeight - this.hudInnerMargin * 2);
    const centerY = innerY + innerHeight / 2 + this.hudContentOffsetY;
    this.hudBackground.setPosition(baseX, baseY);
    this.hudInnerPanel.setPosition(innerX + innerWidth / 2, innerY + innerHeight / 2);
    this.scoreText.setPosition(innerX + this.hudPadding, centerY);
    this.timeText.setPosition(innerX + innerWidth / 2, centerY);

    const coinTextWidth = this.coinText.width;
    const coinIconWidth = this.coinIcon.displayWidth;
    const coinBlockWidth = coinIconWidth + this.hudCoinGap + coinTextWidth;
    const fishTextWidth = this.fishText.width;
    const fishIconWidth = this.fishIcon.displayWidth;
    const fishBlockWidth = fishIconWidth + this.hudFishGap + fishTextWidth;
    const rightGroupWidth = fishBlockWidth + this.hudGroupGap + coinBlockWidth;
    const fishBlockX = innerX + innerWidth - this.hudPadding - rightGroupWidth;
    const coinBlockX = fishBlockX + fishBlockWidth + this.hudGroupGap;

    this.coinIcon.setPosition(0, 0);
    this.coinText.setPosition(coinIconWidth + this.hudCoinGap, 0);
    this.coinGroup.setPosition(coinBlockX, centerY);

    const fishIconHeight = this.fishIcon.displayHeight;
    this.fishIcon.setPosition(0, 0);
    this.fishOverlay.setPosition(0, -fishIconHeight / 2);
    this.fishText.setPosition(fishIconWidth + this.hudFishGap, 0);
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

  private shouldUseMobileControls() {
    const isTouchDevice = this.sys.game.device.input.touch === true;
    const pointer = this.input.manager?.pointers?.[0];
    const pointerType = pointer && 'pointerType' in pointer ? (pointer as { pointerType?: string }).pointerType : undefined;
    const isTouchPointer = pointerType ? pointerType === 'touch' : true;
    return isTouchDevice && isTouchPointer;
  }

  private destroyMobileControls() {
    if (!this.mobileControlsEnabled) {
      return;
    }

    if (this.joystickMoveHandler) {
      this.input.off('pointermove', this.joystickMoveHandler);
    }
    if (this.joystickUpHandler) {
      this.input.off('pointerup', this.joystickUpHandler);
    }

    this.joystickContainer?.destroy(true);
    this.joystickContainer = undefined;
    this.joystickBase = undefined;
    this.joystickThumb = undefined;
    this.joystickPointerId = undefined;

    this.jumpButton?.destroy(true);
    this.jumpButton = undefined;
    this.jumpButtonImage = undefined;
    this.jumpButtonText = undefined;
    this.jumpButtonHitbox = undefined;

    this.mobileControlsEnabled = false;
    this.lastJumpTapTime = 0;
  }

  private createMobileControls(viewportWidth: number, viewportHeight: number) {
    this.mobileControlsEnabled = true;
    this.joystickContainer = this.add.container(0, 0);
    this.joystickContainer.setDepth(MOBILE_JOYSTICK_DEPTH);
    this.joystickContainer.setScrollFactor(0);

    this.joystickBase = this.add.image(0, 0, UI_ROUND_FLAT).setOrigin(0.5);
    this.joystickBase.setAlpha(0.45);
    this.joystickThumb = this.add.image(0, 0, UI_ROUND_FLAT).setOrigin(0.5);
    this.joystickThumb.setAlpha(0.85);

    this.joystickContainer.add([this.joystickBase, this.joystickThumb]);

    this.joystickMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId !== pointer.id) {
        return;
      }
      this.updateJoystick(pointer);
    };
    this.joystickUpHandler = (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId !== pointer.id) {
        return;
      }
      this.resetJoystick();
    };

    this.joystickBase.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver) {
        return;
      }
      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer);
    });
    this.input.on('pointermove', this.joystickMoveHandler);
    this.input.on('pointerup', this.joystickUpHandler);

    const jumpStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '20px',
      fontStyle: '700',
      color: '#ffffff',
      align: 'center'
    };
    this.jumpButtonImage = this.add.image(0, 0, UI_ROUND_FLAT).setOrigin(0.5);
    this.jumpButtonImage.setAlpha(0.55);
    this.jumpButtonText = this.add.text(0, 0, 'JUMP', jumpStyle).setOrigin(0.5);
    this.jumpButtonHitbox = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
    this.jumpButtonHitbox.setOrigin(0.5);
    this.jumpButtonHitbox.setInteractive();
    this.jumpButton = this.add.container(0, 0, [this.jumpButtonImage, this.jumpButtonText, this.jumpButtonHitbox]);
    this.jumpButton.setDepth(MOBILE_JUMP_BUTTON_DEPTH);
    this.jumpButton.setScrollFactor(0);

    this.jumpButtonHitbox.on('pointerdown', () => {
      if (this.gameOver) {
        return;
      }
      this.jumpButton?.setScale(0.96);
      this.jumpButtonImage?.setTint(0xdfe8ff);
      this.handleJumpButtonTap();
    });
    this.jumpButtonHitbox.on('pointerup', () => {
      this.jumpButton?.setScale(1);
      this.jumpButtonImage?.clearTint();
    });
    this.jumpButtonHitbox.on('pointerout', () => {
      this.jumpButton?.setScale(1);
      this.jumpButtonImage?.clearTint();
    });

    this.layoutMobileControls(viewportWidth, viewportHeight);
  }

  private layoutMobileControls(viewportWidth: number, viewportHeight: number) {
    if (!this.mobileControlsEnabled || !this.joystickContainer || !this.joystickBase || !this.joystickThumb || !this.jumpButton) {
      return;
    }

    const margin = Math.round(MOBILE_CONTROL_MARGIN * this.uiScale);
    const baseSize = MOBILE_JOYSTICK_BASE_SIZE * this.uiScale;
    const thumbSize = MOBILE_JOYSTICK_THUMB_SIZE * this.uiScale;
    const jumpSize = MOBILE_JUMP_BUTTON_SIZE * this.uiScale;
    this.joystickRadius = MOBILE_JOYSTICK_RADIUS * this.uiScale;

    this.joystickBase.setDisplaySize(baseSize, baseSize);
    this.joystickBase.setInteractive(new Phaser.Geom.Circle(0, 0, baseSize / 2), Phaser.Geom.Circle.Contains);
    this.joystickThumb.setDisplaySize(thumbSize, thumbSize);
    this.joystickThumb.setPosition(0, 0);
    this.joystickContainer.setPosition(margin + baseSize / 2, viewportHeight - margin - baseSize / 2);
    this.joystickCenter.set(this.joystickContainer.x, this.joystickContainer.y);

    this.jumpButtonImage?.setDisplaySize(jumpSize, jumpSize);
    this.jumpButtonText?.setFontSize(Math.round(20 * this.uiScale));
    const jumpX = viewportWidth - margin - jumpSize / 2;
    const jumpY = viewportHeight - margin - jumpSize / 2;
    this.jumpButton.setPosition(jumpX, jumpY);
    this.jumpButtonHitbox?.setSize(jumpSize, jumpSize);
    this.jumpButtonHitbox?.setDisplaySize(jumpSize, jumpSize);
    this.jumpButtonHitbox?.setPosition(0, 0);
  }

  private updateJoystick(pointer: Phaser.Input.Pointer) {
    if (!this.joystickThumb) {
      return;
    }
    const deltaX = pointer.x - this.joystickCenter.x;
    const clampedX = Phaser.Math.Clamp(deltaX, -this.joystickRadius, this.joystickRadius);
    const normalizedX = this.joystickRadius > 0 ? clampedX / this.joystickRadius : 0;
    const nextDirection = Math.abs(normalizedX) < MOBILE_JOYSTICK_DEADZONE ? 0 : normalizedX < 0 ? -1 : 1;
    this.joystickThumb.setPosition(clampedX, 0);
    this.moveDirection = nextDirection;
  }

  private resetJoystick() {
    this.joystickPointerId = undefined;
    this.moveDirection = 0;
    this.joystickThumb?.setPosition(0, 0);
  }

  private handleJumpButtonTap() {
    const now = this.time.now;
    const isDoubleTap =
      this.lastJumpTapTime > 0 && now - this.lastJumpTapTime <= MOBILE_JUMP_DOUBLE_TAP_WINDOW_MS;

    if (isDoubleTap && this.fishPowerCount === FISH_MAX_POWER && !this.slideActive) {
      this.lastJumpTapTime = 0;
      this.activateSlideMax();
      return;
    }

    if (this.lastJumpTapTime > 0 && now - this.lastJumpTapTime > MOBILE_JUMP_DOUBLE_TAP_WINDOW_MS) {
      this.lastJumpTapTime = 0;
    }

    this.lastJumpTapTime = now;
    this.tryJump();
  }

  private tryJump() {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const isGrounded = playerBody.blocked.down || playerBody.touching.down;
    if (!isGrounded) {
      return;
    }
    this.player.setVelocityY(this.currentJumpVelocity);
    this.audioManager.playSfx(this, SFX_PLAYER_JUMP);
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
