
/*
 * ============================================================
 * ARCHIVO: dashboard.js
 * PROPÓSITO: Administrar la información del panel principal.
 *
 * RESPONSABILIDADES:
 * - Contar los partidos registrados.
 * - Contar los jugadores del partido activo.
 * - Contar las acciones positivas y negativas del partido activo.
 * - Actualizar las estadísticas que aparecen en el dashboard.
 * - Resaltar la sección seleccionada en el menú de navegación.
 *
 * DEPENDENCIAS:
 * - storage.js: proporciona la función loadData().
 * - index.html: contiene las tarjetas de estadísticas y el menú.
 * ============================================================
 */


/* ============================================================
   1. ACTUALIZAR LAS ESTADÍSTICAS DEL DASHBOARD
   ============================================================ */

// Esta función obtiene los datos almacenados y actualiza
// los números que aparecen en el panel principal.
function updateDashboard() {

    // Recupera los datos guardados en localStorage.
    // La función loadData() está definida en storage.js.
    const data = loadData();


    // --------------------------------------------------------
    // Buscar el partido activo
    // --------------------------------------------------------

    // Busca un partido cuyo identificador coincida con
    // activeMatchId y cuyo estado sea "active".
    const activeMatch = data.matches.find(
        match =>
            match.id === data.activeMatchId &&
            match.status === "active"
    );


    // --------------------------------------------------------
    // Contar los partidos y jugadores
    // --------------------------------------------------------

    // Cuenta todos los partidos registrados, tanto activos
    // como finalizados.
    const matchesCount = data.matches.length;

    // Si existe un partido activo, cuenta sus jugadores.
    // Si no existe, el resultado será 0.
    const playersCount = activeMatch
        ? activeMatch.players.length
        : 0;


    // --------------------------------------------------------
    // Obtener las acciones del partido activo
    // --------------------------------------------------------

    // Recupera las acciones registradas en el partido activo.
    // Si no hay partido activo, utiliza un arreglo vacío.
    const actions = activeMatch
        ? activeMatch.actions
        : [];


    // --------------------------------------------------------
    // Contar las acciones positivas y negativas
    // --------------------------------------------------------

    // filter() crea un nuevo arreglo con las acciones
    // cuyo resultado sea exactamente "Positiva".
    // length cuenta cuántos elementos contiene ese arreglo.
    const positive = actions.filter(
        action => action.result === "Positiva"
    ).length;

    // Cuenta las acciones cuyo resultado sea "Negativa".
    const negative = actions.filter(
        action => action.result === "Negativa"
    ).length;


    // --------------------------------------------------------
    // Mostrar los resultados en el HTML
    // --------------------------------------------------------

    // Busca el elemento con id="dashboardMatches"
    // y muestra la cantidad total de partidos.
    document.getElementById("dashboardMatches").textContent =
        matchesCount;

    // Muestra la cantidad de jugadores del partido activo.
    document.getElementById("dashboardPlayers").textContent =
        playersCount;

    // Muestra la cantidad de acciones positivas.
    document.getElementById("dashboardPositive").textContent =
        positive;

    // Muestra la cantidad de acciones negativas.
    document.getElementById("dashboardNegative").textContent =
        negative;
}


/* ============================================================
   2. RESALTAR LA SECCIÓN SELECCIONADA DEL MENÚ
   ============================================================ */

// Busca todos los enlaces que tengan la clase "nav-link"
// dentro de un elemento con la clase "app-nav".
document.querySelectorAll(".app-nav .nav-link").forEach(link => {

    // Escucha el evento de clic en cada enlace.
    link.addEventListener("click", () => {

        // Busca nuevamente todos los enlaces del menú.
        document.querySelectorAll(".app-nav .nav-link")

            // Elimina la clase "active" de cada enlace.
            // Así se quita el resaltado de la selección anterior.
            .forEach(item => item.classList.remove("active"));

        // Agrega la clase "active" al enlace seleccionado.
        // El CSS utiliza esta clase para darle un estilo visual.
        link.classList.add("active");
    });
});


/* ============================================================
   3. EJECUTAR AL CARGAR EL ARCHIVO
   ============================================================ */

// Llama a la función para mostrar las estadísticas
// desde el momento en que se ejecuta este archivo.
updateDashboard();
