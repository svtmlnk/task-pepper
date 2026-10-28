import { Scene } from "./Scene.js";
import { PALETTE, SCREEN } from "../config.js";
import { Starfield, pixelText, setFade } from "../fx.js";

const STORY =
  "By order of the space fleet commander, a team of scientists created " +
  "a virtual environment to train the crew in detecting and exploring " +
  "distorted spaces, as well as in combating DOH, should it ever return.\n\n" +
  "In the simulation, the ship endlessly destroys any hostile objects " +
  "it encounters along its path.\n\n" +
  "Each session serves as a new challenge, designed to prepare the crew " +
  "for the real threat.";

// СЮЖЕТ: показывается между главным меню и игрой
export class StoryScene extends Scene {
  constructor(game) {
    super(game);

    this.stars = new Starfield(this.container);

    this.story = pixelText(STORY, 8, PALETTE.lime);
    this.story.style.align = "left";
    this.story.style.lineHeight = 16;
    this.story.style.wordWrap = true;
    this.story.style.wordWrapWidth = 512;
    this.story.position.set(SCREEN.width / 2, SCREEN.height / 2 - 16);

    this.prompt = pixelText("PRESS ENTER", 8, PALETTE.forest);
    this.prompt.position.set(SCREEN.width / 2, 432);

    this.container.addChild(this.story, this.prompt);
  }

  enter() {
    this.game.audio.playMusic("main");
    setFade(this.story, 0);
    setFade(this.prompt, 0);
    this.fadeIn(this.story);
    this.blinkPrompt();
  }

  // Подсказка появляется после текста и плавно мигает
  async blinkPrompt() {
    await this.scheduler.wait(3000);
    for (;;) {
      await this.fadeIn(this.prompt);
      await this.scheduler.wait(1000);
      await this.fadeOut(this.prompt);
    }
  }

  update(delta) {
    this.stars.update(delta);
  }

  onKeyDown(code) {
    if (code === "Enter" || code === "NumpadEnter") {
      this.game.audio.sfx("start");
      this.game.switchTo("game");
    }
  }
}
