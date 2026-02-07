import "./style.css";
import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import { SplashScene } from "./scenes/SplashScene";

const PHYSICS_DEBUG = false;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0b0b14",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: PHYSICS_DEBUG,
    },
  },
  scene: [SplashScene, GameScene],
};

new Phaser.Game(config);
