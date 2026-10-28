// eventos.js
// Conecta los formularios con modulos.js y sube las portadas a ImgBB.
// La URL devuelta por ImgBB se envía al servidor local para guardarla en MySQL.

// Sube un archivo a ImgBB y devuelve la URL pública de la imagen.
const subirImg = async (archivo) => {
    // Esta es la clave que ya utilizaba el proyecto de referencia ImgBB.
    const apiKeyIMGBB = '3beaca2dd93e4804e634179e12e9a67f';
    const datosImagen = new FormData();
    datosImagen.append('image', archivo);

    const respuesta = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyIMGBB}`, {
        method: 'POST',
        body: datosImagen
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.error?.message || 'ImgBB no pudo subir la imagen');
    }
    return resultado.data.url;
};

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
        const botonEnviar = formulario.querySelector('input[type="submit"]');
        botonEnviar.disabled = true;

        try {
        const archivoImagen = formulario.elements.imagen.files[0];
        if (!archivoImagen) {
            mostrarMensaje('Seleccioná una imagen para el juego.');
            return;
        }
        if (!archivoImagen.type.startsWith('image/')) {
            mostrarMensaje('El archivo seleccionado no es una imagen.');
            return;
        }

        mostrarMensaje('Subiendo imagen a ImgBB...');
        const urlImagen = await subirImg(archivoImagen);

        const juego = {
            imagen: urlImagen,
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
        } catch (error) {
            console.error('Error al subir la imagen:', error);
            mostrarMensaje('No se pudo subir la imagen a ImgBB. Revisá la conexión y la API key.');
        } finally {
            botonEnviar.disabled = false;
        }
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

        const botonEnviar = formulario.querySelector('input[type="submit"]');
        botonEnviar.disabled = true;

        try {
        const archivoImagen = formulario.elements.imagen.files[0];
        const juego = {
            id: formulario.elements.id.value,
            titulo: formulario.elements.titulo.value.trim(),
            genero: formulario.elements.genero.value,
            consola: formulario.elements.consola.value
        };

        // Si eligió una imagen nueva, la subimos; si no, se conserva la existente.
        if (archivoImagen) {
            mostrarMensaje('Subiendo nueva imagen a ImgBB...');
            juego.imagen = await subirImg(archivoImagen);
        }

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
        } catch (error) {
            console.error('Error al actualizar la imagen:', error);
            mostrarMensaje('No se pudo subir la imagen a ImgBB. Revisá la conexión y la API key.');
        } finally {
            botonEnviar.disabled = false;
        }
    });
});
