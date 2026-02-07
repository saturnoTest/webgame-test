import Phaser from "phaser";

type MusicStartOptions = {
  loop?: boolean;
};

type PlaySfxOptions = Phaser.Types.Sound.SoundConfig;

type SoundWithRate = Phaser.Sound.BaseSound & { setRate: (rate: number) => Phaser.Sound.BaseSound };
type SoundWithMute = Phaser.Sound.BaseSound & { setMute: (muted: boolean) => Phaser.Sound.BaseSound };

const hasSetRate = (sound: Phaser.Sound.BaseSound): sound is SoundWithRate => "setRate" in sound;
const hasSetMute = (sound: Phaser.Sound.BaseSound): sound is SoundWithMute => "setMute" in sound;

export class AudioManager {
  currentMusic?: Phaser.Sound.BaseSound;
  musicVolume = 0.35;
  sfxVolume = 0.7;
  private muted = false;

  playSfx(scene: Phaser.Scene, key: string, opts: PlaySfxOptions = {}): Phaser.Sound.BaseSound {
    const volume = (opts.volume ?? 1) * this.sfxVolume;
    const sound = scene.sound.add(key, { ...opts, volume });

    if (hasSetMute(sound)) {
      sound.setMute(this.muted);
    }
    sound.once(Phaser.Sound.Events.COMPLETE, () => {
      sound.destroy();
    });
    sound.play();

    return sound;
  }

  startMusic(scene: Phaser.Scene, key: string, { loop = true }: MusicStartOptions = {}): Phaser.Sound.BaseSound {
    if (this.currentMusic && this.currentMusic.key === key && this.currentMusic.isPlaying) {
      return this.currentMusic;
    }

    this.stopMusic();

    const music = scene.sound.add(key, { loop, volume: this.musicVolume });
    if (hasSetMute(music)) {
      music.setMute(this.muted);
    }
    music.play();
    this.currentMusic = music;

    music.once(Phaser.Sound.Events.DESTROY, () => {
      if (this.currentMusic === music) {
        this.currentMusic = undefined;
      }
    });

    return music;
  }

  stopMusic(): void {
    if (!this.currentMusic) {
      return;
    }

    this.currentMusic.stop();
    this.currentMusic.destroy();
    this.currentMusic = undefined;
  }

  setMusicRate(rate: number): void {
    if (this.currentMusic && hasSetRate(this.currentMusic)) {
      this.currentMusic.setRate(rate);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.currentMusic && hasSetMute(this.currentMusic)) {
      this.currentMusic.setMute(muted);
    }
  }
}
