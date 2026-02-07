import type Phaser from 'phaser';

import {
  KENNEY_BG_COLOR_HILLS,
  KENNEY_BG_COLOR_HILLS_PATH,
  KENNEY_BG_SOLID_SKY,
  KENNEY_BG_SOLID_SKY_PATH,
  PLAYER_HIT,
  PLAYER_HIT_PATH,
  PLAYER_IDLE,
  PLAYER_IDLE_PATH,
  PLAYER_WALK_A,
  PLAYER_WALK_A_PATH,
  PLAYER_WALK_B,
  PLAYER_WALK_B_PATH
} from './kenney';

export const loadKenneyAssets = (scene: Phaser.Scene) => {
  scene.load.image(KENNEY_BG_SOLID_SKY, KENNEY_BG_SOLID_SKY_PATH);
  scene.load.image(KENNEY_BG_COLOR_HILLS, KENNEY_BG_COLOR_HILLS_PATH);

  scene.load.image(PLAYER_WALK_A, PLAYER_WALK_A_PATH);
  scene.load.image(PLAYER_WALK_B, PLAYER_WALK_B_PATH);
  scene.load.image(PLAYER_IDLE, PLAYER_IDLE_PATH);
  scene.load.image(PLAYER_HIT, PLAYER_HIT_PATH);
};
