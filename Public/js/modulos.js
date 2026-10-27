// modulos.js
// En este archivo están las funciones que trabajan con los juegos.
// Los datos principales se guardan en MySQL a través del servidor local (/juegos).
// localStorage queda solamente como caché para poder conservar la última lista cargada.

// Devuelve los juegos guardados temporalmente en el navegador.
const obtenerJuegos = () => JSON.parse(localStorage.getItem("juegos")) || [];

// Actualiza la caché local. La base de datos se modifica mediante las peticiones fetch.
const guardarJuegos = (juegos) => {
    localStorage.setItem("juegos", JSON.stringify(juegos));
};

// Consulta el servidor local para traer la lista real que está guardada en MySQL.
const cargarJuegosDesdeApi = async () => {
    try {
        const respuesta = await fetch('/juegos');
        if (!respuesta.ok) throw new Error('El servidor no pudo consultar los juegos');

        const juegos = await respuesta.json();
        guardarJuegos(juegos);
        mostrarJuegos();
        cargarSelects();
    } catch (error) {
        console.error('No se pudieron cargar los juegos desde MySQL:', error);
        mostrarMensaje('No se pudieron cargar los juegos. Revisá el servidor y MySQL.');
    }
};

// Opciones iniciales que se muestran aunque todavía no haya juegos cargados.
const generosPorDefecto = ["Acción", "Aventura", "RPG", "Deportes", "Terror"];
const consolasPorDefecto = ["PC", "PlayStation 5", "PlayStation 4", "PlayStation 3", "Xbox Series X/S", "Xbox One", "Xbox 360", "Nintendo Switch", "Nintendo Wii U", "Nintendo 3DS", "Mobile", "Steam Deck"];

// Combina los géneros predeterminados con los que ya aparecen en los juegos guardados.
// Set evita que las opciones se repitan.
const obtenerGeneros = () => {
    const generosDeJuegos = obtenerJuegos().map(juego => juego.genero);
    return Array.from(new Set([...generosPorDefecto, ...generosDeJuegos]));
};

// Hace lo mismo que obtenerGeneros, pero con las consolas.
const obtenerConsolas = () => {
    const consolasDeJuegos = obtenerJuegos().map(juego => juego.consola);
    return Array.from(new Set([...consolasPorDefecto, ...consolasDeJuegos]));
};

// Llena un <select> con las opciones recibidas.
// incluirTodos se usa en los filtros; incluirOtro permite escribir una opción nueva.
const llenarSelect = (select, opciones, incluirTodos, incluirOtro) => {
    select.innerHTML = '';

    if (incluirTodos) {
        select.innerHTML += '<option value="">Todos</option>';
    }

    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion;
        option.textContent = opcion;
        select.appendChild(option);
    });

    if (incluirOtro) {
        select.innerHTML += '<option value="otro">Otro...</option>';
    }
};

// Actualiza los select de búsqueda, agregar y modificar.
const cargarSelects = () => {
    llenarSelect(document.querySelector('#buscar-genero'), obtenerGeneros(), true, false);
    llenarSelect(document.querySelector('#buscar-consola'), obtenerConsolas(), true, false);
    llenarSelect(document.querySelector('#agregar-genero'), obtenerGeneros(), false, true);
    llenarSelect(document.querySelector('#agregar-consola'), obtenerConsolas(), false, true);
};

// Selecciona el valor actual en el formulario de modificación.
// Si el valor no está en las opciones, se muestra el campo "Otro" con ese texto.
const seleccionarValorActual = (selectorSelect, selectorOtro, valorActual) => {
    const select = document.querySelector(selectorSelect);
    const otro = document.querySelector(selectorOtro);
    const existeOpcion = Array.from(select.options).some(opcion => opcion.value === valorActual);

    if (existeOpcion) {
        select.value = valorActual;
        otro.style.display = 'none';
        otro.value = '';
    } else {
        select.value = 'otro';
        otro.style.display = 'block';
        otro.value = valorActual;
    }
};

// Dibuja las tarjetas de los juegos. Si recibe una lista filtrada, muestra solamente esa lista.
const mostrarJuegos = (juegos = null) => {
    const listado = document.querySelector('#listado');
    const datos = juegos !== null ? juegos : obtenerJuegos();
    const btnInicio = document.querySelector('#b-inicio');

    // El botón de inicio solo aparece cuando se muestran resultados filtrados.
    if (btnInicio) btnInicio.style.display = juegos !== null ? 'inline-block' : 'none';
    listado.innerHTML = '';

    datos.forEach(juego => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'juego';
        tarjeta.innerHTML = `
            <div class="juego-info">
                <div class="juego-datos">
                    <h4>${juego.titulo}</h4>
                    <p><strong>Género:</strong> ${juego.genero}</p>
                    <p><strong>Consola:</strong> ${juego.consola}</p>
                </div>
            </div>
            <div class="juego-acciones">
                <button class="b-modificar" onclick="prepararEdicion('${juego.id}')">Modificar</button>
                <button class="b-eliminar" onclick="eliminarJuego('${juego.id}')">Eliminar</button>
            </div>
        `;
        listado.appendChild(tarjeta);
    });
};

