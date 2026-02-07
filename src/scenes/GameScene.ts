import Phaser from 'phaser';

import { FISH_YELLOW_SWIM_ANIM, PLAYER_ANIM_IDLE, PLAYER_ANIM_JUMP, PLAYER_ANIM_WALK, registerKenneyAnims } from '../assets/anims';
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
  UI_RECTANGLE_GRADIENT
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
const HUD_HEIGHT = 44;
const HUD_PADDING = 12;
const HUD_DEPTH = 10;
const HUD_TEXT_DEPTH = 12;
const HUD_COIN_SCALE = 0.35;
const HUD_COIN_GAP = 6;
const HUD_FISH_SCALE = 0.4;
const HUD_FISH_GAP = 8;
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
  private hudBackground!: Phaser.GameObjects.Image;
  private coinsCollected = 0;
  private gameOver = false;
  private baseColor!: Phaser.GameObjects.Rectangle;
  private desertBackground!: Phaser.GameObjects.Image;
  private cloudLayer!: Phaser.GameObjects.TileSprite;
  private groundTopY = 0;

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
    this.scale.on(Phaser.Scale.Events.RESIZE, (gameSize: Phaser.Structs.Size) => {
      this.resizeBackgrounds(gameSize.width, gameSize.height);
      this.resizeHud(gameSize.width);
    });

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
    });
    this.physics.add.overlap(this.player, this.fishPickups, (_player, fish) => {
      const target = fish as Phaser.Physics.Arcade.Sprite;
      target.destroy();
      this.setFishPowerCount(this.fishPowerCount + 1);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('A,D,SPACE') as { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.moveDirection = pointer.x < GAME_WIDTH / 2 ? -1 : 1;
    });

    this.input.on('pointerup', () => {
      this.moveDirection = 0;
    });

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
    this.setFishPowerCount(0);
  }

  update(time: number, delta: number) {
    this.cloudLayer.tilePositionX += delta * CLOUD_SCROLL_SPEED;

    if (this.gameOver) {
      if (this.keys.SPACE.isDown) {
        this.scene.restart();
      }
      return;
    }

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
      this.player.setVelocityY(JUMP_VELOCITY);
    }

    this.player.setVelocityX(direction * PLAYER_SPEED);

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
    const scoreValue = Math.floor(elapsedSeconds * 10 + this.coinsCollected * 50);
    this.scoreText.setText(`${scoreValue}`);
    this.timeText.setText(`${elapsedSeconds.toFixed(1)}s`);
    this.coinText.setText(`${this.coinsCollected}`);
    this.layoutHud(this.scale.width);
  }

  private handleGameOver() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.player.setVelocity(0, 0);
    this.obstacles.setVelocityY(0);
    this.coins.setVelocityY(0);
    this.fishPickups.setVelocityX(0);
    this.statusText.setText('Game Over\nTap o presiona Espacio para reiniciar');
    this.input.once('pointerdown', () => this.scene.restart());
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
    this.resizeHud(viewportWidth);
  }

  private resizeHud(viewportWidth: number) {
    this.hudBackground.setDisplaySize(viewportWidth, HUD_HEIGHT);
    this.layoutHud(viewportWidth);
  }

  private layoutHud(viewportWidth: number) {
    const centerY = HUD_HEIGHT / 2;
    this.hudBackground.setPosition(0, 0);
    this.scoreText.setPosition(HUD_PADDING, centerY);
    this.timeText.setPosition(viewportWidth / 2, centerY);

    const coinTextWidth = this.coinText.width;
    const coinIconWidth = this.coinIcon.displayWidth;
    const coinBlockWidth = coinIconWidth + HUD_COIN_GAP + coinTextWidth;
    const fishTextWidth = this.fishText.width;
    const fishIconWidth = this.fishIcon.displayWidth;
    const fishBlockWidth = fishIconWidth + HUD_FISH_GAP + fishTextWidth;
    const coinBlockX = viewportWidth - HUD_PADDING - coinBlockWidth;
    const fishBlockX = coinBlockX - HUD_FISH_GAP - fishBlockWidth;

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
    this.layoutHud(this.scale.width);
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
