declare module 'phaser' {
  namespace Phaser {
    const AUTO: number;

    class Game {
      constructor(config: Phaser.Types.Core.GameConfig);
    }

    namespace Math {
      function Between(min: number, max: number): number;
    }

    namespace Structs {
      interface Set<T> {
        each(callback: (value: T) => void): void;
      }
    }

    namespace GameObjects {
      class GameObject {
        x: number;
        y: number;
        destroy(): void;
      }

      class Text extends GameObject {
        setText(text: string): this;
        setOrigin(x?: number, y?: number): this;
      }

      class Graphics extends GameObject {
        fillStyle(color: number, alpha?: number): this;
        fillRoundedRect(x: number, y: number, width: number, height: number, radius: number): this;
        fillCircle(x: number, y: number, radius: number): this;
        generateTexture(key: string, width: number, height: number): void;
        clear(): this;
        destroy(): void;
      }
    }

    namespace Input {
      interface Pointer {
        x: number;
      }

      namespace Keyboard {
        class Key {
          isDown: boolean;
        }
      }
    }

    namespace Types {
      namespace Core {
        interface GameConfig {
          type: number;
          parent?: string;
          backgroundColor?: string;
          scale?: {
            mode?: number;
            autoCenter?: number;
            width?: number;
            height?: number;
          };
          physics?: {
            default: string;
            arcade?: {
              gravity?: { x?: number; y?: number };
              debug?: boolean;
            };
          };
          scene?: Array<typeof Phaser.Scene>;
        }
      }

      namespace Input {
        namespace Keyboard {
          interface CursorKeys {
            left?: Phaser.Input.Keyboard.Key;
            right?: Phaser.Input.Keyboard.Key;
          }
        }
      }
    }

    namespace Scale {
      const FIT: number;
      const CENTER_BOTH: number;
    }

    namespace Physics {
      namespace Arcade {
        class Sprite extends Phaser.GameObjects.GameObject {
          setCollideWorldBounds(value: boolean): this;
          setVelocityX(value: number): this;
          setVelocityY(value: number): this;
          setVelocity(x: number, y: number): this;
        }

        class Group {
          children: Phaser.Structs.Set<Phaser.GameObjects.GameObject>;
          create(x: number, y: number, key: string): Phaser.GameObjects.GameObject;
          setVelocityY(value: number): this;
        }
      }
    }

    namespace Time {
      interface Clock {
        now: number;
      }
    }

    namespace Scenes {
      interface SceneManager {
        restart(): void;
      }

      namespace SettingsConfig {}
    }

    class Scene {
      constructor(config?: string | Phaser.Types.Scenes.SettingsConfig);
      add: {
        text(x: number, y: number, text: string, style?: Record<string, unknown>): Phaser.GameObjects.Text;
        graphics(): Phaser.GameObjects.Graphics;
      };
      physics: {
        add: {
          sprite(x: number, y: number, key: string): Phaser.Physics.Arcade.Sprite;
          group(): Phaser.Physics.Arcade.Group;
          collider(
            object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Group,
            object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Group,
            collideCallback: () => void
          ): void;
          overlap(
            object1: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Group,
            object2: Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Group,
            overlapCallback: (object1: Phaser.GameObjects.GameObject, object2: Phaser.GameObjects.GameObject) => void
          ): void;
        };
      };
      input: {
        keyboard: {
          createCursorKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
          addKeys(keys: string): Record<string, Phaser.Input.Keyboard.Key>;
        };
        on(event: string, callback: (pointer: Phaser.Input.Pointer) => void): void;
        once(event: string, callback: () => void): void;
      };
      time: Phaser.Time.Clock;
      scene: Phaser.Scenes.SceneManager;
    }
  }

  interface PhaserStatic {
    AUTO: number;
    Scene: typeof Phaser.Scene;
    Math: typeof Phaser.Math;
    Scale: typeof Phaser.Scale;
    Game: new (config: Phaser.Types.Core.GameConfig) => void;
  }

  const Phaser: PhaserStatic;

  export default Phaser;
}
