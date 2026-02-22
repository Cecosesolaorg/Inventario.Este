document.addEventListener('DOMContentLoaded', () => {
    const displayName = document.getElementById('display-name');

    // Recuperar datos del sessionStorage
    const name = sessionStorage.getItem('userName');
    const lastName = sessionStorage.getItem('userLastName');

    if (name) {
        displayName.textContent = `${name} ${lastName || ''}`;
    }

    // Animación secuencial de las tarjetas
    const cards = document.querySelectorAll('.map-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });

    // Efecto de mouse para el fondo (mismo que el login)
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;

        const background = document.querySelector('.background-glow');
        if (background) {
            background.style.background = `
                radial-gradient(circle at ${x}% ${y}%, rgba(138, 43, 226, 0.15) 0%, transparent 40%),
                radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(0, 210, 255, 0.1) 0%, transparent 40%)
            `;
        }
    });
});
