# Kenney assets

## Estructura actual

```
public/assets/kenney/
  backgrounds/
  objects-enemies/
    coins/
    enemies/
      blocks/
  tiles/
    ground/
  player/
    climb/
    duck/
    front/
    hit/
    idle/
    jump/
    walk/
```

## Reglas

- Los assets binarios (`.png/.jpg/.zip/.webp`) **no se tocan**.
- No mover, renombrar ni editar archivos dentro de `public/assets/kenney`.

## Asset keys (Phaser)

### Backgrounds

| Key | Archivo |
| --- | --- |
| `KENNEY_BG_SOLID_SKY` | `public/assets/kenney/backgrounds/background_solid_sky.png` |
| `KENNEY_BG_COLOR_HILLS` | `public/assets/kenney/backgrounds/background_color_hills.png` |

### Player

| Key | Archivo |
| --- | --- |
| `PLAYER_WALK_A` | `public/assets/kenney/player/walk/character_beige_walk_a.png` |
| `PLAYER_WALK_B` | `public/assets/kenney/player/walk/character_beige_walk_b.png` |
| `PLAYER_IDLE` | `public/assets/kenney/player/idle/character_beige_idle.png` |
| `PLAYER_HIT` | `public/assets/kenney/player/hit/character_beige_hit.png` |

### Objects & Enemies

| Key | Archivo |
| --- | --- |
| `COIN_1` | `public/assets/kenney/objects-enemies/coins/coin_1.png` |
| `ENEMY_BLOCK_1` | `public/assets/kenney/objects-enemies/enemies/blocks/block_1.png` |
| `ENEMY_BLOCK_2` | `public/assets/kenney/objects-enemies/enemies/blocks/block_2.png` |

### Ground tiles

| Key | Archivo |
| --- | --- |
| `TERRAIN_GRASS_TOP` | `public/assets/kenney/tiles/ground/terrain_grass_top.png` |
| `TERRAIN_GRASS_BOTTOM` | `public/assets/kenney/tiles/ground/terrain_grass_bottom.png` |

## Cómo cargar assets en Phaser

```ts
import { loadKenneyAssets } from '../assets/loadKenney';
import { PLAYER_IDLE } from '../assets/kenney';

export class GameScene extends Phaser.Scene {
  preload() {
    loadKenneyAssets(this);
  }

  create() {
    const player = this.physics.add.sprite(240, 400, PLAYER_IDLE);
  }
}
```

## Animaciones

```ts
import { PLAYER_ANIM_IDLE, PLAYER_ANIM_WALK, registerKenneyAnims } from '../assets/anims';

registerKenneyAnims(this);
player.anims.play(PLAYER_ANIM_IDLE);
player.anims.play(PLAYER_ANIM_WALK, true);
```
