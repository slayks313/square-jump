const mainMenu = document.getElementById('main-menu');
const playButton = document.getElementById('play-button');
const gameOver = document.getElementById('game-over');
const retryButton = document.getElementById('retry-button');
const menuButton = document.getElementById('menu-button');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const totalCoinsDisplay = document.getElementById('total-coins');

// Звуковые эффекты (опционально)
const jumpSound = new Audio('jump1.mp3'); // Убедитесь, что файл существует
const collectSound = new Audio('collectSound.mp3'); // Убедитесь, что файл существует
const gameOverSound = new Audio('gameover.mp3'); // Убедитесь, что файл существует

// Добавленные звуковые дорожки
const backgroundMusic = new Audio('backgraund.mp3'); // Замените на путь к вашей спокойной музыке
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
backgroundMusic.preload = 'auto';

const stressMusic = new Audio('stress.mp3'); // Замените на путь к вашей стрессовой музыке
stressMusic.loop = true;
stressMusic.volume = 0.5;
stressMusic.preload = 'auto';

// Добавленный звуковой эффект для кнопок
const buttonClickSound = new Audio('button.mp3'); // Убедитесь, что файл существует
buttonClickSound.preload = 'auto';

// Функция для воспроизведения звука кнопки
function playButtonClickSound() {
    if (!muteToggle.checked && musicToggle.checked) { // Проверка, не отключен ли звук и включена ли музыка
        // Сбрасываем время воспроизведения, чтобы звук можно было воспроизвести снова
        buttonClickSound.currentTime = 0;
        buttonClickSound.play().catch((error) => {
            console.log('Воспроизведение звука кнопки было заблокировано:', error);
        });
    }
}

// Получаем существующие галочки по ID
const muteToggle = document.getElementById('muteToggle');
const musicToggle = document.getElementById('musicToggle');

// Размеры канваса
function resizeCanvas() {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Переключение экранов
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Начало игры
playButton.addEventListener('click', () => {
    playButtonClickSound(); // Воспроизведение звука кнопки
    startGame();
});

retryButton.addEventListener('click', () => {
    playButtonClickSound(); // Воспроизведение звука кнопки
    startGame();
});

menuButton.addEventListener('click', () => {
    playButtonClickSound(); // Воспроизведение звука кнопки
    showScreen(mainMenu);
    if (musicToggle.checked && !muteToggle.checked) {
        backgroundMusic.play().catch((error) => {
            console.log('Воспроизведение фоновой музыки было заблокировано:', error);
        });
    }
    stressMusic.pause();
});

// Объекты игры
let player, platforms, coins, keys, animationId, score, totalCoins;
const GAME_SPEED = 5; // Скорость движения платформ и монет
const MAX_PLATFORM_HEIGHT = 100; // Максимальная разница в высоте между платформами
const MIN_PLATFORM_HEIGHT = 30;  // Минимальная разница в высоте между платформами
const MIN_PLATFORM_WIDTH = 100;   // Увеличенная минимальная ширина платформы
const MAX_PLATFORM_WIDTH = 200;   // Максимальная ширина платформы
const DOUBLE_JUMP_DELAY = 300;    // Задержка для двойного прыжка в миллисекундах
let lastJumpTime = 0;              // Время последнего прыжка

function startGame() {
    showScreen(gameCanvas);
    if (musicToggle.checked && !muteToggle.checked) {
        backgroundMusic.pause();
        stressMusic.play().catch((error) => {
            console.log('Воспроизведение стрессовой музыки было заблокировано:', error);
        });
    } else {
        stressMusic.pause();
    }
    // Инициализация объектов
    player = {
        x: 50,
        y: gameCanvas.height - 150,
        size: 30, // Размер игрока
        dy: 0,
        gravity: 0.5,
        jumpStrength: -10,
        onGround: false,
        color: 'red',
        jumpCount: 0 // Счетчик прыжков для двойного прыжка
    };

    platforms = [];
    coins = [];
    score = 0;
    keys = {};

    // Создание увеличенной начальной платформы
    platforms.push({
        x: 0,
        y: gameCanvas.height - 100,
        width: 300, // Увеличенная ширина начальной платформы
        height: 20,
        color: 'green'
    });

    // Генерация платформ
    generatePlatforms();

    // Слушатели клавиатуры
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    // Обработчик касаний для мобильных устройств
    gameCanvas.addEventListener('touchstart', handleTouch);

    // Запуск игрового цикла
    animationId = requestAnimationFrame(gameLoop);
}

function handleTouch() {
    const currentTime = Date.now();
    if (player.onGround || (player.jumpCount < 2 && currentTime - lastJumpTime > DOUBLE_JUMP_DELAY)) {
        player.dy = player.jumpStrength;
        player.onGround = false;
        player.jumpCount += 1;
        lastJumpTime = currentTime;
        if (!muteToggle.checked) {
            jumpSound.play();
        }
    }
}

function gameOverFunc() {
    if (!muteToggle.checked) {
        gameOverSound.play();
    }
    stressMusic.pause();
    cancelAnimationFrame(animationId);
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    gameCanvas.removeEventListener('touchstart', handleTouch);
    // Обновим финальный счет
    const bestScore = localStorage.getItem('bestScore') || 0;
    if (score > bestScore) {
        localStorage.setItem('bestScore', score);
        document.getElementById('final-score').textContent = `Счет: ${score} (Новый рекорд!)`;
    } else {
        document.getElementById('final-score').textContent = `Счет: ${score} (Лучший: ${bestScore})`;
    }
    // Обновим общее количество монет
    totalCoins = parseInt(localStorage.getItem('totalCoins') || '0') + Math.floor(score / 10);
    localStorage.setItem('totalCoins', totalCoins);
    showScreen(gameOver);
    updateMainMenuCoins();
}

function keyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        const currentTime = Date.now();
        if (player.onGround || (player.jumpCount < 2 && currentTime - lastJumpTime > DOUBLE_JUMP_DELAY)) {
            player.dy = player.jumpStrength;
            player.onGround = false;
            player.jumpCount += 1;
            lastJumpTime = currentTime;
            if (!muteToggle.checked) {
                jumpSound.play();
            }
        }
    }
}

