
/*
 * ============================================================
 * ARCHIVO: actions.js
 * PROPÓSITO: Registrar y administrar las jugadas del partido.
 *
 * RESPONSABILIDADES:
 * - Seleccionar al jugador que realizó una acción.
 * - Habilitar o deshabilitar los botones de registro.
 * - Registrar acciones positivas y negativas.
 * - Mostrar el historial de jugadas.
 * - Deshacer la última acción registrada.
 * - Actualizar las estadísticas del dashboard.
 *
 * TIPOS DE ACCIÓN:
 * Recepción, Ataque, Bloqueo y Saque.
 *
 * RESULTADOS:
 * Positiva y Negativa.
 *
 * DEPENDENCIAS:
 * - storage.js: leer y guardar los datos.
 * - alerts.js: mostrar mensajes y confirmaciones.
 * - dashboard.js: actualizar las estadísticas generales.
 * - index.html: proporcionar los elementos de la interfaz.
 * ============================================================
 */


/* ============================================================
   1. VARIABLES GLOBALES
   ============================================================ */

// Arreglo que contiene las acciones del partido activo.
let actions = [];

// Número de camiseta del jugador seleccionado.
// null significa que todavía no se ha seleccionado un jugador.
let selectedPlayerNumber = null;


/* ============================================================
   2. OBTENER EL PARTIDO ACTIVO
   ============================================================ */

// Busca el partido que está en juego.
// Devuelve el objeto del partido o null si no hay uno activo.
function getActionMatch() {

    // Recupera toda la información guardada.
    const data = loadData();

    // Busca un partido cuyo ID coincida con activeMatchId
    // y cuyo estado sea "active".
    return data.matches.find(
        match =>
            match.id === data.activeMatchId &&
            match.status === "active"
    ) || null;
}


/* ============================================================
   3. MOSTRAR LOS JUGADORES PARA REGISTRAR ACCIONES
   ============================================================ */

