import Phaser from 'phaser';

import { PLAYER_ANIM_IDLE, PLAYER_ANIM_WALK, registerKenneyAnims } from '../assets/anims';
import { loadKenneyAssets } from '../assets/loadKenney';
import { HAZARD_CRATE, KENNEY_BG_SOLID_SKY, PICKUP_TOKEN, PLAYER_IDLE } from '../assets/kenney';

type SpawnType = 'obstacle' | 'coin';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 800;
const PLAYER_SPEED = 360;
const BASE_FALL_SPEED = 180;
const FALL_SPEED_INCREASE = 12;
const BASE_SPAWN_INTERVAL = 900;
const MIN_SPAWN_INTERVAL = 320;
const COIN_CHANCE = 0.22;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };
  private moveDirection = 0;
  private startTime = 0;
  private lastSpawnTime = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private coinsCollected = 0;
  private gameOver = false;

  constructor() {
    super('game');
  }

  preload() {
    loadKenneyAssets(this);
  }

  create() {
    this.add.image(0, 0, KENNEY_BG_SOLID_SKY).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    registerKenneyAnims(this);

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 90, PLAYER_IDLE);
    const playerBodyWidth = this.player.width * 0.65;
    const playerBodyHeight = this.player.height * 0.78;
    this.player.setSize(playerBodyWidth, playerBodyHeight);
    this.player.setOffset((this.player.width - playerBodyWidth) / 2, this.player.height - playerBodyHeight);
    this.player.setCollideWorldBounds(true);
    this.player.anims.play(PLAYER_ANIM_IDLE);

    this.obstacles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });
    this.coins = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image });

    this.physics.add.collider(this.player, this.obstacles, () => this.handleGameOver());
    this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
      const target = coin as Phaser.Physics.Arcade.Image;
      target.destroy();
      this.coinsCollected += 1;
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('A,D,SPACE') as { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.moveDirection = pointer.x < GAME_WIDTH / 2 ? -1 : 1;
    });

    this.input.on('pointerup', () => {
      this.moveDirection = 0;
    });

    this.scoreText = this.add.text(24, 20, '', {
      fontSize: '20px',
      color: '#f6f7fb'
    });

    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '28px',
      color: '#f6f7fb',
      align: 'center'
    });
    this.statusText.setOrigin(0.5);

    this.startTime = this.time.now;
    this.lastSpawnTime = this.time.now;
    this.gameOver = false;
    this.coinsCollected = 0;
  }

  update(time: number) {
    if (this.gameOver) {
      if (this.keys.SPACE.isDown) {
        this.scene.restart();
      }
      return;
    }

    this.handleMovement();
    this.handleSpawning(time);
    this.cleanupOffscreen();
    this.updateScore(time);
  }

  private handleMovement() {
    let direction = this.moveDirection;
    const left = this.cursors.left?.isDown || this.keys.A.isDown;
    const right = this.cursors.right?.isDown || this.keys.D.isDown;

    if (left) {
      direction = -1;
    } else if (right) {
      direction = 1;
    }

    this.player.setVelocityX(direction * PLAYER_SPEED);

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
      const coin = this.coins.create(x, y, PICKUP_TOKEN) as Phaser.Physics.Arcade.Image;
      const coinRadius = Math.min(coin.width, coin.height) * 0.25;
      coin.setCircle(coinRadius);
      coin.setOffset((coin.width - coinRadius * 2) / 2, (coin.height - coinRadius * 2) / 2);
      coin.setVelocityY(fallSpeed * 0.9);
    } else {
      const obstacle = this.obstacles.create(x, y, HAZARD_CRATE) as Phaser.Physics.Arcade.Sprite;
      const obstacleBodyWidth = obstacle.width * 0.55;
      const obstacleBodyHeight = obstacle.height * 0.65;
      obstacle.setSize(obstacleBodyWidth, obstacleBodyHeight);
      obstacle.setOffset((obstacle.width - obstacleBodyWidth) / 2, (obstacle.height - obstacleBodyHeight) / 2);
      obstacle.setVelocityY(fallSpeed);
    }
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
  }

  private updateScore(time: number) {
    const elapsedSeconds = Math.max(0, (time - this.startTime) / 1000);
    const scoreValue = Math.floor(elapsedSeconds * 10 + this.coinsCollected * 50);
    this.scoreText.setText(`Score: ${scoreValue}  |  Tiempo: ${elapsedSeconds.toFixed(1)}s  |  Monedas: ${this.coinsCollected}`);
  }

  private handleGameOver() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.player.setVelocity(0, 0);
    this.obstacles.setVelocityY(0);
    this.coins.setVelocityY(0);
    this.statusText.setText('Game Over\nTap o presiona Espacio para reiniciar');
    this.input.once('pointerdown', () => this.scene.restart());
  }

}
