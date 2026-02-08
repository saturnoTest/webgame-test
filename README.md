# One-Tap Dodge (MVP)

Juego web casual en el que esquivas obstáculos con un solo gesto, con monedas y power-ups que activan un "slide max" de alta velocidad.

## Gameplay / Cómo jugar

**Desktop**
- Moverse: **←/→** o **A/D**.
- Saltar: **Space**.
- Slide max: **doble tap** de izquierda o derecha cuando el medidor de fish esté completo.

**Mobile**
- Moverse: **joystick** en pantalla.
- Saltar: **botón Jump**.
- Slide max: **doble tap** en Jump cuando el medidor de fish esté completo.

## Features principales
- Obstáculos que caen con velocidad creciente y spawn dinámico.
- Monedas coleccionables y marcador de tiempo/puntaje.
- Power-up de fish que habilita el **slide max** con velocidad extra.
- HUD responsivo con contadores de score, tiempo, monedas y fish.

## Tech stack
- **Phaser 3**
- **TypeScript** (modo strict)
- **Vite**

Escenas principales: `SplashScene` y `GameScene` en `src/scenes/`.

## Estructura de assets (resumen)
- `public/assets/kenney/` (sprites, UI, tiles y `License.txt` de Kenney)
- `public/assets/music-sounds/` (música y SFX por categoría)
- `public/assets/splash/` (splash screen)

## Cómo correrlo local

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run dev-net
```

```bash
npm run build
```

```bash
npm run preview
```

```bash
npm run typecheck
```

## Deploy (GitHub Pages)

1) En GitHub, ve a **Settings → Pages** y selecciona **Source: GitHub Actions**.
2) El deploy se ejecuta automáticamente en cada push a `main` (también puedes ejecutarlo manualmente desde Actions).
3) URL esperada:
   - `https://<OWNER>.github.io/<REPO>/`

**Nota sobre Vite base path:** el build usa `base: "/<REPO>/"` en GitHub Actions para que los assets se resuelvan desde la ruta del repo en GitHub Pages. En local, `npm run dev` mantiene `base: "/"`.  

**Troubleshooting rápido**
- Pantalla en blanco: revisa que el `base` coincida con el nombre del repo y que los assets carguen desde `/<REPO>/`.
- Revisa los logs del workflow en **Actions** para ver errores de build o deploy.

## Metodología / Gobernanza (IA + PRs humanos)
- **Repo org**: MVPFlow.
- **IA/bot**: saturnoTest (crea PRs).
- **Humano**: theghost1980 (aprueba).
- **Governance**: CODEOWNERS + branch protection (PR requerido, 1 approval mínimo, status checks obligatorios).
- **Regla “Index first”** para assets: primero index/loader/docs, luego uso en gameplay.
- **No commitear binarios desde Codex** (solo integración por humanos).

## Créditos
- Assets de **Kenney**: https://kenney.nl/ (ver `public/assets/kenney/License.txt`).

## License
- Por definir. Agregar un archivo de licencia en la raíz cuando el proyecto se publique formalmente.
