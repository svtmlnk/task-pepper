import { Container } from "pixi.js";
import { Scene } from "./Scene.js";
import { PALETTE, SCREEN } from "../config.js";
import { pixelText, setFade } from "../fx.js";

// ЭКРАН GAME OVER
// Надпись остаётся на экране, пока игрок не нажмёт Enter
export class GameOverScene extends Scene {
  constructor(game) {
    super(game);

    this.title = pixelText("GAME OVER", 32, PALETTE.lime);
    this.title.position.set(SCREEN.width / 2, SCREEN.height / 2);
    this.shadow = pixelText("GAME OVER", 32, PALETTE.moss);
    this.shadow.position.set(SCREEN.width / 2 + 4, SCREEN.height / 2 + 4);
    this.titleGroup = new Container();
    this.titleGroup.addChild(this.shadow, this.title);

    this.container.addChild(this.titleGroup);
  }

  enter() {
    this.game.audio.playMusic("gameover");
    setFade(this.titleGroup, 0);
    this.fadeIn(this.titleGroup);
  }

  onKeyDown(code) {
    if (code === "Enter" || code === "NumpadEnter") this.game.switchTo("menu");
  }
}