// Crea un botón por cada jugador del partido activo.
// También indica visualmente cuál está seleccionado.
function showActionPlayers() {

    // Contenedor donde se dibujan los botones de jugadores.
    const grid = document.getElementById("actionPlayersGrid");

    // Elemento que muestra el jugador seleccionado.
    const badge = document.getElementById("selectedPlayerBadge");

    // Si el contenedor no existe en el HTML, termina la función.
    if (!grid) return;

    // Obtiene el partido actual.
    const match = getActionMatch();

    // Limpia el contenido anterior para evitar duplicados.
    grid.innerHTML = "";


    // --------------------------------------------------------
    // Comprobar que exista un partido activo
    // --------------------------------------------------------

    if (!match) {

        // No debe quedar ningún jugador seleccionado.
        selectedPlayerNumber = null;

        // Informa al usuario de que debe crear un partido.
        grid.textContent = "Primero debes crear un partido.";

        if (badge) {
            badge.textContent = "Sin partido";
        }

        // Deshabilita los botones de registro rápido.
        updateQuickActionButtons();

        return;
    }


    // Recupera los jugadores del partido.
    // Si no hay un arreglo de jugadores, utiliza uno vacío.
    const matchPlayers = match.players || [];


    // --------------------------------------------------------
    // Comprobar si el jugador seleccionado sigue existiendo
    // --------------------------------------------------------

    // Si el jugador seleccionado ya no está registrado,
    // elimina su selección para evitar registrar acciones
    // a nombre de un jugador que ya no existe.
    if (
        selectedPlayerNumber !== null &&
        !matchPlayers.some(
            player => player.number === selectedPlayerNumber
        )
    ) {
        selectedPlayerNumber = null;
    }


    // --------------------------------------------------------
    // Comprobar que el partido tenga jugadores
    // --------------------------------------------------------

    if (matchPlayers.length === 0) {

        selectedPlayerNumber = null;

        grid.textContent = "Agrega jugadores en la sección Jugadores.";

        if (badge) {
            badge.textContent = "Sin jugadores";
        }

        updateQuickActionButtons();

        return;
    }


    // --------------------------------------------------------
    // Crear un botón para cada jugador
    // --------------------------------------------------------

    matchPlayers.forEach(player => {

        // Crea un elemento HTML de tipo botón.
        const button = document.createElement("button");

        // Evita que el botón actúe como un botón de envío
        // si en el futuro queda dentro de un formulario.
        button.type = "button";

        // Aplica la clase CSS que define su apariencia.
        button.className = "action-player-button";


        // Si este jugador está seleccionado, añade la clase
        // "selected" para resaltarlo visualmente.
        if (player.number === selectedPlayerNumber) {
            button.classList.add("selected");
        }


        // Actualiza el atributo de accesibilidad aria-pressed.
        // "true" indica que el botón está seleccionado;
        // "false" indica que no lo está.
        button.setAttribute(
            "aria-pressed",
            String(player.number === selectedPlayerNumber)
        );


        // Crea el elemento que muestra el número de camiseta.
        const number = document.createElement("span");

        number.className = "action-player-number";
        number.textContent = `#${player.number}`;


        // Crea el elemento que muestra el nombre del jugador.
        const name = document.createElement("span");

        name.className = "action-player-name";
        name.textContent = player.name;


        // Añade el número y el nombre dentro del botón.
        button.append(number, name);


        // ----------------------------------------------------
        // Evento: seleccionar un jugador
        // ----------------------------------------------------

        button.addEventListener("click", () => {

            // Guarda el número del jugador seleccionado.
            selectedPlayerNumber = player.number;

            // Redibuja los botones para actualizar el resaltado.
            showActionPlayers();

            // Actualiza el estado de los botones de jugadas.
            updateQuickActionButtons();


            // Busca el elemento que muestra la última acción
            // o el mensaje de retroalimentación.
            const feedback =
                document.getElementById("lastActionFeedback");

            if (feedback) {
                feedback.textContent =
                    `Jugador seleccionado: #${player.number} ${player.name}`;
            }
        });


        // Añade el botón del jugador a la cuadrícula.
        grid.appendChild(button);
    });


    // --------------------------------------------------------
    // Actualizar el indicador del jugador seleccionado
    // --------------------------------------------------------

    // Busca al jugador cuyo número coincide con la selección.
    const selectedPlayer = matchPlayers.find(
        player => player.number === selectedPlayerNumber
    );

    if (badge) {

        // Si existe un jugador seleccionado, muestra sus datos.
        // De lo contrario, solicita seleccionar uno.
        badge.textContent = selectedPlayer
            ? `#${selectedPlayer.number} · ${selectedPlayer.name}`
            : "Selecciona un jugador";
    }

    // Actualiza los botones según el estado de la selección.
    updateQuickActionButtons();
}


/* ============================================================
   4. HABILITAR O DESHABILITAR LOS BOTONES DE JUGADAS
   ============================================================ */

// Los botones solo estarán habilitados cuando exista
// un partido activo y un jugador válido seleccionado.
function updateQuickActionButtons() {

    // Obtiene el partido que se está jugando.
    const match = getActionMatch();

    // Boolean() convierte la condición en true o false.
    const enabled = Boolean(
        match &&
        selectedPlayerNumber !== null &&
        match.players?.some(
            player => player.number === selectedPlayerNumber
        )
    );

    // Busca todos los botones con la clase quick-action-button.
    document.querySelectorAll(".quick-action-button").forEach(button => {

        // Si enabled es false, el botón queda deshabilitado.
        button.disabled = !enabled;
    });
}


/* ============================================================
   5. REGISTRAR UNA JUGADA
   ============================================================ */

