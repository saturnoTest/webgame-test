import type Phaser from 'phaser';

import { PLAYER_IDLE, PLAYER_WALK_A, PLAYER_WALK_B } from './kenney';

export const PLAYER_ANIM_IDLE = 'player-idle';
export const PLAYER_ANIM_WALK = 'player-walk';

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
};
