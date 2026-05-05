document.addEventListener('DOMContentLoaded', () => {

    // --- 1. АНИМАЦИЯ ПОЯВЛЕНИЯ (SCROLL REVEAL) ---
    // Отслеживаем элементы с классом .hidden и добавляем им .show при появлении в области видимости
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


    // --- 2. МОБИЛЬНОЕ МЕНЮ (МОДАЛЬНОЕ ОКНО) ---
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


    // --- 3. ОТПРАВКА ФОРМЫ ОБРАТНОЙ СВЯЗИ (EMAILJS) ---
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


    // --- 4. ФОНОВАЯ МУЗЫКА (ВКЛЮЧЕНИЕ/ВЫКЛЮЧЕНИЕ) ---
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
const puzzlesConfig = [
    { id: 'game1', img: 'img/SlavicBazaar.WebP', winBannerId: 'winBanner1' },
    { id: 'game2', img: 'img/Pazle2.WebP', winBannerId: 'winBanner2' }
];

let draggedTouchPiece = null;
let activeGames = new Map();
let game2Initialized = false; // Флаг, инициализирован ли второй пазл

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function buildPuzzleGame(gameConfig, isVisible = true) {
    const container = document.getElementById(gameConfig.id);
    if (!container) return null;
    
    const board = container.querySelector('.puzzle-board');
    const bank = container.querySelector('.pieces-bank');
    if (!board || !bank) return null;
    
    board.innerHTML = '';
    bank.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const zone = document.createElement('div');
        zone.className = 'drop-zone';
        zone.dataset.index = i;
        zone.setAttribute('data-game-id', gameConfig.id);
        
        zone.addEventListener('dragover', (e) => e.preventDefault());
        zone.addEventListener('drop', (e) => handleDrop(e, zone, gameConfig.id));
        
        board.appendChild(zone);
    }
    
    const pieces = [];
    for (let i = 0; i < 9; i++) {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.id = `${gameConfig.id}-piece-${i}`;
        piece.draggable = true;
        piece.setAttribute('data-game-id', gameConfig.id);
        piece.setAttribute('data-piece-index', i);
        
        piece.style.backgroundImage = `url('${gameConfig.img}')`;
        const col = i % 3;
        const row = Math.floor(i / 3);
        const xPercent = (col * 100) / 2;
        const yPercent = (row * 100) / 2;
        piece.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
        piece.style.backgroundSize = `300% 300%`;
        
        piece.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.id);
            e.target.classList.add('dragging');
        });
        piece.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));
        
        piece.addEventListener('touchstart', handleTouchStart, { passive: false });
        piece.addEventListener('touchmove', handleTouchMove, { passive: false });
        piece.addEventListener('touchend', handleTouchEnd);
        
        pieces.push(piece);
    }
    
    shuffleArray(pieces);
    pieces.forEach(p => bank.appendChild(p));
    
    activeGames.set(gameConfig.id, { board, bank });
    
    const winBannerElem = document.getElementById(gameConfig.winBannerId);
    if (winBannerElem) winBannerElem.style.display = 'none';
    
    // Если пазл должен быть скрыт, скрываем его
    if (!isVisible && gameConfig.id === 'game2') {
        container.style.display = 'none';
    }
    
    return true;
}

function handleDrop(e, zone, gameId) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedEl = document.getElementById(draggedId);
    if (!draggedEl || !draggedEl.id.startsWith(gameId)) return;
    
    if (zone.children.length > 0) {
        const existingPiece = zone.children[0];
        const targetBank = document.querySelector(`#${gameId} .pieces-bank`);
        if (targetBank) targetBank.appendChild(existingPiece);
    }
    zone.appendChild(draggedEl);
    checkGameCompletion(gameId);
}

function handleTouchStart(e) {
    e.preventDefault();
    draggedTouchPiece = e.target.closest('.puzzle-piece');
    if (!draggedTouchPiece) return;
    
    draggedTouchPiece.classList.add('dragging');
    draggedTouchPiece.style.position = 'fixed';
    draggedTouchPiece.style.zIndex = '10000';
    
    const rect = draggedTouchPiece.getBoundingClientRect();
    const touch = e.touches[0];
    draggedTouchPiece._offsetX = touch.clientX - rect.left;
    draggedTouchPiece._offsetY = touch.clientY - rect.top;
    draggedTouchPiece.style.width = `${rect.width}px`;
    draggedTouchPiece.style.height = `${rect.height}px`;
}

