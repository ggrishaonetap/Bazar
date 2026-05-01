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
            if (navModal) {
                navModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
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
                    submitBtn.innerText = 'Отправить снова';
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


    // --- 5. ЛОГИКА ИГРЫ ПАЗЛЫ (АДАПТИВНАЯ) ---
    const config = [
        { id: 'game1', img: 'img/SlavicBazaar.WebP' },
        { id: 'game2', img: 'img/Pazle2.webp' }
    ];

    const secondGame = document.getElementById('game2');
    if (secondGame) {
        secondGame.style.display = 'none';
        secondGame.style.opacity = '0';
        secondGame.style.transition = 'opacity 0.8s ease-in-out';
    }

    function initGame(setup) {
        const container = document.getElementById(setup.id);
        if (!container) return;
        const board = container.querySelector('.puzzle-board');
        const bank = container.querySelector('.pieces-bank');

        // Создаем зоны для сброса
        for (let i = 0; i < 9; i++) {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.dataset.index = i;
            zone.addEventListener('dragover', e => e.preventDefault());
            zone.addEventListener('drop', e => handleDrop(e, zone, setup.id));
            board.appendChild(zone);
        }

        // Создаем кусочки пазла
        let pieces = [];
        for (let i = 0; i < 9; i++) {
            const p = document.createElement('div');
            p.className = 'puzzle-piece';
            p.id = `${setup.id}-piece-${i}`;
            p.draggable = true;
            p.style.backgroundImage = `url('${setup.img}')`;

            // АДАПТИВНОЕ ПОЗИЦИОНИРОВАНИЕ (в процентах)[cite: 8, 9]
            const xPercent = (i % 3) * 50;
            const yPercent = Math.floor(i / 3) * 50;
            p.style.backgroundPosition = `${xPercent}% ${yPercent}%`;

            p.addEventListener('dragstart', e => e.dataTransfer.setData('text', e.target.id));
            pieces.push(p);
        }

        // Перемешиваем и добавляем в банк
        pieces.sort(() => Math.random() - 0.5);
        pieces.forEach(p => bank.appendChild(p));
    }

    function handleDrop(e, zone, gameId) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text');
        const draggedPiece = document.getElementById(draggedId);

        if (!draggedId || !draggedId.startsWith(gameId)) return;

        // Если в зоне уже есть деталь, возвращаем её в банк или меняем местами
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
            if (z.children.length > 0) {
                const pieceIndex = z.children[0].id.split('-piece-')[1];
                if (pieceIndex === z.dataset.index) score++;
            }
        });

        if (score === 9) {
            const winBanner = document.querySelector(`#${gameId} .win-banner`);
            if (winBanner) winBanner.style.display = 'block';

            if (gameId === 'game1' && secondGame) {
                setTimeout(() => {
                    secondGame.style.display = 'flex';
                    setTimeout(() => {
                        secondGame.style.opacity = '1';
                        secondGame.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                }, 1000);
            }
        }
    }


    // --- 6. УВЕЛИЧЕНИЕ ФОТО ПРИ КЛИКЕ ---
    const imageModal = document.getElementById('imageModal');
    const fullImage = document.getElementById('fullImage');
    const closeImage = document.getElementById('closeImage');
    const allCards = document.querySelectorAll('.Card');

    allCards.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.onclick = function () {
            if (imageModal && fullImage) {
                imageModal.classList.add('active');
                imageModal.style.display = 'flex';
                fullImage.src = this.src;
                document.body.style.overflow = 'hidden';
            }
        };
    });

    const closeFullImage = () => {
        if (imageModal) {
            imageModal.classList.remove('active');
            setTimeout(() => {
                imageModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 400);
        }
    };

    if (imageModal) imageModal.onclick = (e) => { if (e.target === imageModal) closeFullImage(); };
    if (closeImage) closeImage.onclick = closeFullImage;

    // Инициализация игр из конфига
    config.forEach(initGame);
});
