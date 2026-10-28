import { Container, Sprite, Texture } from "pixi.js";
import { Scene } from "./Scene.js";
import { BALL, BRICK, FIELD, LIVES, PADDLE, PALETTE, WALL } from "../config.js";
import { Particles, setFade } from "../fx.js";
import { nextLayout } from "../layouts.js";

const LEFT_KEYS = ["ArrowLeft"];
const RIGHT_KEYS = ["ArrowRight"];
const LAUNCH_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp"];

const TRAIL = [
  { size: 8, color: PALETTE.green },
  { size: 6, color: PALETTE.forest },
  { size: 6, color: PALETTE.forest },
  { size: 4, color: PALETTE.moss },
  { size: 4, color: PALETTE.moss },
];

const DEG = Math.PI / 180;

// САМА ИГРА
export class GameScene extends Scene {
  constructor(game) {
    super(game);
    const tex = game.textures;

    // Всё, что трясётся при потере мяча
    this.world = new Container();
    this.container.addChild(this.world);

    const background = new Sprite(tex.background);
    background.scale.set(2);
    background.position.set(FIELD.left, FIELD.top);
    this.world.addChild(background);

    this.bricksLayer = new Container();
    this.world.addChild(this.bricksLayer);

    this.trail = TRAIL.map(({ size, color }) => {
      const sprite = new Sprite(Texture.WHITE);
      sprite.anchor.set(0.5);
      sprite.width = sprite.height = size;
      sprite.tint = color;
      this.world.addChild(sprite);
      return sprite;
    });
    this.trailHistory = [];

    this.paddle = new Sprite(tex.paddle);
    this.paddle.anchor.set(0.5);
    this.paddle.scale.set(PADDLE.scale);
    this.world.addChild(this.paddle);

    this.ball = new Sprite(tex.ball);
    this.ball.anchor.set(0.5);
    this.ball.scale.set(BALL.scale);
    this.world.addChild(this.ball);

    this.particles = new Particles(this.world);

    this.createFrame(tex);

    this.livesLayer = new Container();
    this.world.addChild(this.livesLayer);

    // Обучение: подсказка по управлению перед первым запуском мяча
    this.hint = new Container();
    this.hint.position.set((FIELD.left + FIELD.right) / 2, 300);
    this.container.addChild(this.hint);
  }

  createFrame(tex) {
    const frameLeft = FIELD.left - WALL;
    const frameTop = FIELD.top - WALL;
    const parts = [
      [tex.wallVertical, frameLeft, frameTop],
      [tex.wallVertical, FIELD.right, frameTop],
      [tex.wallTop, frameLeft, frameTop],
      [tex.corner, frameLeft, frameTop],
      [tex.corner, FIELD.right, frameTop],
    ];
    for (const [texture, x, y] of parts) {
      const sprite = new Sprite(texture);
      sprite.scale.set(2);
      sprite.position.set(x, y);
      this.world.addChild(sprite);
    }
  }

  enter() {
    this.lives = LIVES;
    this.state = "spawning";
    this.shakeTime = 0;
    this.tutorial = true;
    this.speed = BALL.startSpeed;
    this.game.audio.playMusic("main");

    this.particles.clear();
    this.world.position.set(0, 0);
    this.layout = nextLayout(null);
    this.createBricks(this.layout.rows);
    this.updateLives();

    setFade(this.hint, 0);
    this.fadeIn(this.hint);
    this.spawnPaddle();
  }

  exit() {
    this.particles.clear();
  }

  createBricks(rows) {
    for (const child of this.bricksLayer.removeChildren()) child.destroy();
    this.bricks = [];

    const tex = this.game.textures;
    rows.forEach((cells, row) => {
      cells.forEach((kind, col) => {
        if (kind === null) return;
        const hard = kind === "hard";
        const sprite = new Sprite(hard ? tex.hardBrick : tex.bricks[kind]);
        sprite.anchor.set(0.5);
        sprite.scale.set(2);
        const x = FIELD.left + col * BRICK.width;
        const y = FIELD.top + (BRICK.offsetRows + row) * BRICK.height;
        sprite.position.set(x + BRICK.width / 2, y + BRICK.height / 2);
        this.bricksLayer.addChild(sprite);
        this.bricks.push({ sprite, x, y, hp: hard ? 2 : 1 });
      });
    });
  }

  // Кирпичи появляются ряд за рядом сверху вниз
  async revealBricks() {
    const height = Math.max(...this.bricks.map((b) => b.y)) - FIELD.top;
    for (const { sprite } of this.bricks) sprite.visible = false;
    await this.scheduler.tween(600, (t) => {
      const edge = FIELD.top + t * height;
      for (const brick of this.bricks) brick.sprite.visible = brick.y <= edge;
    });
  }