function handleTouchMove(e) {
    if (!draggedTouchPiece) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    let left = touch.clientX - (draggedTouchPiece._offsetX || 40);
    let top = touch.clientY - (draggedTouchPiece._offsetY || 40);
    draggedTouchPiece.style.left = `${left}px`;
    draggedTouchPiece.style.top = `${top}px`;
}

function handleTouchEnd(e) {
    if (!draggedTouchPiece) return;
    e.preventDefault();
    
    draggedTouchPiece.classList.remove('dragging');
    const touch = e.changedTouches[0];
    
    draggedTouchPiece.style.display = 'none';
    const elemUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    draggedTouchPiece.style.display = '';
    draggedTouchPiece.style.position = '';
    draggedTouchPiece.style.zIndex = '';
    draggedTouchPiece.style.left = '';
    draggedTouchPiece.style.top = '';
    
    const dropZone = elemUnderTouch ? elemUnderTouch.closest('.drop-zone') : null;
    const gameId = draggedTouchPiece.id.split('-piece-')[0];
    const bankContainer = document.querySelector(`#${gameId} .pieces-bank`);
    
    if (dropZone && dropZone.getAttribute('data-game-id') === gameId) {
        if (dropZone.children.length > 0) {
            const existing = dropZone.children[0];
            if (bankContainer) bankContainer.appendChild(existing);
        }
        dropZone.appendChild(draggedTouchPiece);
        checkGameCompletion(gameId);
    } else {
        if (bankContainer) bankContainer.appendChild(draggedTouchPiece);
    }
    draggedTouchPiece = null;
}