function keyUp(e) {
    keys[e.code] = false;
}

function generatePlatforms() {
    // Генерация платформ впереди
    while (platforms.length < 10) { // Ограничим количество платформ на экране
        const lastPlatform = platforms[platforms.length - 1];
        // Динамическое масштабирование ширины платформы относительно ширины экрана
        const minWidth = Math.max(MIN_PLATFORM_WIDTH, gameCanvas.width * 0.1);
        const maxWidth = Math.min(MAX_PLATFORM_WIDTH, gameCanvas.width * 0.3);
        const width = minWidth + Math.random() * (maxWidth - minWidth); // Ширина платформы от 100 до 200 или динамически

        const gap = 100 + Math.random() * 100;
        const x = lastPlatform.x + lastPlatform.width + gap;

        // Ограничим разницу в высоте между платформами
        let yOffset = Math.random() * (MAX_PLATFORM_HEIGHT - MIN_PLATFORM_HEIGHT) + MIN_PLATFORM_HEIGHT;
        // Решим, будет платформа выше или ниже предыдущей
        yOffset = Math.random() < 0.5 ? yOffset : -yOffset;
        let y = lastPlatform.y + yOffset;

        // Ограничим y, чтобы платформа не выходила за пределы экрана
        y = Math.max(50, Math.min(y, gameCanvas.height - 50));

        platforms.push({
            x: x,
            y: y,
            width: width,
            height: 20,
            color: 'green',
            borderRadius: 10
        });

        // Случайное появление монет в центре платформы и увеличим их размер
        if (Math.random() < 0.5) {
            coins.push({
                x: x + (width / 2) - 15, // Центр платформы с учетом размера монеты (30/2=15)
                y: y - 30 - 5, // Уменьшите значение y, чтобы добавить отступ, например, 5 пикселей
                size: 30, // Увеличенный размер монеты
                collected: false,
                color: 'yellow'
            });
        }
    }
}

function updateMainMenuCoins() {
    const totalCoins = parseInt(localStorage.getItem('totalCoins') || '0');
    totalCoinsDisplay.textContent = `Всего монет: ${totalCoins}`;
}

// Обновление главного меню при загрузке страницы
window.addEventListener('load', () => {
    // Восстанавливаем состояние звука из localStorage
    const isMuted = JSON.parse(localStorage.getItem('isMuted'));
    if (isMuted) {
        muteToggle.checked = true;
        toggleMute();
    }
    // Запуск фоновой музыки на главном меню после взаимодействия пользователя
    // backgroundMusic.play(); // Удалено автозапуск
    updateMainMenuCoins();
});