// Registra una acción del jugador seleccionado.
// Recibe dos parámetros:
// type: tipo de acción, por ejemplo "Ataque".
// result: resultado de la acción, "Positiva" o "Negativa".
function recordQuickAction(type, result) {

    // Recupera los datos almacenados.
    const data = loadData();

    // Busca el partido activo dentro de los datos recuperados.
    const match = data.matches.find(
        item =>
            item.id === data.activeMatchId &&
            item.status === "active"
    );


    // --------------------------------------------------------
    // Validar que exista un partido activo
    // --------------------------------------------------------

    if (!match) {
        appAlert("No hay un partido activo.", "warning");
        return;
    }


    // --------------------------------------------------------
    // Validar que exista un jugador seleccionado
    // --------------------------------------------------------

    // Busca al jugador cuyo número coincide con la selección.
    const player = (match.players || []).find(
        item => item.number === selectedPlayerNumber
    );

    if (!player) {

        // Busca el espacio donde se muestran los mensajes.
        const feedback =
            document.getElementById("lastActionFeedback");

        if (feedback) {
            feedback.textContent = "Selecciona un jugador primero.";
        }

        return;
    }


    // --------------------------------------------------------
    // Validar el tipo y el resultado de la acción
    // --------------------------------------------------------

    // Solo se permiten los cuatro tipos de acción definidos.
    // También se limita el resultado a Positiva o Negativa.
    if (
        !["Recepción", "Ataque", "Bloqueo", "Saque"].includes(type) ||
        !["Positiva", "Negativa"].includes(result)
    ) {
        return;
    }


    // --------------------------------------------------------
    // Preparar el arreglo de acciones
    // --------------------------------------------------------

    // Si actions no existe o no es un arreglo, lo inicializa.
    if (!Array.isArray(match.actions)) {
        match.actions = [];
    }


    // --------------------------------------------------------
    // Crear el objeto que representa la jugada
    // --------------------------------------------------------

    const action = {

        // Genera un identificador numérico para esta acción.
        // Date.now() aporta la hora actual en milisegundos;
        // Math.random() añade un componente aleatorio.
        id: Date.now() + Math.random(),

        // Número de camiseta del jugador que realizó la acción.
        playerNumber: player.number,

        // Tipo de jugada: Recepción, Ataque, Bloqueo o Saque.
        type,

        // Resultado: Positiva o Negativa.
        result,

        // Número del set en el que se registró la jugada.
        set: match.currentSet
    };


    // Añade la nueva acción al historial del partido.
    match.actions.push(action);


    // --------------------------------------------------------
    // Guardar y actualizar la interfaz
    // --------------------------------------------------------

    // Guarda todos los datos actualizados en localStorage.
    saveData(data);

    // Actualiza la variable global con las acciones del partido.
    // La copia evita que actions sea el mismo arreglo de match.actions.
    actions = [...match.actions];

    // Redibuja el historial de jugadas.
    showActions();


    // --------------------------------------------------------
    // Mostrar confirmación visual
    // --------------------------------------------------------

    const feedback =
        document.getElementById("lastActionFeedback");

    if (feedback) {
        feedback.textContent =
            `✓ #${player.number} ${player.name} · ${type} ${result.toLowerCase()}`;
    }


    // Actualiza las estadísticas del dashboard si la función existe.
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }
}


/* ============================================================
   6. DESHACER LA ÚLTIMA JUGADA
   ============================================================ */

// Elimina la última acción registrada en el partido activo.
// Es async porque espera la respuesta de appConfirm().
async function undoLastAction() {

    // Recupera los datos guardados.
    const data = loadData();

    // Busca el partido que está en juego.
    const match = data.matches.find(
        item =>
            item.id === data.activeMatchId &&
            item.status === "active"
    );


    // Si no hay partido, no hay arreglo válido o no existen
    // acciones registradas, no hay nada que deshacer.
    if (!match || !Array.isArray(match.actions) ||
        match.actions.length === 0) {
        return;
    }


    // Obtiene la última acción del arreglo.
    const lastAction = match.actions[match.actions.length - 1];

    // Busca al jugador que realizó esa acción.
    // En este código la variable player se obtiene,
    // pero no se utiliza posteriormente.
    const player = (match.players || []).find(
        item => item.number === lastAction.playerNumber
    );


    // Solicita confirmación antes de eliminar el registro.
    // await espera a que el usuario confirme o cancele.
    const confirmed = await appConfirm(
        "¿Quieres eliminar la última jugada registrada?",
        "Deshacer jugada"
    );

    // Si el usuario cancela, no se modifica nada.
    if (!confirmed) return;


    // Elimina el último elemento del arreglo.
    // pop() modifica el arreglo original.
    match.actions.pop();


    // Guarda los datos después de eliminar la acción.
    saveData(data);

    // Actualiza la variable global con las acciones restantes.
    actions = [...match.actions];

    // Actualiza el historial que ve el usuario.
    showActions();


    // Informa que se eliminó la última jugada.
    const feedback =
        document.getElementById("lastActionFeedback");

    if (feedback) {
        feedback.textContent = "Última acción eliminada.";
    }


    // Actualiza las estadísticas generales si existe la función.
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }
}


