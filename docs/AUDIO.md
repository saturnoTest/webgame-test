# Audio

Use the `AudioManager` to centralize music and SFX playback via the Phaser Sound API.

## Setup

```ts
import { AudioManager } from "../audio/AudioManager";

const audio = new AudioManager();
```

## Music

```ts
audio.startMusic(this, "bg-theme", { loop: true });
```

- `startMusic` avoids restarting if the same track is already playing.
- `stopMusic` halts and clears the current track.
- `setMusicRate` adjusts the playback rate (useful for slide mode).

## SFX

```ts
audio.playSfx(this, "coin-pickup");
```

## Muting

```ts
audio.setMuted(true);
```

## Volume Defaults

- `musicVolume` defaults to `0.35`.
- `sfxVolume` defaults to `0.7`.
