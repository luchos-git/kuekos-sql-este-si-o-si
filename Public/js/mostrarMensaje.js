const mostrarMensaje = (texto) => {
    const p = document.querySelector(".mensaje");
    p.textContent = texto;
    p.style.display = 'block';
    setTimeout(() => {
        p.style.display = 'none';
    }, 3000);
};