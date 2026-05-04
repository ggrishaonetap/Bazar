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

    const closeNav = () => {
        if (navModal) {
            navModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    if (openNavBtn) {
        openNavBtn.onclick = () => {
            if (navModal) {
                navModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        };
    }

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
                audio.play().then(() => musicBtn.innerText = '⏸ Пауза').catch(e => console.error("Ошибка автовоспроизведения:", e));
            } else {
                audio.pause();
                musicBtn.innerText = 'Музыка';
            }
        });
    }


    // --- 5. ЛОГИКА ИГРЫ ПАЗЛЫ ---
    const config = [
        { id: 'game1', img: 'img/SlavicBazaar.WebP' },
        { id: 'game2', img: 'img/Pazle2.WebP' } // Исправлен регистр расширения
    ];

    const secondGame = document.getElementById('game2');
    if (secondGame) {
        secondGame.style.display = 'none';
        secondGame.style.opacity = '0';
    }

    let draggedPiece = null;

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

            // Mouse Events
            p.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text', e.target.id);
                e.target.classList.add('dragging');
            });
            p.addEventListener('dragend', e => e.target.classList.remove('dragging'));

            // Touch Events
            p.addEventListener('touchstart', handleTouchStart, { passive: false });
            p.addEventListener('touchmove', handleTouchMove, { passive: false });
            p.addEventListener('touchend', handleTouchEnd, { passive: false });

            pieces.push(p);
        }

        // Перемешиваем и добавляем в банк
        pieces.sort(() => Math.random() - 0.5);
        pieces.forEach(p => bank.appendChild(p));
    }

    function handleTouchStart(e) {
        draggedPiece = e.target;
        draggedPiece.classList.add('dragging');
    }

    function handleTouchMove(e) {
        if (!draggedPiece) return;
        e.preventDefault();
        const touch = e.touches[0];
        draggedPiece.style.position = 'fixed';
        draggedPiece.style.left = `${touch.clientX - 40}px`;
        draggedPiece.style.top = `${touch.clientY - 40}px`;
        draggedPiece.style.zIndex = '10000';
    }

    function handleTouchEnd(e) {
        if (!draggedPiece) return;
        draggedPiece.classList.remove('dragging');

        const touch = e.changedTouches[0];

        // Магия для поиска элемента под пальцем:
        draggedPiece.style.display = 'none';
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        draggedPiece.style.display = 'block';

        const zone = targetElement ? targetElement.closest('.drop-zone') : null;
        const gameId = draggedPiece.id.split('-piece-')[0];

        draggedPiece.style.position = 'static';
        draggedPiece.style.zIndex = 'auto';

        if (zone) {
            if (zone.children.length > 0) {
                const existingPiece = zone.children[0];
                document.querySelector(`#${gameId} .pieces-bank`).appendChild(existingPiece);
            }
            zone.appendChild(draggedPiece);
            checkWin(gameId);
        } else {
            const bank = document.querySelector(`#${gameId} .pieces-bank`);
            if (bank) bank.appendChild(draggedPiece);
        }
        draggedPiece = null;
    }

    function handleDrop(e, zone, gameId) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text');
        const draggedEl = document.getElementById(draggedId);

        if (!draggedId || !draggedId.startsWith(gameId)) return;

        if (zone.children.length > 0) {
            const existingPiece = zone.children[0];
            document.querySelector(`#${gameId} .pieces-bank`).appendChild(existingPiece);
        }
        zone.appendChild(draggedEl);
        checkWin(gameId);
    }

    function checkWin(gameId) {
        const zones = document.querySelectorAll(`#${gameId} .drop-zone`);
        let score = 0;
        zones.forEach(z => {
            if (z.children.length > 0) {
                const pieceId = z.children[0].id;
                const pieceIndex = pieceId.split('-piece-')[1];
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

    if (imageModal) {
        imageModal.onclick = (e) => { if (e.target === imageModal) closeFullImage(); };
    }
    if (closeImage) closeImage.onclick = closeFullImage;


    // --- 7. СИСТЕМА ПАСХАЛОК ---
    const eggIcons = document.querySelectorAll('.easter-egg');
    const eggModal = document.getElementById('eggModal');
    const eggMessage = document.getElementById('eggMessage');
    let lastClickedEgg = null;

    function hideFoundEggs() {
        const foundEggs = JSON.parse(localStorage.getItem('foundEggs') || '[]');
        eggIcons.forEach(icon => {
            const eggId = icon.getAttribute('data-id');
            if (foundEggs.includes(eggId)) {
                icon.style.display = 'none';
            }
        });
    }

    if (eggIcons.length > 0 && eggModal) {
        hideFoundEggs();

        eggIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const eggId = icon.getAttribute('data-id');
                lastClickedEgg = icon;

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

        const closeEggModal = () => {
            eggModal.style.display = 'none';
            if (lastClickedEgg) {
                lastClickedEgg.style.display = 'none';
                lastClickedEgg = null;
            }
        };

        eggModal.onclick = (e) => { if (e.target === eggModal) closeEggModal(); };

        const modalCloseBtn = eggModal.querySelector('button');
        if (modalCloseBtn) {
            modalCloseBtn.onclick = (e) => {
                e.stopPropagation();
                closeEggModal();
            };
        }
    }
});

// --- ФУНКЦИЯ КОНФЕТТИ ---
function startConfetti() {
    const canvas = document.getElementById('confetti');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    let spawning = true;

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

        particles.forEach((p, index) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();

            p.y += p.velocity;
            p.rotation += 2;

            if (p.y > canvas.height) {
                if (spawning) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                } else {
                    particles.splice(index, 1);
                }
            }
        });

        if (spawning || particles.length > 0) {
            requestAnimationFrame(animate);
        }
    }

    animate();
    setTimeout(() => { spawning = false; }, 5000);
}

// --- 8. КНОПКА "ВВЕРХ" ---
const scrollBtn = document.createElement('button');
scrollBtn.id = 'scrollToTop';
scrollBtn.innerHTML = '&#8593;';
document.body.appendChild(scrollBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollBtn.classList.add('active');
    } else {
        scrollBtn.classList.remove('active');
    }
});

scrollBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
