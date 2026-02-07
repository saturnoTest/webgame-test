import type Phaser from 'phaser';

import { FISH_YELLOW_REST, FISH_YELLOW_SWIM_A, FISH_YELLOW_SWIM_B, PLAYER_IDLE, PLAYER_WALK_A, PLAYER_WALK_B } from './kenney';

export const PLAYER_ANIM_IDLE = 'player-idle';
export const PLAYER_ANIM_WALK = 'player-walk';
export const PLAYER_ANIM_JUMP = 'player-jump';
export const FISH_YELLOW_SWIM_ANIM = 'fish-yellow-swim';

export const registerKenneyAnims = (scene: Phaser.Scene) => {
  if (!scene.anims.exists(PLAYER_ANIM_WALK)) {
    scene.anims.create({
      key: PLAYER_ANIM_WALK,
      frames: [{ key: PLAYER_WALK_A }, { key: PLAYER_WALK_B }],
      frameRate: 6,
      repeat: -1
    });
  }

  if (!scene.anims.exists(PLAYER_ANIM_IDLE)) {
    scene.anims.create({
      key: PLAYER_ANIM_IDLE,
      frames: [{ key: PLAYER_IDLE }],
      frameRate: 1,
      repeat: -1
    });
  }

  if (!scene.anims.exists(PLAYER_ANIM_JUMP)) {
    scene.anims.create({
      key: PLAYER_ANIM_JUMP,
      frames: [{ key: PLAYER_IDLE }],
      frameRate: 1,
      repeat: -1
    });
  }

  if (!scene.anims.exists(FISH_YELLOW_SWIM_ANIM)) {
    scene.anims.create({
      key: FISH_YELLOW_SWIM_ANIM,
      frames: [{ key: FISH_YELLOW_REST }, { key: FISH_YELLOW_SWIM_A }, { key: FISH_YELLOW_SWIM_B }],
      frameRate: 10,
      repeat: -1
    });
  }
};