// Muestra un mensaje dentro del listado cuando una búsqueda no encuentra coincidencias.
const mostrarSinResultados = () => {
    const listado = document.querySelector('#listado');
    const btnInicio = document.querySelector('#b-inicio');
    if (btnInicio) btnInicio.style.display = 'inline-block';
    listado.innerHTML = `
        <div class="sin-resultados">
            <p>No se encontró ningún juego con ese título, género o consola</p>
        </div>`;
};

// CREATE: envía los datos ingresados al servidor, que los inserta en la tabla MySQL.
const agregarJuego = async (nuevoJuego) => {
    try {
        const respuesta = await fetch('/juegos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoJuego)
        });
        if (!respuesta.ok) throw new Error('El servidor no pudo guardar el juego');

        // Se vuelve a consultar MySQL para mostrar el registro con su ID real.
        await cargarJuegosDesdeApi();
        mostrarMensaje('Juego agregado con éxito');
    } catch (error) {
        console.error('No se pudo guardar el juego en MySQL:', error);
        mostrarMensaje('No se pudo agregar el juego. Revisá el servidor y probá de nuevo.');
    }
};

// DELETE: elimina de MySQL el juego que corresponde al ID seleccionado.
const eliminarJuego = async (id) => {
    const juego = obtenerJuegos().find(item => String(item.id) === String(id));
    if (!juego) return;
    if (!confirm(`¿Seguro que querés eliminar "${juego.titulo}"?`)) return;

    try {
        // El ID va en la URL; /juegos/:id es el patrón del servidor, no la URL literal.
        const respuesta = await fetch(`/juegos/${id}`, { method: 'DELETE' });
        if (!respuesta.ok) throw new Error('El servidor no pudo eliminar el juego');

        await cargarJuegosDesdeApi();
        mostrarMensaje('Juego eliminado');
    } catch (error) {
        console.error('No se pudo eliminar el juego de MySQL:', error);
        mostrarMensaje('No se pudo eliminar el juego. Probá de nuevo.');
    }
};

// Prepara el formulario de edición con los datos actuales del juego seleccionado.
const prepararEdicion = (id) => {
    const juego = obtenerJuegos().find(item => String(item.id) === String(id));
    if (!juego) return;

    const form = document.querySelector('#modificar');
    form.innerHTML = `
        <h3>Modificar juego</h3>
        <input type="hidden" name="id" value="${juego.id}">
        <input type="text" name="titulo" value="${juego.titulo}" placeholder="ingrese titulo" required>
        <select name="genero" id="modificar-genero" required></select>
        <input type="text" id="modificar-genero-otro" placeholder="ingrese nuevo genero" class="campo-otro">
        <select name="consola" id="modificar-consola" required></select>
        <input type="text" id="modificar-consola-otro" placeholder="ingrese nueva consola" class="campo-otro">
        <input type="submit" value="Guardar Cambios">
        <button type="button" id="b-cancelar-modificar">Cancelar</button>
    `;
    form.style.display = 'block';

    llenarSelect(document.querySelector('#modificar-genero'), obtenerGeneros(), false, true);
    llenarSelect(document.querySelector('#modificar-consola'), obtenerConsolas(), false, true);
    seleccionarValorActual('#modificar-genero', '#modificar-genero-otro', juego.genero);
    seleccionarValorActual('#modificar-consola', '#modificar-consola-otro', juego.consola);

    // Al elegir "Otro...", se habilita el campo para escribir una opción nueva.
    document.querySelector('#modificar-genero').addEventListener('change', (evento) => {
        const otro = document.querySelector('#modificar-genero-otro');
        const esOtro = evento.target.value === 'otro';
        otro.style.display = esOtro ? 'block' : 'none';
        otro.required = esOtro;
        if (!esOtro) otro.value = '';
    });

    document.querySelector('#modificar-consola').addEventListener('change', (evento) => {
        const otro = document.querySelector('#modificar-consola-otro');
        const esOtro = evento.target.value === 'otro';
        otro.style.display = esOtro ? 'block' : 'none';
        otro.required = esOtro;
        if (!esOtro) otro.value = '';
    });

    // Permite cerrar el formulario sin guardar los cambios.
    document.querySelector('#b-cancelar-modificar').addEventListener('click', () => {
        form.style.display = 'none';
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// UPDATE: envía los cambios al servidor para actualizar el registro en MySQL.
const modificarJuego = async (datos) => {
    const juegoActualizado = {
        titulo: datos.titulo,
        genero: datos.genero,
        consola: datos.consola
    };

    try {
        const respuesta = await fetch(`/juegos/${datos.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(juegoActualizado)
        });
        if (!respuesta.ok) throw new Error('El servidor no pudo actualizar el juego');

        await cargarJuegosDesdeApi();
        mostrarMensaje('Juego actualizado con éxito');
    } catch (error) {
        console.error('No se pudo actualizar el juego en MySQL:', error);
        mostrarMensaje('No se pudo actualizar el juego. Probá de nuevo.');
    }
};
