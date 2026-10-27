// eventos.js
// En este archivo se conectan los botones y formularios con las funciones de modulos.js.
// Los formularios mandan título, género y consola al servidor local; no se suben imágenes.

document.addEventListener('DOMContentLoaded', () => {
    // Al abrir la página, cargamos los juegos que ya están guardados en MySQL.
    cargarJuegosDesdeApi();
    cargarSelects();

    // Muestra el formulario para agregar un juego.
    document.querySelector('#b-agregar').addEventListener('click', () => {
        document.querySelector('#agregar').style.display = 'block';
    });

    // Si se elige "Otro..." en género, se muestra el campo para escribirlo.
    document.querySelector('#agregar-genero').addEventListener('change', (evento) => {
        const otro = document.querySelector('#agregar-genero-otro');
        const esOtro = evento.target.value === 'otro';
        otro.style.display = esOtro ? 'block' : 'none';
        otro.required = esOtro;
        if (!esOtro) otro.value = '';
    });

    // Si se elige "Otro..." en consola, se muestra el campo para escribirla.
    document.querySelector('#agregar-consola').addEventListener('change', (evento) => {
        const otro = document.querySelector('#agregar-consola-otro');
        const esOtro = evento.target.value === 'otro';
        otro.style.display = esOtro ? 'block' : 'none';
        otro.required = esOtro;
        if (!esOtro) otro.value = '';
    });

    // Al enviar el formulario, reunimos los datos y los mandamos a la función de alta.
    document.querySelector('#agregar').addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const formulario = evento.currentTarget;

        const juego = {
            titulo: formulario.elements.titulo.value.trim(),
            genero: formulario.elements.genero.value,
            consola: formulario.elements.consola.value
        };

        // Reemplazamos "otro" por el texto que escribió el usuario.
        if (juego.genero === 'otro') {
            juego.genero = document.querySelector('#agregar-genero-otro').value.trim();
        }
        if (juego.consola === 'otro') {
            juego.consola = document.querySelector('#agregar-consola-otro').value.trim();
        }

        // Evitamos enviar campos vacíos al servidor.
        if (!juego.titulo || !juego.genero || !juego.consola) {
            mostrarMensaje('Completá título, género y consola.');
            return;
        }

        // Esperamos la respuesta del servidor antes de limpiar y cerrar el formulario.
        await agregarJuego(juego);
        formulario.reset();
        formulario.style.display = 'none';
        document.querySelector('#agregar-genero-otro').style.display = 'none';
        document.querySelector('#agregar-consola-otro').style.display = 'none';
    });

    // Cancela el alta y limpia los campos del formulario.
    document.querySelector('#b-cancelar-agregar').addEventListener('click', () => {
        const formulario = document.querySelector('#agregar');
        formulario.reset();
        document.querySelector('#agregar-genero-otro').style.display = 'none';
        document.querySelector('#agregar-consola-otro').style.display = 'none';
        formulario.style.display = 'none';
    });

    // Filtra los juegos por título, género y consola sin modificar la base de datos.
    document.querySelector('#buscar').addEventListener('submit', (evento) => {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        const titulo = formulario.elements.titulo.value.toLowerCase().trim();
        const genero = formulario.elements.genero.value;
        const consola = formulario.elements.consola.value;

        const juegosFiltrados = obtenerJuegos().filter(juego =>
            juego.titulo.toLowerCase().includes(titulo) &&
            (genero === '' || juego.genero === genero) &&
            (consola === '' || juego.consola === consola)
        );

        if (juegosFiltrados.length === 0) {
            mostrarMensaje('No se encontró el juego');
            mostrarSinResultados();
        } else {
            mostrarJuegos(juegosFiltrados);
        }
    });

    // Vuelve a mostrar la lista completa de juegos.
    document.querySelector('#b-inicio').addEventListener('click', () => {
        mostrarJuegos();
    });

    // Recoge los datos editados y los envía a la función que actualiza MySQL.
    document.querySelector('#modificar').addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const formulario = evento.currentTarget;

        const juego = {
            id: formulario.elements.id.value,
            titulo: formulario.elements.titulo.value.trim(),
            genero: formulario.elements.genero.value,
            consola: formulario.elements.consola.value
        };

        // Si el usuario eligió "Otro...", usamos el texto que ingresó.
        if (juego.genero === 'otro') {
            juego.genero = formulario.querySelector('#modificar-genero-otro').value.trim();
        }
        if (juego.consola === 'otro') {
            juego.consola = formulario.querySelector('#modificar-consola-otro').value.trim();
        }

        if (!juego.titulo || !juego.genero || !juego.consola) {
            mostrarMensaje('Completá título, género y consola.');
            return;
        }

        await modificarJuego(juego);
        formulario.style.display = 'none';
    });
});