  // Запасные жизни — маленькие платформы в углу поля
  updateLives() {
    for (const child of this.livesLayer.removeChildren()) child.destroy();
    for (let i = 0; i < this.lives - 1; i++) {
      const icon = new Sprite(this.game.textures.paddle);
      icon.position.set(FIELD.left + 8 + i * 56, FIELD.bottom - 16);
      this.livesLayer.addChild(icon);
    }
  }

  // Платформа "материализуется": растёт по ширине и мерцает
  async spawnPaddle() {
    this.state = "spawning";
    this.paddle.x = (FIELD.left + FIELD.right) / 2;
    this.paddle.y = PADDLE.y;
    this.paddle.visible = true;
    this.ball.visible = false;
    this.hideTrail();
    this.game.audio.sfx("spawn");

    await this.scheduler.tween(500, (t) => {
      const step = Math.ceil(t * 6) / 6;
      this.paddle.scale.x = PADDLE.scale * step;
      this.paddle.visible = t >= 1 || Math.floor(t * 12) % 2 === 0;
    });

    this.speed = BALL.startSpeed;
    this.ball.visible = true;
    this.state = "serve";
    this.stickBall();
  }

  stickBall() {
    this.ball.x = this.paddle.x + BALL.stickOffset;
    this.ball.y = this.paddleTop() - BALL.radius;
  }

  paddleTop() {
    return this.paddle.y - this.paddle.height / 2;
  }

  // Мяч летит в сторону нажатой стрелки (вверх — вправо, как в оригинале)
  launch(code) {
    if (this.state !== "serve") return;
    this.state = "play";
    const side = code === "ArrowLeft" ? -1 : 1;
    this.vx = side * this.speed * Math.sin(30 * DEG);
    this.vy = -this.speed * Math.cos(30 * DEG);
    this.game.audio.sfx("launch");

    if (this.tutorial) {
      this.tutorial = false;
      this.fadeOut(this.hint);
    }
  }

  update(delta, ms) {
    if (this.state === "serve" || this.state === "play") this.movePaddle(delta);
    if (this.state === "serve") this.stickBall();
    if (this.state === "play") this.moveBall(delta);

    this.updateTrail();
    this.particles.update(delta);

    if (this.shakeTime > 0) {
      this.shakeTime -= ms;
      const power = this.shakeTime > 0 ? 4 : 0;
      this.world.position.set(
        Math.round((Math.random() - 0.5) * power) * 2,
        Math.round((Math.random() - 0.5) * power) * 2,
      );
    }
  }

  movePaddle(delta) {
    const input = this.game.input;
    const dir =
      (input.isDown(RIGHT_KEYS) ? 1 : 0) - (input.isDown(LEFT_KEYS) ? 1 : 0);

    this.paddle.x += dir * PADDLE.speed * delta;

    const half = this.paddle.width / 2;
    this.paddle.x = Math.max(
      FIELD.left + half,
      Math.min(FIELD.right - half, this.paddle.x),
    );
  }

  moveBall(delta) {
    const r = BALL.radius;
    // Двигаем мяч мелкими шагами, чтобы он не проскакивал сквозь кирпичи
    const steps = Math.max(1, Math.ceil((this.speed * delta) / 4));

    for (let s = 0; s < steps; s++) {
      const prevX = this.ball.x;
      const prevY = this.ball.y;
      this.ball.x += (this.vx * delta) / steps;
      this.ball.y += (this.vy * delta) / steps;

      // Стенки
      if (this.ball.x - r < FIELD.left) {
        this.ball.x = FIELD.left + r;
        this.vx = Math.abs(this.vx);
        this.game.audio.sfx("wall");
      } else if (this.ball.x + r > FIELD.right) {
        this.ball.x = FIELD.right - r;
        this.vx = -Math.abs(this.vx);
        this.game.audio.sfx("wall");
      }
      if (this.ball.y - r < FIELD.top) {
        this.ball.y = FIELD.top + r;
        this.vy = Math.abs(this.vy);
        this.game.audio.sfx("wall");
      }

      // Платформа: угол отскока зависит от точки удара
      const top = this.paddleTop();
      const half = this.paddle.width / 2;
      if (
        this.vy > 0 &&
        this.ball.y + r >= top &&
        prevY + r <= top + 6 &&
        Math.abs(this.ball.x - this.paddle.x) <= half + r
      ) {
        const hit = Math.max(
          -1,
          Math.min(1, (this.ball.x - this.paddle.x) / (half + r)),
        );
        const side = hit === 0 ? Math.sign(this.vx) || 1 : Math.sign(hit);
        const angle = side * (15 + Math.abs(hit) * 50) * DEG;
        this.setSpeed(this.speed + BALL.paddleStep, angle);
        this.ball.y = top - r;
        this.game.audio.sfx("paddle");
        this.squashPaddle();
        break;
      }

      // Кирпичи
      let flipX = false;
      let flipY = false;
      for (let i = this.bricks.length - 1; i >= 0; i--) {
        const brick = this.bricks[i];
        if (
          this.ball.x + r <= brick.x ||
          this.ball.x - r >= brick.x + BRICK.width ||
          this.ball.y + r <= brick.y ||
          this.ball.y - r >= brick.y + BRICK.height
        ) {
          continue;
        }
        // С какой стороны пришёл мяч
        if (prevX + r <= brick.x || prevX - r >= brick.x + BRICK.width)
          flipX = true;
        else flipY = true;
        this.hitBrick(brick, i);
      }
      if (flipX) {
        this.vx = -this.vx;
        this.ball.x = prevX;
      }
      if (flipY) {
        this.vy = -this.vy;
        this.ball.y = prevY;
      }
      if (flipX || flipY) {
        this.setSpeed(this.speed + BALL.brickStep);
        if (this.bricks.length === 0) {
          this.nextRound();
          return;
        }
      }

      if (this.ball.y - r > FIELD.bottom) {
        this.loseBall();
        return;
      }
    }
  }