// Функция игрового цикла
function gameLoop() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Обработка ввода
    if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
        const currentTime = Date.now();
        if (player.onGround || (player.jumpCount < 2 && currentTime - lastJumpTime > DOUBLE_JUMP_DELAY)) {
            player.dy = player.jumpStrength;
            player.onGround = false;
            player.jumpCount += 1;
            lastJumpTime = currentTime;
            if (!muteToggle.checked) {
                jumpSound.play();
            }
        }
    }
    

    // Обновление позиции игрока
    player.dy += player.gravity;
    player.y += player.dy;

    // Перемещение платформ и монет влево
    platforms.forEach(platform => {
        platform.x -= GAME_SPEED;
    });

    coins.forEach(coin => {
        coin.x -= GAME_SPEED;
    });

    // Проверка столкновений с платформами
    player.onGround = false;
    platforms.forEach(platform => {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.size > platform.x &&
            player.y + player.size > platform.y &&
            player.y + player.size < platform.y + platform.height &&
            player.dy >= 0
        ) {
            player.y = platform.y - player.size;
            player.dy = 0;
            player.onGround = true;
            player.jumpCount = 0; // Сброс счетчика прыжков при приземлении
        }
    });

    // Проверка падения
    if (player.y > gameCanvas.height) {
        gameOverFunc();
        return;
    }

    // Рендер игрока
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Рендер платформ
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Рендер монет и проверка сбора
    coins.forEach((coin, index) => {
        if (!coin.collected) {
            ctx.beginPath();
            ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = coin.color;
            ctx.fill();
            ctx.closePath();

            // Проверка сбора
            if (
                player.x < coin.x + coin.size &&
                player.x + player.size > coin.x &&
                player.y < coin.y + coin.size &&
                player.y + player.size > coin.y
            ) {
                coin.collected = true;
                score += 10;
                if (!muteToggle.checked) {
                    collectSound.play();
                }
                // Обновим общее количество монет
                totalCoins = parseInt(localStorage.getItem('totalCoins') || '0') + 1;
                localStorage.setItem('totalCoins', totalCoins);
                updateMainMenuCoins();
            }
        }
    });

    // Удаление пройденных платформ и монет
    platforms = platforms.filter(platform => platform.x + platform.width > 0);
    coins = coins.filter(coin => !coin.collected && coin.x + coin.size > 0);

    // Генерация новых платформ
    generatePlatforms();

    // Отображение счета
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Счет: ${score}`, 20, 40);
    

    // Продолжение игрового цикла
    animationId = requestAnimationFrame(gameLoop);
}

// Получаем элементы модального окна (если используется)
const modal = document.getElementById("myModal");
const btn = document.getElementById("openModal");
const span = document.getElementsByClassName("close")[0];

// Открываем модальное окно при нажатии на кнопку
btn.onclick = function() {
    modal.style.display = "block";
    playButtonClickSound(); // Воспроизведение звука кнопки
}

// Закрываем модальное окно при нажатии на (x)
span.onclick = function() {
    modal.style.display = "none";
    playButtonClickSound(); // Воспроизведение звука кнопки
}

// Закрываем модальное окно при нажатии вне области модального окна
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
        playButtonClickSound(); // Воспроизведение звука кнопки
    }
}

// Изначально показываем главное меню
showScreen(mainMenu);

// ===== Добавленный код для отключения звука =====

// Функция для отключения/включения звука
function toggleMute() {
    const isMuted = muteToggle.checked;
    jumpSound.muted = isMuted;
    collectSound.muted = isMuted;
    gameOverSound.muted = isMuted;
    backgroundMusic.muted = isMuted; // Отключение фоновой музыки
    stressMusic.muted = isMuted;     // Отключение стрессовой музыки
    buttonClickSound.muted = isMuted; // Отключение звука кнопок
    localStorage.setItem('isMuted', isMuted);
}

// Функция для управления фоновым звуком
function toggleMusic() {
    const isMusicEnabled = musicToggle.checked;
    if (isMusicEnabled && !muteToggle.checked) {
        backgroundMusic.play().catch((error) => {
            console.log('Воспроизведение фоновой музыки было заблокировано:', error);
        });
    } else {
        backgroundMusic.pause();
    }
    localStorage.setItem('isMusicEnabled', isMusicEnabled);
}

// Добавляем обработчики событий для галочек
muteToggle.addEventListener('change', () => {
    toggleMute();
    toggleMusic(); // Перезапускаем музыку в зависимости от нового состояния
});

musicToggle.addEventListener('change', () => {
    toggleMusic();
});

// Устанавливаем начальное состояние галочек при загрузке страницы
window.addEventListener('load', () => {
    const isMuted = JSON.parse(localStorage.getItem('isMuted')) || false;
    muteToggle.checked = isMuted;
    toggleMute();

    const isMusicEnabled = JSON.parse(localStorage.getItem('isMusicEnabled'));
    if (isMusicEnabled !== null) {
        musicToggle.checked = isMusicEnabled;
    } else {
        musicToggle.checked = true; // По умолчанию музыка включена
    }
    toggleMusic();
});