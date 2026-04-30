document.addEventListener('DOMContentLoaded', () => {

    // --- 1. АНИМАЦИЯ ПОЯВЛЕНИЯ (SCROLL REVEAL) ---
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach(el => observer.observe(el));


    // --- 2. МОБИЛЬНОЕ МЕНЮ ---
    const navModal = document.getElementById('navModal');
    const openNavBtn = document.getElementById('openNavBtn');
    const closeNavBtn = document.querySelector('.close-nav');

    if (openNavBtn) {
        openNavBtn.onclick = () => {
            navModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };
    }

    const closeNav = () => {
        if (navModal) {
            navModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    if (closeNavBtn) closeNavBtn.onclick = closeNav;
    window.addEventListener('click', (e) => { if (e.target === navModal) closeNav(); });


    // --- 3. ОТПРАВКА ФОРМЫ (EMAILJS) ---
    const feedbackForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    if (feedbackForm && submitBtn) {
        feedbackForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitBtn.innerText = 'Отправка...';
            submitBtn.disabled = true;
            emailjs.sendForm('service_ect7ckl', 'template_fyhfgd9', this)
                .then(() => {
                    submitBtn.innerText = 'Отправлено!';
                    alert('Сообщение успешно отправлено.');
                    feedbackForm.reset();
                }, (err) => {
                    alert('Ошибка: ' + JSON.stringify(err));
                    submitBtn.disabled = false;
                });
        });
    }


    // --- 4. МУЗЫКА ---
    const musicBtn = document.getElementById('musicToggle');
    const audio = document.getElementById('bgMusic');
    if (musicBtn && audio) {
        musicBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => musicBtn.innerText = '⏸ Пауза');
            } else {
                audio.pause();
                musicBtn.innerText = '🎵 Музыка';
            }
        });
    }


    // --- 5. ЛОГИКА ИГРЫ ПАЗЛЫ ---
    const config = [
        { id: 'game1', img: 'img/SlavicBazaar.webp' },
        { id: 'game2', img: 'img/Pazle2.webp' }
    ];

    // Скрываем второй пазл изначально
    const secondGame = document.getElementById('game2');
    if (secondGame) {
        secondGame.style.display = 'none';
        secondGame.style.opacity = '0';
        secondGame.style.transition = 'opacity 0.8s ease-in-out'; // Плавное проявление
    }

    function initGame(setup) {
        const container = document.getElementById(setup.id);
        if (!container) return;
        const board = container.querySelector('.puzzle-board');
        const bank = container.querySelector('.pieces-bank');

        for (let i = 0; i < 9; i++) {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.dataset.index = i;
            zone.addEventListener('dragover', e => e.preventDefault());
            zone.addEventListener('drop', e => handleDrop(e, zone, setup.id));
            board.appendChild(zone);
        }

        let pieces = [];
        for (let i = 0; i < 9; i++) {
            const p = document.createElement('div');
            p.className = 'puzzle-piece';
            p.id = `${setup.id}-piece-${i}`;
            p.draggable = true;
            p.style.backgroundImage = `url('${setup.img}')`;
            p.style.backgroundPosition = `-${(i % 3) * 100}px -${Math.floor(i / 3) * 100}px`;
            p.addEventListener('dragstart', e => e.dataTransfer.setData('text', e.target.id));
            pieces.push(p);
        }
        pieces.sort(() => Math.random() - 0.5);
        pieces.forEach(p => bank.appendChild(p));
    }

    function handleDrop(e, zone, gameId) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text');
        const draggedPiece = document.getElementById(draggedId);
        if (!draggedId.startsWith(gameId)) return;

        if (zone.children.length > 0) {
            const existingPiece = zone.children[0];
            draggedPiece.parentElement.appendChild(existingPiece);
        }
        zone.appendChild(draggedPiece);
        checkWin(gameId);
    }

    function checkWin(gameId) {
        const zones = document.querySelectorAll(`#${gameId} .drop-zone`);
        let score = 0;
        zones.forEach(z => {
            if (z.children.length > 0 && z.children[0].id.split('-piece-')[1] === z.dataset.index) score++;
        });

        if (score === 9) {
            const winBanner = document.querySelector(`#${gameId} .win-banner`);
            if (winBanner) winBanner.style.display = 'block';

            // ПЛАВНЫЙ ПЕРЕХОД КО ВТОРОМУ ПАЗЛУ
            if (gameId === 'game1' && secondGame) {
                setTimeout(() => {
                    secondGame.style.display = 'flex';
                    // Небольшая задержка, чтобы браузер успел применить display: flex перед opacity
                    setTimeout(() => {
                        secondGame.style.opacity = '1';
                        secondGame.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                }, 1000); // Даем 1 секунду полюбоваться первым собранным пазлом
            }
        }
    }

    config.forEach(initGame);
});
