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


    // --- 5. ЛОГИКА ИГРЫ ПАЗЛЫ (С ПОДДЕРЖКОЙ ТАЧ-СОБЫТИЙ) ---
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

        // Создаем зоны сброса
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
            const xPercent = (i % 3) * 50;
            const yPercent = Math.floor(i / 3) * 50;
            p.style.backgroundPosition = `${xPercent}% ${yPercent}%`;

            // События мыши
            p.addEventListener('dragstart', e => e.dataTransfer.setData('text', e.target.id));

            // СОБЫТИЯ ТАЧПАДА (ДЛЯ ТЕЛЕФОНОВ)
            p.addEventListener('touchstart', handleTouchStart, { passive: false });
            p.addEventListener('touchmove', handleTouchMove, { passive: false });
            p.addEventListener('touchend', handleTouchEnd, { passive: false });

            pieces.push(p);
        }

        pieces.sort(() => Math.random() - 0.5);
        pieces.forEach(p => bank.appendChild(p));
    }

    // Вспомогательные переменные для тача
    let draggedPiece = null;

    function handleTouchStart(e) {
        draggedPiece = e.target;
        draggedPiece.classList.add('dragging');
        e.preventDefault();
    }

    function handleTouchMove(e) {
        if (!draggedPiece) return;
        const touch = e.touches[0];
        // Двигаем элемент за пальцем
        draggedPiece.style.position = 'fixed';
        draggedPiece.style.left = `${touch.clientX - 40}px`;
        draggedPiece.style.top = `${touch.clientY - 40}px`;
        draggedPiece.style.zIndex = '1000';
        e.preventDefault();
    }

    function handleTouchEnd(e) {
        if (!draggedPiece) return;
        draggedPiece.classList.remove('dragging');
        draggedPiece.style.position = 'static';
        draggedPiece.style.zIndex = 'auto';

        const touch = e.changedTouches[0];
        // Находим элемент, над которым отпустили палец
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = targetElement ? targetElement.closest('.drop-zone') : null;
        const gameId = draggedPiece.id.split('-piece-')[0];

        if (zone) {
            if (zone.children.length > 0) {
                const existingPiece = zone.children[0];
                draggedPiece.parentElement.appendChild(existingPiece);
            }
            zone.appendChild(draggedPiece);
            checkWin(gameId);
        } else {
            // Если мимо — возвращаем в банк (или оставляем где был)
            const bank = document.querySelector(`#${gameId} .pieces-bank`);
            if (bank) bank.appendChild(draggedPiece);
        }

        draggedPiece = null;
        e.preventDefault();
    }

    function handleDrop(e, zone, gameId) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text');
        const draggedEl = document.getElementById(draggedId);
        if (!draggedId || !draggedId.startsWith(gameId)) return;

        if (zone.children.length > 0) {
            const existingPiece = zone.children[0];
            draggedEl.parentElement.appendChild(existingPiece);
        }
        zone.appendChild(draggedEl);
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

    config.forEach(initGame);


    // --- 6. УВЕЛИЧЕНИЕ ФОТО ---
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


    // --- 7. СИСТЕМА ПАСХАЛОК ---
    const eggIcons = document.querySelectorAll('.easter-egg');
    const eggModal = document.getElementById('eggModal');
    const eggMessage = document.getElementById('eggMessage');

    if (eggIcons.length > 0 && eggModal) {
        eggIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const eggId = icon.getAttribute('data-id');
                let foundEggs = JSON.parse(localStorage.getItem('foundEggs') || '[]');

                if (!foundEggs.includes(eggId)) {
                    foundEggs.push(eggId);
                    localStorage.setItem('foundEggs', JSON.stringify(foundEggs));
                }

                const count = foundEggs.length;
                eggModal.style.display = 'flex';

                if (count < 5) {
                    eggMessage.innerText = `Вы собрали ${count} из 5 пасхалок!`;
                } else {
                    eggMessage.innerText = "Поздравляем! Вы нашли все спрятанные пасхалки!";
                    startConfetti();
                }
            });
        });

        // Закрытие модалки пасхалок при клике на неё
        eggModal.onclick = (e) => { if (e.target === eggModal) eggModal.style.display = 'none'; };
    }
});

// --- ВНЕШНЯЯ ФУНКЦИЯ КОНФЕТТИ (С ПЛАВНЫМ УХОДОМ) ---
function startConfetti() {
    const canvas = document.getElementById('confetti');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    let spawning = true; // Флаг: создаем ли мы новые частицы сверху

    // Создаем начальную пачку
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            velocity: Math.random() * 4 + 2,
            rotation: Math.random() * 360
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Если все частицы улетели и спавн выключен — останавливаем цикл
        if (!spawning && particles.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        particles.forEach((p, index) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();

            p.y += p.velocity;
            p.rotation += 2;

            // Логика ухода:
            if (p.y > canvas.height) {
                if (spawning) {
                    // Если еще празднуем — возвращаем частицу наверх
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                } else {
                    // Если время вышло — удаляем частицу из массива навсегда
                    particles.splice(index, 1);
                }
            }
        });

        requestAnimationFrame(animate);
    }

    animate();

    // Через 5 секунд выключаем "спавн" сверху
    setTimeout(() => {
        spawning = false;
        console.log("Конфетти начинают плавно уходить...");
    }, 5000);
}
