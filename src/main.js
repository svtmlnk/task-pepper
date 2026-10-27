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

  // --- Игровые параметры
  const bricks = [];
  const rows = 4;
  const cols = 8;
  const brickWidth = 60;
  const brickHeight = 20;
  const brickPadding = 10;
  const offsetTop = 60;

  // Рассчитываем отступ слева, чтобы сетка кирпичей была по центру экрана
  const totalGridWidth = cols * brickWidth + (cols - 1) * brickPadding;
  const offsetLeft = (app.screen.width - totalGridWidth) / 2;

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Создание игрока-арканоида
  const arkanoid_texture = await Assets.load("/assets/arkanoid.png");

  const arkanoid = new Sprite(arkanoid_texture);

  arkanoid.anchor.set(0.5);
  arkanoid.scale.set(0.7);

  // arkanoid.position.set(app.screen.width / 2, app.screen.height / 2);
  arkanoid.position.set(app.screen.width / 2, 400);

  app.stage.addChild(arkanoid);

  // Создание мяча
  const ball_texture = await Assets.load("/assets/ball.png");
  const ball = new Sprite(ball_texture);
  ball.anchor.set(0.5);
  ball.width = 15;
  ball.height = 15;

  // Скорость мяча по осям X и Y
  let ballDx = 4;
  let ballDy = -4;

  // Флаг для мяча, запущен ли мяч в движение
  let isBallLaunched = false;

  app.stage.addChild(ball);

  // Создание сеток из кирпичей
  const brick_texture = await Assets.load("/assets/block.png");

  function createBricks() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const brick = new Sprite(brick_texture);
        brick.width = brickWidth;
        brick.height = brickHeight;

        // Размещаем кирпичи по сетке
        brick.x = offsetLeft + c * (brickWidth + brickPadding);
        brick.y = offsetTop + r * (brickHeight + brickPadding);

        // Окрашиваем ряды кирпичей в разные цвета с помощью tint
        const colors = [0x274e13, 0x257804, 0x27c009, 0x58f707];
        brick.tint = colors[r % colors.length];

        app.stage.addChild(brick);
        bricks.push(brick);
      }
    }
  }

  function resetGame() {
    // Возвращаем платформу в центр экрана
    arkanoid.x = app.screen.width / 2;

    // Сбрасываем флаг запуска
    isBallLaunched = false;

    // Пересчитываем начальные скорости, но пока не применяем движение
    ballDx = Math.random() > 0.5 ? 4 : -4;
    ballDy = -5;

    // Фиксируем мяч ровно над платформой
    updateBallAttachedPosition();
  }

  // Обновление позиции мяча, пока он привязан к платформе
  function updateBallAttachedPosition() {
    ball.x = arkanoid.x;
    // Сдвигаем мяч вверх на половину высоты платформы + половину высоты мяча
    ball.y = arkanoid.y - arkanoid.height / 2 - ball.height / 2;
  }

  // Сразу создаем кирпичи и ставим мяч на исходную
  createBricks();
  resetGame();

  // --- Управление клавиатурой
  const keys = { ArrowLeft: false, ArrowRight: false };
  const paddleSpeed = 6; // Скорость перемещения платформы

  window.addEventListener("keydown", (e) => {
    if (e.key in keys) {
      keys[e.key] = true;
      e.preventDefault(); // Запрещаем прокрутку страницы стрелками

      // Если нажата любая стрелка влево/вправо и игра еще не запущена — запускаем!
      if (!isBallLaunched) {
        isBallLaunched = true;
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key in keys) {
      keys[e.key] = false;
    }
  });

  // --- Функция проверки столкновений
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

  // --- Игровой цикл
  app.ticker.add((time) => {
    // Движение платформы кнопками с учетом deltaTime
    const paddleHalfWidth = arkanoid.width / 2;
    if (keys.ArrowLeft) {
      arkanoid.x -= paddleSpeed * time.deltaTime;
      // Ограничение левой границы
      if (arkanoid.x < paddleHalfWidth) arkanoid.x = paddleHalfWidth;
    }
    if (keys.ArrowRight) {
      arkanoid.x += paddleSpeed * time.deltaTime;
      // Ограничение правой границы
      if (arkanoid.x > app.screen.width - paddleHalfWidth) arkanoid.x = app.screen.width - paddleHalfWidth;
    }

    // Логика мяча (запущен или удерживается)
    if (!isBallLaunched) {
      // Если мяч еще не запущен, он послушно двигается вместе с платформой
      updateBallAttachedPosition();
    } else {
      // Если игра активна — запускаем физику движения мяча
      ball.x += ballDx * time.deltaTime;
      ball.y += ballDy * time.deltaTime;

      const ballRadius = ball.width / 2;

      // Отскок от боковых стен
      if (ball.x - ballRadius < 0) {
        ball.x = ballRadius;
        ballDx = -ballDx;
      } else if (ball.x + ballRadius > app.screen.width) {
        ball.x = app.screen.width - ballRadius;
        ballDx = -ballDx;
      }

      // Отскок от верхней стены
      if (ball.y - ballRadius < 0) {
        ball.y = ballRadius;
        ballDy = -ballDy;
      }

      // Проигрыш при падении вниз
      if (ball.y - ballRadius > app.screen.height) {
        alert("Игра окончена!");
        resetGame();
      }

      // Столкновение мяча с платформой игрока
      if (checkCollision(ball, arkanoid)) {
        ballDy = -Math.abs(ballDy); // Отбиваем строго вверх

        // Корректируем угол отскока в зависимости от точки удара о платформу
        const hitPoint = ball.x - arkanoid.x;
        ballDx = hitPoint * 0.15;
      }

      // Столкновение с кирпичами
      for (let i = bricks.length - 1; i >= 0; i--) {
        const brick = bricks[i];
        if (checkCollision(ball, brick)) {
          ballDy = -ballDy;

          app.stage.removeChild(brick);
          bricks.splice(i, 1);
          break;
        }
      }

      // Условие победы
      if (bricks.length === 0) {
        alert("Вы победили!");
        createBricks();
        resetGame();
      }
    }
  });
})();
