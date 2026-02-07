# Kenney assets

## Estructura actual

```
public/assets/kenney/
  backgrounds/
  objects-enemies/
    coins/
    enemies/
      blocks/
    fish/
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
  UI/
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
| `FISH_YELLOW_REST` | `public/assets/kenney/objects-enemies/fish/fish_yellow_rest.png` |
| `FISH_YELLOW_SWIM_A` | `public/assets/kenney/objects-enemies/fish/fish_yellow_swim_a.png` |
| `FISH_YELLOW_SWIM_B` | `public/assets/kenney/objects-enemies/fish/fish_yellow_swim_b.png` |

### Ground tiles

| Key | Archivo |
| --- | --- |
| `TERRAIN_GRASS_TOP` | `public/assets/kenney/tiles/ground/terrain_grass_top.png` |
| `TERRAIN_GRASS_BOTTOM` | `public/assets/kenney/tiles/ground/terrain_grass_bottom.png` |

### UI

| Key | Archivo | Uso previsto |
| --- | --- | --- |
| `UI_RECTANGLE_GRADIENT` | `public/assets/kenney/UI/rectangle_gradient.png` | Barra de estado / contenedor UI |
| `UI_ROUND_FLAT` | `public/assets/kenney/UI/round_flat.png` | Fondo de botón o icono |

## Audio

| Key | Archivo | Uso previsto |
| --- | --- | --- |
| `SFX_PLAYER_DEAD` | `public/assets/music-sounds/player/dead.ogg` | Sonido al perder o morir |
| `SFX_PLAYER_JUMP` | `public/assets/music-sounds/player/jump.ogg` | Salto del jugador |
| `SFX_PLAYER_SLIDE` | `public/assets/music-sounds/player/slide.mp3` | Deslizamiento del jugador |
| `SFX_PLAYER_STEPS` | `public/assets/music-sounds/player/steps.mp3` | Pasos del jugador |
| `SFX_PICKUP_COIN` | `public/assets/music-sounds/coin/coin.ogg` | Recolección de moneda |
| `MUSIC_BG_NORMAL` | `public/assets/music-sounds/bg/normal-speed.wav` | Música de fondo a velocidad normal |
| `MUSIC_BG_SLIDE` | `public/assets/music-sounds/bg/fast-speed-slide-power.mp3` | Música de fondo en modo rápido/deslizamiento |
| `MUSIC_SPLASH_LOOP` | `public/assets/music-sounds/splash_screen/splash-music-loop.mp3` | Loop musical de la pantalla de inicio |

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
