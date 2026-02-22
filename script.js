document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const responsable = document.getElementById('responsable').value.trim();
        const companero = document.getElementById('companero').value.trim();

        if (responsable && companero) {
            // Guardar nombres para las siguientes pÃ¡ginas
            localStorage.setItem('userName', responsable);
            localStorage.setItem('userLastName', ""); // Resetting this
            localStorage.setItem('responsableDirecto', responsable);
            localStorage.setItem('companero', companero);

            // AnimaciÃ³n de carga simulada
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Procesando...</span>';

            setTimeout(() => {
                // Redirigir a mapa.html
                window.location.href = 'mapa.html';
            }, 1000);
        } else {
            alert('Por favor, completa todos los campos.');
        }
    });

    // Efecto sutil de seguimiento de mouse para el brillo del fondo (opcional/premium)
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;

        document.querySelector('.background-glow').style.background = `
            radial-gradient(circle at ${x}% ${y}%, rgba(138, 43, 226, 0.2) 0%, transparent 40%),
            radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(0, 210, 255, 0.15) 0%, transparent 40%)
        `;
    });
});
