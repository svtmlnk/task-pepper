import { Container, Sprite, Text, Texture } from "pixi.js";
import {
  FADE_LEVELS,
  FONT,
  PALETTE,
  SCREEN,
  SHADES,
  TEXT_FADE_STEP,
} from "./config.js";

// ЗВЁЗДНЫЙ ФОН: пиксельные звёзды разной яркости летят вниз с разной скоростью
export class Starfield {
  constructor(parent, count = 70) {
    this.container = new Container();
    parent.addChild(this.container);
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const depth = Math.floor(Math.random() * 3);
      const star = new Sprite(Texture.WHITE);
      star.width = star.height = depth === 2 ? 4 : 2;
      star.tint = SHADES[depth];
      star.position.set(
        Math.floor(Math.random() * 320) * 2,
        Math.random() * SCREEN.height,
      );
      this.container.addChild(star);
      this.stars.push({ sprite: star, speed: 0.3 + depth * 0.5 });
    }
  }

  update(delta) {
    for (const { sprite, speed } of this.stars) {
      sprite.y += speed * delta;
      if (sprite.y > SCREEN.height) sprite.y = -4;
    }
  }
}

// Планировщик задач: таймеры и анимации, привязанные к игровому тикеру.
// Каждая задача — объект с update(ms), который возвращает true, когда закончил.
export class Scheduler {
  constructor() {
    this.tasks = new Set();
  }

  add(task) {
    this.tasks.add(task);
    return task;
  }

  cancel(task) {
    this.tasks.delete(task);
  }

  clear() {
    this.tasks.clear();
  }

  update(ms) {
    for (const task of [...this.tasks]) {
      if (this.tasks.has(task) && task.update(ms) === true)
        this.tasks.delete(task);
    }
  }

  wait(ms) {
    return new Promise((resolve) => {
      let time = 0;
      this.add({
        update: (dt) => {
          time += dt;
          if (time < ms) return false;
          resolve();
          return true;
        },
      });
    });
  }

  // onUpdate получает прогресс от 0 до 1
  tween(ms, onUpdate) {
    return new Promise((resolve) => {
      let time = 0;
      this.add({
        update: (dt) => {
          time = Math.min(ms, time + dt);
          onUpdate(time / ms);
          if (time < ms) return false;
          resolve();
          return true;
        },
      });
    });
  }
}

// ПЛАВНОЕ ПОЯВЛЕНИЕ ТЕКСТА
// Скорость постоянная: 50% прозрачности за TEXT_FADE_STEP мс,
// а сама прозрачность меняется ступеньками, как яркость на 16-битных консолях.
const fadeState = new WeakMap();

export function setFade(obj, value) {
  const state = fadeState.get(obj);
  if (state?.task) state.scheduler.cancel(state.task);
  fadeState.set(obj, { raw: value });
  obj.alpha = value;
}

export function fadeTo(scheduler, obj, target) {
  const state = fadeState.get(obj) ?? { raw: obj.alpha };
  // Прерванная анимация просто останавливается, её промис больше не завершится
  if (state.task) state.scheduler.cancel(state.task);

  const rate = 0.5 / TEXT_FADE_STEP;
  return new Promise((resolve) => {
    state.scheduler = scheduler;
    state.task = scheduler.add({
      update: (ms) => {
        state.raw =
          target > state.raw
            ? Math.min(target, state.raw + rate * ms)
            : Math.max(target, state.raw - rate * ms);
        obj.alpha = Math.round(state.raw * FADE_LEVELS) / FADE_LEVELS;
        if (state.raw !== target) return false;
        state.task = null;
        resolve();
        return true;
      },
    });
    fadeState.set(obj, state);
  });
}

export function pixelText(text, size, color = PALETTE.lime) {
  const label = new Text({
    text,
    style: {
      fontFamily: FONT,
      fontSize: size,
      fill: color,
      align: "center",
      lineHeight: size * 2,
    },
  });
  label.anchor.set(0.5);
  label.roundPixels = true;
  return label;
}

// ЧАСТИЦЫ: квадратные "пиксели", которые темнеют по палитре по мере угасания
const PARTICLE_RAMP = [
  PALETTE.lime,
  PALETTE.green,
  PALETTE.forest,
  PALETTE.moss,
];

export class Particles {
  constructor(parent) {
    this.container = new Container();
    parent.addChild(this.container);
    this.items = [];
  }

  burst(
    x,
    y,
    count,
    {
      speed = 3,
      size = 4,
      gravity = 0.15,
      life = 40,
      spreadX = 0,
      spreadY = 0,
    } = {},
  ) {
    for (let i = 0; i < count; i++) {
      const sprite = new Sprite(Texture.WHITE);
      sprite.width = size;
      sprite.height = size;
      sprite.anchor.set(0.5);
      sprite.tint = PARTICLE_RAMP[0];
      this.container.addChild(sprite);

      const angle = Math.random() * Math.PI * 2;
      const power = speed * (0.4 + Math.random() * 0.6);
      this.items.push({
        sprite,
        x: x + (Math.random() - 0.5) * spreadX,
        y: y + (Math.random() - 0.5) * spreadY,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power - speed * 0.5,
        gravity,
        life: life * (0.6 + Math.random() * 0.4),
        age: 0,
      });
    }
  }

  update(delta) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.age += delta;
      if (p.age >= p.life) {
        p.sprite.destroy();
        this.items.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      // Привязка к сетке пиксель-арта
      p.sprite.position.set(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2);
      p.sprite.tint =
        PARTICLE_RAMP[Math.floor((p.age / p.life) * PARTICLE_RAMP.length)];
    }
  }

  clear() {
    for (const p of this.items) p.sprite.destroy();
    this.items.length = 0;
  }
}