/* ============================================================
   7. CARGAR LAS ACCIONES DEL PARTIDO ACTIVO
   ============================================================ */

// Recupera las acciones guardadas para el partido actual.
// Si no hay partido activo, utiliza un arreglo vacío.
function loadActions() {

    const match = getActionMatch();

    // Copia las acciones del partido si están disponibles.
    actions = match && Array.isArray(match.actions)
        ? [...match.actions]
        : [];

    // Muestra los registros en pantalla.
    showActions();
}


/* ============================================================
   8. MOSTRAR EL HISTORIAL DE JUGADAS
   ============================================================ */

// Actualiza la lista visual de acciones sin eliminar
// los registros anteriores del partido.
function showActions() {

    // Busca los elementos HTML necesarios.
    const actionList = document.getElementById("actionList");
    const countBadge = document.getElementById("actionCountBadge");
    const undoButton = document.getElementById("undoLastActionButton");

    // Obtiene el partido activo.
    const match = getActionMatch();


    // Sincroniza el arreglo global con los datos guardados.
    actions = match && Array.isArray(match.actions)
        ? [...match.actions]
        : [];


    // --------------------------------------------------------
    // Actualizar el contador de jugadas
    // --------------------------------------------------------

    if (countBadge) {

        // Muestra "1 registro" en singular y "2 registros"
        // en plural, según la cantidad de acciones.
        countBadge.textContent =
            `${actions.length} ${actions.length === 1 ? "registro" : "registros"}`;
    }


    // --------------------------------------------------------
    // Actualizar el botón para deshacer
    // --------------------------------------------------------

    if (undoButton) {

        // Solo permite deshacer si existe al menos una acción.
        undoButton.disabled = actions.length === 0;
    }


    // Si no existe la lista HTML, termina después de actualizar
    // el contador y el botón.
    if (!actionList) return;


    // Elimina los elementos anteriores de la lista.
    actionList.innerHTML = "";


    // --------------------------------------------------------
    // Mostrar un mensaje si no hay jugadas
    // --------------------------------------------------------

    if (actions.length === 0) {

        // Crea un elemento de lista.
        const item = document.createElement("li");

        // Aplica clases de Bootstrap.
        item.className = "list-group-item text-muted";

        // Indica que todavía no se han registrado jugadas.
        item.textContent = "Todavía no hay jugadas registradas.";

        // Añade el mensaje a la lista.
        actionList.appendChild(item);

        return;
    }


    // --------------------------------------------------------
    // Mostrar las jugadas desde la más reciente
    // --------------------------------------------------------

    // Crea una copia de actions y la invierte para mostrar
    // primero el registro más reciente, sin alterar el arreglo.
    [...actions].reverse().forEach((action, index) => {

        // Busca al jugador que realizó la acción.
        const player = match?.players?.find(
            item => item.number === action.playerNumber
        );


        // Crea un elemento <li> para mostrar la jugada.
        const item = document.createElement("li");

        // Aplica el estilo de elemento de lista de Bootstrap.
        item.className = "list-group-item";


        // Construye el texto del registro.
        // Si el jugador ya no existe, muestra su número de camiseta.
        // También incluye el tipo, el resultado y el número del set.
        item.textContent =
            `${actions.length - index}. ` +
            `${player ? player.name : `Jugador #${action.playerNumber}`} | ` +
            `${action.type} | ${action.result} | Set ${action.set}`;


        // Añade el registro a la lista visible.
        actionList.appendChild(item);
    });
}


/* ============================================================
   9. INICIALIZAR EL REGISTRO DE JUGADAS
   ============================================================ */

// Carga las acciones guardadas del partido activo.
loadActions();

// Dibuja los botones de selección de jugadores.
showActionPlayers();
