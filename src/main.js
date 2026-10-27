import { Application, Assets, Sprite } from "pixi.js";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    width: 640,
    height: 480,
    backgroundColor: 0x111111, // Цвет внутри самого канваса
    resolution: window.devicePixelRatio || 1, // Поддержка Retina-экранов
    autoDensity: true, // Корректное отображение стилей при разном DPI
  });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Load the arkanoid texture
  const texture = await Assets.load("/assets/arkanoid.png");

  // Create a arkanoid Sprite
  const arkanoid = new Sprite(texture);

  // Center the sprite's anchor point
  arkanoid.anchor.set(0.5);
  arkanoid.scale.set(0.5);

  // Move the sprite to the center of the screen
  // arkanoid.position.set(app.screen.width / 2, app.screen.height / 2);
  arkanoid.position.set(app.screen.width / 2, 400);

  // Add the arkanoid to the stage
  app.stage.addChild(arkanoid);
})();
