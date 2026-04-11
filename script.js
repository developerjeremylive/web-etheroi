document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-toggle-icon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });

    const carousels = document.querySelectorAll('.carousel-container');

    carousels.forEach(carousel => {
        const grid = carousel.querySelector('.grid');
        const nextBtn = carousel.querySelector('.carousel-nav.next');
        const prevBtn = carousel.querySelector('.carousel-nav.prev');

        if (!grid || !nextBtn || !prevBtn) return;

        const firstCard = grid.querySelector('.project-card');
        const scrollAmount = firstCard ? firstCard.offsetWidth + parseFloat(getComputedStyle(grid).gap || 0) : 340;

        // Manual Navigation
        nextBtn.addEventListener('click', () => {
            grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        // Auto-scroll logic
        let autoScrollTimer = setInterval(() => {
            const maxScrollLeft = grid.scrollWidth - grid.clientWidth;

            if (grid.scrollLeft >= maxScrollLeft - 1) {
                // Reset to beginning if at the end
                grid.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }, 3000);

        // Pause auto-scroll on user interaction
        const pauseAutoScroll = () => clearInterval(autoScrollTimer);

        grid.addEventListener('mousedown', pauseAutoScroll);
        grid.addEventListener('touchstart', pauseAutoScroll);
        nextBtn.addEventListener('mousedown', pauseAutoScroll);
        prevBtn.addEventListener('mousedown', pauseAutoScroll);
    });
});
