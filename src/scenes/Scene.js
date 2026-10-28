import { Container } from "pixi.js";
import { Scheduler, fadeTo } from "../fx.js";

// Базовая сцена: свой контейнер и свой планировщик,
// который очищается при уходе со сцены (все анимации и таймеры останавливаются)
export class Scene {
  constructor(game) {
    this.game = game;
    this.container = new Container();
    this.container.visible = false;
    this.scheduler = new Scheduler();
  }

  fadeIn(obj) {
    return fadeTo(this.scheduler, obj, 1);
  }

  fadeOut(obj) {
    return fadeTo(this.scheduler, obj, 0);
  }

  // eslint-disable-next-line no-unused-vars
  enter(data) {}

  exit() {}

  // eslint-disable-next-line no-unused-vars
  update(delta, ms) {}

  // eslint-disable-next-line no-unused-vars
  onKeyDown(code) {}
}
