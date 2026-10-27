import { Application, Assets, Sprite } from "pixi.js";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    width: 640,
    height: 480,
    backgroundColor: 0x1099bb, // Цвет внутри самого канваса
    resolution: window.devicePixelRatio || 1, // Поддержка Retina-экранов
    autoDensity: true, // Корректное отображение стилей при разном DPI
  });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  // Create a bunny Sprite
  const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime;
  });
})();
