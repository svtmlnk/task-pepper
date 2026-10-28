import { Application, Assets, Graphics, TextureStyle } from "pixi.js";
import { FONT_NAME, PALETTE, SCREEN } from "./config.js";
import { Scheduler } from "./fx.js";
import { AudioManager } from "./audio.js";
import { createTextures } from "./textures.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { StoryScene } from "./scenes/StoryScene.js";
import { GameOverScene } from "./scenes/GameOverScene.js";

// Клавиши, которые не должны прокручивать страницу
const BLOCKED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);

// Вся игра изолирована в этом классе: ничего не попадает в глобальную область
export class ArkanoidGame {
  constructor(root) {
    this.root = root;
    this.scene = null;
    this.transitioning = false;
    this.scheduler = new Scheduler();
    this.audio = new AudioManager();

    const keys = new Set();
    this.input = {
      keys,
      isDown: (codes) => codes.some((code) => keys.has(code)),
    };
  }

  async init() {
    // Чёткие пиксели без сглаживания
    TextureStyle.defaultOptions.scaleMode = "nearest";

    this.app = new Application();
    await this.app.init({
      width: SCREEN.width,
      height: SCREEN.height,
      background: PALETTE.black,
      antialias: false,
      resolution: 1,
      roundPixels: true,
    });
    this.canvas = this.app.canvas;
    this.canvas.classList.add("arkanoid-canvas");
    this.root.appendChild(this.canvas);

    const [paddle, ball] = await Promise.all([
      Assets.load("/assets/arkanoid.png"),
      Assets.load("/assets/ball.png"),
      this.loadFont(),
    ]);
    paddle.source.scaleMode = "nearest";
    ball.source.scaleMode = "nearest";
    this.textures = createTextures({ paddle, ball });

    this.scenes = {
      menu: new MenuScene(this),
      story: new StoryScene(this),
      game: new GameScene(this),
      gameOver: new GameOverScene(this),
    };
    for (const scene of Object.values(this.scenes))
      this.app.stage.addChild(scene.container);

    // "Шторка" для переходов между сценами
    this.curtain = new Graphics()
      .rect(0, 0, SCREEN.width, SCREEN.height)
      .fill(PALETTE.black);
    this.curtain.alpha = 0;
    this.app.stage.addChild(this.curtain);

    this.bindEvents();
    this.resize();
    this.app.ticker.add((ticker) =>
      this.update(Math.min(ticker.deltaTime, 3), Math.min(ticker.deltaMS, 50)),
    );

    this.switchTo("menu");
  }

  // Пиксельный шрифт лежит локально, чтобы текст на canvas не отрисовался запасным шрифтом
  async loadFont() {
    try {
      const face = new FontFace(
        FONT_NAME,
        "url(/assets/fonts/PressStart2P.woff2)",
      );
      document.fonts.add(await face.load());
    } catch {
      // Без шрифта игра всё равно запустится (с моноширинным шрифтом браузера)
    }
  }

  bindEvents() {
    this.onKeyDown = (e) => {
      this.audio.unlock();
      if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
      this.input.keys.add(e.code);
      if (e.repeat) return;
      if (e.code === "KeyM") this.audio.toggleMute();
      if (!this.transitioning) this.scene?.onKeyDown(e.code);
    };
    this.onKeyUp = (e) => this.input.keys.delete(e.code);
    this.onBlur = () => this.input.keys.clear();
    this.onResize = () => this.resize();

    // Игра управляется только с клавиатуры
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("resize", this.onResize);
  }

  // Масштабируем холст целым множителем, чтобы пиксели оставались квадратными
  resize() {
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          window.innerWidth / SCREEN.width,
          window.innerHeight / SCREEN.height,
        ),
      ),
    );
    this.canvas.style.width = `${SCREEN.width * scale}px`;
    this.canvas.style.height = `${SCREEN.height * scale}px`;
  }

  // Переход: экран ступенчато темнеет, сцена меняется, экран светлеет
  async switchTo(name, data) {
    if (this.transitioning) return;
    this.transitioning = true;
    const next = this.scenes[name];
    const steps = (t) => Math.round(t * 8) / 8;

    if (this.scene) {
      await this.scheduler.tween(400, (t) => (this.curtain.alpha = steps(t)));
      this.scene.exit();
      this.scene.scheduler.clear();
      this.scene.container.visible = false;
    } else {
      this.curtain.alpha = 1;
    }

    this.scene = next;
    next.container.visible = true;
    next.enter(data);

    await this.scheduler.tween(400, (t) => (this.curtain.alpha = steps(1 - t)));
    this.transitioning = false;
  }

  update(delta, ms) {
    this.scheduler.update(ms);
    if (!this.scene) return;
    this.scene.scheduler.update(ms);
    this.scene.update(delta, ms);
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("resize", this.onResize);
    this.audio.destroy();
    this.app.destroy(true, { children: true });
  }
}
