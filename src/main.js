import { Application, Assets, Sprite, Rectangle, Container, Text, TextStyle } from "pixi.js";

(async () => {
  // Инициализация PixiJS
  const app = new Application();
  await app.init({
    width: 640,
    height: 480,
    backgroundColor: 0x050505,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Загрузка спрайтов
  const arkanoid_texture = await Assets.load("/assets/arkanoid.png");
  const ball_texture = await Assets.load("/assets/ball.png");
  const brick_texture = await Assets.load("/assets/block.png");

  // Общие стили для текста
  const textStyle = new TextStyle({
    fontFamily: "Pixelify Sans",
    fontSize: 24,
    fill: 0x58f707,
    align: "center",
    letterSpacing: 3
  });

  // Глобальные ссылки на экраны
  let mainMenuScene;
  let gameScene;
  let gameOverScene;
  let currentScene = null;

  // переменные для механик
  const bricks = [];
  const rows = 4;
  const cols = 8;
  const brickWidth = 60;
  const brickHeight = 20;
  const brickPadding = 10;
  const offsetTop = 60;
  const totalGridWidth = cols * brickWidth + (cols - 1) * brickPadding;
  const offsetLeft = (app.screen.width - totalGridWidth) / 2;

  let arkanoid, ball;
  let ballDx = 4;
  let ballDy = -4;
  let isBallLaunched = false;
  const keys = { ArrowLeft: false, ArrowRight: false };
  const paddleSpeed = 6;

  // ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ СЦЕН 
  function switchScene(newScene) {
    // Скрываем текущую сцену, если она есть
    if (currentScene) {
      currentScene.visible = false;
    }
    // Показываем новую сцену
    currentScene = newScene;
    currentScene.visible = true;
  }

  // ЭКРАН ГЛАВНОГО МЕНЮ
  function createMainMenu() {
    mainMenuScene = new Container();
    mainMenuScene.visible = false;
    app.stage.addChild(mainMenuScene);

    const startText = new Text({ text: "PRESS  ENTER", style: textStyle });
    startText.anchor.set(0.5);
    startText.position.set(app.screen.width / 2, app.screen.height / 2);
    mainMenuScene.addChild(startText);

    // Интерактивность для клика по экрану меню
    mainMenuScene.eventMode = "static";
    mainMenuScene.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
    mainMenuScene.on("pointerdown", () => {
      startNewGame(); // При клике запускаем игру
    });
  }

  // ИГРОВОЙ ЭКРАН
  function createGameScene() {
    gameScene = new Container();
    gameScene.visible = false;
    app.stage.addChild(gameScene);

    // Создаем платформу внутри игрового контейнера
    arkanoid = new Sprite(arkanoid_texture);
    arkanoid.anchor.set(0.5);
    arkanoid.scale.set(0.7);
    arkanoid.position.set(app.screen.width / 2, 400);
    gameScene.addChild(arkanoid);

    // Создаем мяч внутри игрового контейнера
    ball = new Sprite(ball_texture);
    ball.anchor.set(0.5);
    ball.width = 15;
    ball.height = 15;
    gameScene.addChild(ball);

    // Однократная подписка на управление клавиатурой
    window.addEventListener("keydown", (e) => {
      if (currentScene !== gameScene) return; // Игнорируем кнопки, если мы не в игре
      if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault();
        if (!isBallLaunched) isBallLaunched = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.key in keys) keys[e.key] = false;
    });
  }

  // Вспомогательные функции для игровой механики
  function createBricks() {
    for (let i = 0; i < bricks.length; i++) gameScene.removeChild(bricks[i]);
    bricks.length = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const brick = new Sprite(brick_texture);
        brick.width = brickWidth;
        brick.height = brickHeight;
        brick.x = offsetLeft + c * (brickWidth + brickPadding);
        brick.y = offsetTop + r * (brickHeight + brickPadding);
        const colors = [0x274e13, 0x257804, 0x27c009, 0x58f707];
        brick.tint = colors[r % colors.length];

        gameScene.addChild(brick); // Важно: добавляем именно в gameScene!
        bricks.push(brick);
      }
    }
  }

  function updateBallAttachedPosition() {
    ball.x = arkanoid.x;
    ball.y = arkanoid.y - arkanoid.height / 2 - ball.height / 2;
  }

  function startNewGame() {
    arkanoid.x = app.screen.width / 2;
    isBallLaunched = false;
    ballDx = Math.random() > 0.5 ? 4 : -4;
    ballDy = -5;
    
    createBricks();
    updateBallAttachedPosition();
    
    switchScene(gameScene); // Переключаемся на игровой экран
  }

  function checkCollision(obj1, obj2) {
    const bounds1 = obj1.getBounds();
    const bounds2 = obj2.getBounds();
    return (
      bounds1.x < bounds2.x + bounds2.width &&
      bounds1.x + bounds1.width > bounds2.x &&
      bounds1.y < bounds2.y + bounds2.height &&
      bounds1.y + bounds1.height > bounds2.y
    );
  }

  // ЭКРАН GAME OVER
  function createGameOverScene() {
    gameOverScene = new Container();
    gameOverScene.visible = false;
    app.stage.addChild(gameOverScene);

    const gameOverText = new Text({ text: "GAME  OVER", style: { ...textStyle, fontSize: 36, fill: 0xde3249 } });
    gameOverText.anchor.set(0.5);
    gameOverText.position.set(app.screen.width / 2, app.screen.height / 2);
    gameOverScene.addChild(gameOverText);

    gameOverScene.eventMode = "static";
    gameOverScene.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
    gameOverScene.on("pointerdown", () => {
      switchScene(mainMenuScene);
    });
  }

  // ИНИЦИАЛИЗАЦИЯ И СТАРТ
  createMainMenu();
  createGameScene();
  createGameOverScene();

  // При запуске приложения показываем главное меню
  switchScene(mainMenuScene);

  // ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
  app.ticker.add((time) => {
    // Если сейчас активен не игровой экран — физику игры не обсчитываем!
    if (currentScene !== gameScene) return;

    // Движение платформы
    const paddleHalfWidth = arkanoid.width / 2;
    if (keys.ArrowLeft) {
      arkanoid.x -= paddleSpeed * time.deltaTime;
      if (arkanoid.x < paddleHalfWidth) arkanoid.x = paddleHalfWidth;
    }
    if (keys.ArrowRight) {
      arkanoid.x += paddleSpeed * time.deltaTime;
      if (arkanoid.x > app.screen.width - paddleHalfWidth) arkanoid.x = app.screen.width - paddleHalfWidth;
    }

    // Логика мяча
    if (!isBallLaunched) {
      updateBallAttachedPosition();
    } else {
      ball.x += ballDx * time.deltaTime;
      ball.y += ballDy * time.deltaTime;

      const ballRadius = ball.width / 2;

      // Отскок от стен
      if (ball.x - ballRadius < 0) { ball.x = ballRadius; ballDx = -ballDx; }
      else if (ball.x + ballRadius > app.screen.width) { ball.x = app.screen.width - ballRadius; ballDx = -ballDx; }

      if (ball.y - ballRadius < 0) { ball.y = ballRadius; ballDy = -ballDy; }

      // ТРИГГЕР ПРОИГРЫША: Переключение на экран Game Over
      if (ball.y - ballRadius > app.screen.height) {
        switchScene(gameOverScene); // Вместо alert() просто включаем нужную сцену
        return;
      }

      // Отскок от платформы
      if (checkCollision(ball, arkanoid)) {
        ballDy = -Math.abs(ballDy);
        const hitPoint = ball.x - arkanoid.x;
        ballDx = hitPoint * 0.15;
      }

      // Столкновение с кирпичами
      for (let i = bricks.length - 1; i >= 0; i--) {
        const brick = bricks[i];
        if (checkCollision(ball, brick)) {
          ballDy = -ballDy;
          gameScene.removeChild(brick);
          bricks.splice(i, 1);
          break;
        }
      }

      // Условие победы (можно сделать отдельный экран победы по аналогии)
      if (bricks.length === 0) {
        // Генерируем новую сетку кирпичей
        createBricks();
      }
    }
  });
})();