function checkGameCompletion(gameId) {
    const container = document.getElementById(gameId);
    if (!container) return;
    
    const zones = container.querySelectorAll('.drop-zone');
    let correctCount = 0;
    
    zones.forEach(zone => {
        if (zone.children.length > 0) {
            const pieceId = zone.children[0].id;
            const pieceIndex = pieceId.split('-piece-')[1];
            if (pieceIndex === zone.dataset.index) correctCount++;
        }
    });
    
    const winBannerId = (gameId === 'game1') ? 'winBanner1' : 'winBanner2';
    const winBannerElem = document.getElementById(winBannerId);
    
    if (correctCount === 9) {
        if (winBannerElem) winBannerElem.style.display = 'block';
        
        // ЕСЛИ СОБРАН ПЕРВЫЙ ПАЗЛ - ПОКАЗЫВАЕМ ВТОРОЙ
        if (gameId === 'game1') {
            const secondGameDiv = document.getElementById('game2');
            if (secondGameDiv) {
                console.log('Показываем второй пазл...');
                
                // Меняем display на block
                secondGameDiv.style.display = 'block';
                secondGameDiv.style.opacity = '1';
                
                // Добавляем класс
                secondGameDiv.classList.add('puzzle-visible');
                
                // Если второй пазл ещё не инициализирован - инициализируем его сейчас
                if (!game2Initialized) {
                    console.log('Инициализируем второй пазл...');
                    setTimeout(() => {
                        buildPuzzleGame(puzzlesConfig[1], true);
                        game2Initialized = true;
                    }, 100);
                }
                
                // Прокручиваем ко второму пазлу
                setTimeout(() => {
                    secondGameDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        }
    } else {
        if (winBannerElem) winBannerElem.style.display = 'none';
    }
}

function resetAllGames() {
    // Пересоздаём первый пазл
    buildPuzzleGame(puzzlesConfig[0], true);
    
    // Скрываем и сбрасываем второй пазл
    const secondGame = document.getElementById('game2');
    if (secondGame) {
        secondGame.style.display = 'none';
        secondGame.classList.remove('puzzle-visible');
        // Пересоздаём второй пазл в скрытом состоянии
        buildPuzzleGame(puzzlesConfig[1], false);
        game2Initialized = false;
    }
    
    const firstWinBanner = document.getElementById('winBanner1');
    if (firstWinBanner) firstWinBanner.style.display = 'none';
    const secondWinBanner = document.getElementById('winBanner2');
    if (secondWinBanner) secondWinBanner.style.display = 'none';
}

function initAllPuzzles() {
    // Создаём первый пазл (видимый)
    buildPuzzleGame(puzzlesConfig[0], true);
    
    // Создаём второй пазл (скрытый)
    buildPuzzleGame(puzzlesConfig[1], false);
    game2Initialized = true; // Второй пазл уже создан при загрузке
    
    // Убеждаемся, что второй пазл скрыт
    const game2Div = document.getElementById('game2');
    if (game2Div) {
        game2Div.style.display = 'none';
        game2Div.classList.remove('puzzle-visible');
    }
}

initAllPuzzles();

const resetBtn = document.getElementById('resetAllPuzzles');
if (resetBtn) {
    resetBtn.addEventListener('click', resetAllGames);
}


    // --- 6. УВЕЛИЧЕНИЕ ФОТО (МОДАЛЬНОЕ ОКНО) ---
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


    // --- 7. СИСТЕМА ПАСХАЛОК (5 скрытых логотипов) ---
    const eggIcons = document.querySelectorAll('.easter-egg');
    const eggModal = document.getElementById('eggModal');
    const eggMessage = document.getElementById('eggMessage');
    
    let pendingEggToHide = null;
    let confettiFiredForFifth = false;

    const closeEggModal = () => {
        if (eggModal) {
            eggModal.style.display = 'none';
        }
        
        if (pendingEggToHide) {
            pendingEggToHide.style.display = 'none';
            pendingEggToHide = null;
        }
    };

    if (eggIcons.length > 0 && eggModal) {
        const foundEggs = JSON.parse(localStorage.getItem('foundEggs') || '[]');
        eggIcons.forEach(icon => {
            const eggId = icon.getAttribute('data-id');
            if (foundEggs.includes(eggId)) {
                icon.style.display = 'none';
            } else {
                icon.style.display = 'block';
                icon.style.opacity = '0.5';
            }
        });

        eggIcons.forEach(icon => {
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const eggId = icon.getAttribute('data-id');
                let foundEggs = JSON.parse(localStorage.getItem('foundEggs') || '[]');
                
                if (!foundEggs.includes(eggId)) {
                    foundEggs.push(eggId);
                    localStorage.setItem('foundEggs', JSON.stringify(foundEggs));
                    pendingEggToHide = icon;
                }
                
                const count = foundEggs.length;
                
                eggModal.style.display = 'flex';
                
                if (eggMessage) {
                    if (count === 5) {
                        eggMessage.innerText = "Поздравляем! Вы нашли все 5 пасхалок!";
                        if (!confettiFiredForFifth) {
                            confettiFiredForFifth = true;
                            startConfetti();
                        }
                    } else {
                        eggMessage.innerText = `Вы нашли ${count} из 5 пасхалок! Осталось ${5 - count}.`;
                    }
                }
            });
        });
        
        if (eggModal) {
            eggModal.onclick = (e) => {
                if (e.target === eggModal) {
                    closeEggModal();
                }
            };
        }
        
        const modalCloseBtn = eggModal.querySelector('button');
        if (modalCloseBtn) {
            modalCloseBtn.onclick = (e) => {
                e.stopPropagation();
                closeEggModal();
            };
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && eggModal && eggModal.style.display === 'flex') {
                closeEggModal();
            }
        });
    }
});


// --- ФУНКЦИЯ КОНФЕТТИ (для пасхалки №5) ---
function startConfetti() {
    const canvas = document.getElementById('confetti');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    let particles = [];
    let spawning = true;
    let animationId = null;

    for (let i = 0; i < 200; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`,
            velocity: Math.random() * 5 + 3,
            rotation: Math.random() * 360,
            spin: Math.random() * 10 - 5
        });
    }

    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();

            p.y += p.velocity;
            p.rotation += p.spin;

            if (p.y > canvas.height + 50) {
                if (spawning) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                } else {
                    particles.splice(i, 1);
                }
            }
        }

        if (particles.length > 0 || spawning) {
            animationId = requestAnimationFrame(animate);
        } else {
            if (animationId) cancelAnimationFrame(animationId);
            canvas.style.display = 'none';
        }
    }

    if (window.confettiAnimationId) {
        cancelAnimationFrame(window.confettiAnimationId);
    }

    canvas.style.display = 'block';
    animate();
    window.confettiAnimationId = animationId;

    setTimeout(() => {
        spawning = false;
    }, 4000);
}


// --- 8. КНОПКА "ПРОКРУТКА ВВЕРХ" ---
const scrollBtn = document.createElement('button');
scrollBtn.id = 'scrollToTop';
scrollBtn.innerHTML = '↑';
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