  // Меняет скорость, сохраняя направление (или задаёт новый угол от вертикали вверх)
  setSpeed(speed, angle) {
    this.speed = Math.min(BALL.maxSpeed, speed);
    if (angle === undefined) {
      const k = this.speed / Math.hypot(this.vx, this.vy);
      this.vx *= k;
      this.vy *= k;
    } else {
      this.vx = this.speed * Math.sin(angle);
      this.vy = -this.speed * Math.cos(angle);
    }
  }

  squashPaddle() {
    this.scheduler.tween(120, (t) => {
      this.paddle.scale.y = t < 1 ? PADDLE.scale * 0.75 : PADDLE.scale;
    });
  }

  hitBrick(brick, index) {
    const tex = this.game.textures;
    brick.hp--;

    if (brick.hp > 0) {
      // Прочный кирпич: вспышка и трещина
      this.game.audio.sfx("hard");
      brick.sprite.texture = tex.brickFlash;
      this.scheduler
        .wait(80)
        .then(() => (brick.sprite.texture = tex.hardBrickCracked));
      return;
    }

    this.bricks.splice(index, 1);
    this.game.audio.sfx("brick");
    const { sprite } = brick;
    sprite.texture = tex.brickFlash;
    this.particles.burst(sprite.x, sprite.y, 10, {
      speed: 2.5,
      size: 4,
      spreadX: BRICK.width,
      spreadY: BRICK.height,
      life: 30,
    });
    this.scheduler
      .tween(160, (t) => {
        const step = 1 - Math.floor(t * 4) / 4;
        sprite.scale.set(2 * step, 2 * step);
      })
      .then(() => sprite.destroy());
  }

  updateTrail() {
    if (this.state !== "play") {
      this.hideTrail();
      return;
    }
    this.trailHistory.unshift({ x: this.ball.x, y: this.ball.y });
    this.trailHistory.length = Math.min(
      this.trailHistory.length,
      this.trail.length * 2 + 1,
    );
    this.trail.forEach((sprite, i) => {
      const point = this.trailHistory[(i + 1) * 2];
      sprite.visible = Boolean(point);
      if (point)
        sprite.position.set(
          Math.round(point.x / 2) * 2,
          Math.round(point.y / 2) * 2,
        );
    });
  }

  hideTrail() {
    this.trailHistory.length = 0;
    for (const sprite of this.trail) sprite.visible = false;
  }

  // Мяч упал: платформа взрывается, экран трясётся
  async loseBall() {
    this.state = "dying";
    this.ball.visible = false;
    this.paddle.visible = false;
    this.shakeTime = 350;
    this.game.audio.sfx("lose");
    this.particles.burst(this.paddle.x, this.paddle.y, 40, {
      speed: 5,
      size: 4,
      spreadX: this.paddle.width,
      spreadY: this.paddle.height,
      life: 60,
    });

    await this.scheduler.wait(1500);
    this.lives--;
    this.updateLives();

    if (this.lives <= 0) {
      this.state = "ended";
      this.game.switchTo("gameOver");
    } else {
      this.spawnPaddle();
    }
  }

  // Все кирпичи разбиты: раунд начинается заново с другой раскладкой, жизни сохраняются
  async nextRound() {
    this.state = "clearing";
    this.ball.visible = false;
    this.paddle.visible = false;
    this.particles.burst(this.ball.x, this.ball.y, 20, { speed: 3, life: 40 });
    this.particles.burst(this.paddle.x, this.paddle.y, 30, {
      speed: 4,
      spreadX: this.paddle.width,
      life: 50,
    });
    this.game.audio.sfx("start");
    await this.scheduler.wait(1200);

    this.layout = nextLayout(this.layout.name);
    this.createBricks(this.layout.rows);
    await this.revealBricks();
    this.spawnPaddle();
  }

  onKeyDown(code) {
    if (LAUNCH_KEYS.includes(code)) this.launch(code);
  }
}
