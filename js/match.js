/*
 * ============================================================
 * ARCHIVO: match.js
 * PROPÓSITO: Controlar el marcador y el desarrollo del partido.
 *
 * RESPONSABILIDADES:
 * - Inicializar el partido activo.
 * - Registrar los puntos de cada equipo.
 * - Detectar cuándo termina un set.
 * - Llevar el conteo de sets ganados.
 * - Guardar el estado del partido.
 * - Finalizar el encuentro.
 * - Mostrar el historial de partidos finalizados.
 *
 * DEPENDENCIAS:
 * - storage.js: cargar y guardar información del partido.
 * - alerts.js: mostrar mensajes al usuario mediante appAlert().
 * - index.html: elementos HTML del marcador y sus botones.
 * ============================================================
 */

/* ============================================================
   1. VARIABLES DEL PARTIDO
   ============================================================ */

// Almacena el objeto del partido que se está jugando.
let currentMatch = null;

// Puntos que lleva cada equipo en el set actual.
let homeScore = 0;
let opponentScore = 0;

// Cantidad de sets ganados por cada equipo.
let homeSets = 0;
let opponentSets = 0;

// Número del set que se está jugando.
let currentSet = 1;

// Indica si el partido ya terminó.
let matchFinished = false;

// Guarda el resultado de cada set que ha terminado.
let setHistory = [];

// guarda el estado anterior a cada punto registrado
// permitira deshacer puntos normales y  puntos que cierren un set
let pointHistory = [];

/* ============================================================
   2. INICIALIZAR EL PARTIDO
   ============================================================ */

// Recupera el partido activo y actualiza la interfaz.
// Si no existe un partido activo, reinicia las variables.
function initializeMatch() {
  // Busca en localStorage el partido que está activo.
  currentMatch = getActiveMatch();

  if (currentMatch) {
    // Recupera los datos guardados del partido.
    // El operador ?? utiliza el valor de la derecha
    // cuando el valor de la izquierda es null o undefined.
    homeScore = currentMatch.homeScore ?? 0;
    opponentScore = currentMatch.opponentScore ?? 0;

    homeSets = currentMatch.homeSets ?? 0;
    opponentSets = currentMatch.opponentSets ?? 0;

    currentSet = currentMatch.currentSet ?? 1;

    // Copia el historial de sets para trabajar con él.
    setHistory = [...(currentMatch.setHistory ?? [])];

    // Recupera el historial de puntos pendientes de deshacer.
    // Si el partido es antiguo y no tiene este dato, inicia vacío.
    pointHistory = [...(currentMatch.pointHistory ?? [])];

    // El partido se considera terminado si su estado
    // es "finished" o alguno de los equipos ganó tres sets.
    matchFinished =
      currentMatch.status === "finished" ||
      homeSets === 3 ||
      opponentSets === 3;
  } else {
    // Si no hay partido activo, restablece los valores.
    homeScore = 0;
    opponentScore = 0;

    homeSets = 0;
    opponentSets = 0;

    currentSet = 1;
    setHistory = [];

    pointHistory = [];

    matchFinished = false;
  }

  // Actualiza el marcador y los controles visuales.
  updateScore();

  // Actualiza la lista de partidos finalizados.
  showMatchHistory();
}

/* ============================================================
   3. GUARDAR EL ESTADO DEL PARTIDO
   ============================================================ */

// Guarda los puntos, los sets y el historial del partido.
// Devuelve true si se pudo preparar y guardar el estado,
// o false si no existe un partido activo.
function saveMatchState() {
  // Obtiene el partido que está activo actualmente.
  const match = getActiveMatch();

  // No permite guardar el marcador si no hay un partido activo.
  if (!match || match.status !== "active") {
    return false;
  }

  // Copia las variables actuales al objeto del partido.
  match.homeScore = homeScore;
  match.opponentScore = opponentScore;

  match.homeSets = homeSets;
  match.opponentSets = opponentSets;

  match.currentSet = currentSet;

  // Guarda una copia del historial de sets.
  match.setHistory = [...setHistory];

  // Guarda los estados anteriores para que Deshacer punto
  // siga funcionando después de recargar la página.
  match.pointHistory = [...pointHistory];

  // Comprueba que exista la función encargada de guardar
  // el partido en el almacenamiento.
  if (typeof saveActiveMatch !== "function") {
    console.error("No existe la función saveActiveMatch().");
    return false;
  }

  // Guarda los cambios utilizando storage.js.
  saveActiveMatch(match);

  // Actualiza la referencia del partido en memoria.
  currentMatch = match;

  return true;
}

/* ============================================================
   4. ACTUALIZAR EL MARCADOR EN PANTALLA
   ============================================================ */

// Modifica los textos, los resultados y el estado de los botones
// para que la interfaz coincida con los datos del partido.
function updateScore() {
  // Busca los elementos HTML por su identificador (id).
  const title = document.getElementById("matchTitle");
  const scoreboard = document.getElementById("scoreboard");
  const setsScore = document.getElementById("setsScore");
  const currentSetLabel = document.getElementById("currentSet");
  const history = document.getElementById("setHistory");

  const homeButton = document.getElementById("homePointButton");
  const undoPointButton = document.getElementById("undoLastPointButton");
  const opponentButton = document.getElementById("opponentPointButton");
  const finishButton = document.getElementById("finishMatchButton");

  // Muestra los nombres de los equipos.
  if (title) {
    title.textContent = currentMatch
      ? `${currentMatch.teamName} vs. ${currentMatch.opponentName || "Equipo visitante"}`
      : "No hay un partido activo";
  }

  // Muestra los puntos actuales del set.
  if (scoreboard) {
    scoreboard.textContent = `${homeScore} - ${opponentScore}`;
  }

  // Muestra cuántos sets ha ganado cada equipo.
  if (setsScore) {
    setsScore.textContent = `Sets: ${homeSets} - ${opponentSets}`;
  }

  // Indica si no hay partido, si terminó o qué set se juega.
  if (currentSetLabel) {
    currentSetLabel.textContent = !currentMatch
      ? "Sin partido"
      : matchFinished
        ? "Partido listo para finalizar"
        : `Set ${currentSet}`;
  }

  // Muestra los resultados de los sets que ya terminaron.
  if (history) {
    history.textContent = setHistory.join(" | ");
  }

  // Actualiza el botón para registrar un punto del equipo local.
  if (homeButton) {
    homeButton.textContent = `Punto ${currentMatch ? currentMatch.teamName : "local"}`;

    // Deshabilita el botón si no hay partido o ya terminó.
    homeButton.disabled = !currentMatch || matchFinished;
  }

  // Solo permite deshacer si existe un partido activo
  // y hay al menos un punto registrado en el historial.
  if (undoPointButton) {
    undoPointButton.disabled =
      !currentMatch ||
      currentMatch.status !== "active" ||
      pointHistory.length === 0;
  }

  // Actualiza el botón para registrar un punto del rival.
  if (opponentButton) {
    opponentButton.textContent = `Punto ${currentMatch ? currentMatch.opponentName || "visitante" : "visitante"}`;

    opponentButton.disabled = !currentMatch || matchFinished;
  }

  // Solo impide finalizar desde este botón si no hay partido.
  if (finishButton) {
    finishButton.disabled = !currentMatch;
  }
}

/* ============================================================
   5. REGISTRAR UN PUNTO
   ============================================================ */

// Recibe "home" o "opponent" para identificar al equipo
// que acaba de ganar el punto.
function addPoint(team) {
  // Verifica que exista un partido activo y que no haya terminado.
  if (!currentMatch || matchFinished) {
    appAlert("No hay un partido activo para registrar puntos.", "warning");
    return;
  }

  // Comprueba que el equipo recibido sea válido.
  if (team !== "home" && team !== "opponent") {
    return;
  }

  // Guarda el estado anterior antes de modificar el marcador.
  pointHistory.push({
    homeScore,
    opponentScore,
    homeSets,
    opponentSets,
    currentSet,
    matchFinished,
    setHistory: [...setHistory],
  });

  // Suma un punto al equipo correspondiente.
  if (team === "home") {
    homeScore++;
  } else {
    opponentScore++;
  }

  // Comprueba si el punto acaba de cerrar un set.
  checkSetWinner();

  // Guarda el marcador y el historial actualizado.
  saveMatchState();

  // Actualiza el marcador visible.
  updateScore();
}

function undoLastPoint() {
  // No permite deshacer puntos si no hay partido activo.
  if (!currentMatch || currentMatch.status !== "active") {
    appAlert("No hay un partido activo para deshacer puntos.", "warning");
    return;
  }

  // Comprueba si existe un punto anterior.
  if (pointHistory.length === 0) {
    appAlert("No hay puntos que se puedan deshacer.", "warning");
    return;
  }

  // Recupera el último estado guardado antes de sumar el punto.
  const previousState = pointHistory.pop();

  // Restaura el marcador.
  homeScore = previousState.homeScore;
  opponentScore = previousState.opponentScore;

  // Restaura los sets ganados.
  homeSets = previousState.homeSets;
  opponentSets = previousState.opponentSets;

  // Restaura el set actual y el estado del partido.
  currentSet = previousState.currentSet;
  matchFinished = previousState.matchFinished;

  // Restaura el historial de sets.
  setHistory = [...previousState.setHistory];

  // Guarda la corrección en localStorage.
  if (!saveMatchState()) {
    // Si no se pudo guardar, informa del problema.
    appAlert("No se pudo guardar la corrección del marcador.", "error");
    return;
  }

  // Actualiza el marcador y los botones.
  updateScore();

  // Confirma que el punto se deshizo.
  appAlert("Último punto deshecho correctamente.", "success");
}

/* ============================================================
   6. COMPROBAR QUIÉN GANÓ EL SET
   ============================================================ */

// Aplica las reglas de puntuación configuradas:
// sets 1 al 4: mínimo 25 puntos;
// set 5: mínimo 15 puntos;
// en todos los casos se necesita una ventaja de 2 puntos.
function checkSetWinner() {
  // El quinto set tiene un objetivo de 15 puntos.
  // Los demás sets tienen un objetivo de 25.
  const target = currentSet === 5 ? 15 : 25;

  // Almacena el nombre del equipo que ganó el set.
  let winner = "";

  // Comprueba si ganó el equipo local.
  if (homeScore >= target && homeScore - opponentScore >= 2) {
    homeSets++;
    winner = currentMatch.teamName;

    // Comprueba si ganó el equipo visitante.
  } else if (opponentScore >= target && opponentScore - homeScore >= 2) {
    opponentSets++;
    winner = currentMatch.opponentName || "Equipo visitante";
  }

  // Si nadie cumple las condiciones, el set continúa.
  if (!winner) {
    return;
  }

  // Añade al historial el número de set, el marcador
  // final y el nombre del equipo ganador.
  setHistory.push(
    `Set ${currentSet}: ${homeScore}-${opponentScore} (${winner})`,
  );

  // Un partido al mejor de cinco sets termina
  // cuando un equipo consigue tres sets ganados.
  if (homeSets === 3 || opponentSets === 3) {
    matchFinished = true;
    return;
  }

  // Si el partido continúa, prepara el siguiente set.
  currentSet++;

  // Reinicia los puntos, pero conserva el conteo de sets.
  homeScore = 0;
  opponentScore = 0;
}

/* ============================================================
   7. FINALIZAR EL PARTIDO
   ============================================================ */

// Solicita confirmación, guarda el resultado y cambia
// el estado del partido para conservarlo en el historial.
function finishMatch() {
  // Comprueba que exista un partido seleccionado.
  if (!currentMatch) {
    appAlert("No hay un partido activo.", "warning");
    return;
  }

  // Si todavía no hay ganador, pregunta si se desea
  // finalizar el partido de todas formas.
  if (!matchFinished) {
    const confirmed = confirm(
      "El partido todavía no tiene un ganador. ¿Quieres finalizarlo de todas formas?",
    );

    if (!confirmed) {
      return;
    }
  }

  // Solicita una segunda confirmación antes de finalizar.
  const finalConfirmation = confirm(
    `¿Finalizar ${currentMatch.teamName} vs. ${currentMatch.opponentName || "Equipo visitante"}? El encuentro quedará guardado en el historial.`,
  );

  if (!finalConfirmation) {
    return;
  }

  // Guarda el último estado antes de cerrar el partido.
  if (!saveMatchState()) {
    appAlert("No se pudo guardar el estado del partido.", "error");
    return;
  }

  // Comprueba que exista la función de cierre en storage.js.
  if (typeof closeActiveMatch !== "function") {
    appAlert(
      "No existe la función closeActiveMatch(). Revisa js/storage.js.",
      "error",
    );
    return;
  }

  // Cambia el estado del partido a "finished".
  if (!closeActiveMatch()) {
    appAlert("No se pudo finalizar el partido.", "error");
    return;
  }

  // Elimina la referencia al partido que estaba activo.
  currentMatch = null;

  // Actualiza la interfaz para mostrar que no hay
  // un partido activo y refresca el historial.
  initializeMatch();

  // --------------------------------------------------------
  // Actualizar los jugadores y las acciones de la interfaz.
  // Estas comprobaciones permiten evitar errores si alguna
  // variable o función todavía no existe.
  // --------------------------------------------------------

  if (typeof players !== "undefined") {
    players = [];
  }

  if (typeof showPlayers === "function") {
    showPlayers();
  }

  if (typeof actions !== "undefined") {
    actions = [];
  }

  if (typeof showActions === "function") {
    showActions();
  }

  // Actualiza las estadísticas generales del dashboard.
  if (typeof updateDashboard === "function") {
    updateDashboard();
  }

  // Informa que el encuentro terminó correctamente.
  appAlert("Partido finalizado y guardado en el historial.", "success");
}

/* ============================================================
   8. MOSTRAR EL HISTORIAL DE PARTIDOS
   ============================================================ */

// Carga los partidos almacenados y muestra únicamente
// aquellos cuyo estado sea "finished".
function showMatchHistory() {
  // Busca la lista HTML donde se mostrarán los partidos.
  const list = document.getElementById("matchHistory");

  // Si la lista no existe en esta página, termina la función.
  if (!list) {
    return;
  }

  // Limpia la lista para evitar mostrar elementos duplicados.
  list.innerHTML = "";

  // Recupera los datos guardados en localStorage.
  const data = loadData();

  // Filtra los partidos finalizados.
  data.matches
    .filter((match) => match.status === "finished")

    // Crea una copia del arreglo antes de invertirlo.
    // Así se muestran primero los partidos más recientes.
    .slice()
    .reverse()

    // Recorre cada partido finalizado.
    .forEach((match) => {
      // Crea un elemento <li> para la lista.
      const item = document.createElement("li");

      // Aplica clases de Bootstrap para el estilo.
      item.className = "list-group-item";

      // Escribe la fecha, los equipos y el resultado en sets.
      item.textContent =
        `${match.date}: ${match.teamName} ` +
        `${match.homeSets} - ${match.opponentSets} ` +
        `${match.opponentName || "Equipo visitante"}`;

      // Añade el elemento a la lista visible.
      list.appendChild(item);
    });
}

/* ============================================================
   9. CONECTAR LOS BOTONES CON LAS FUNCIONES
   ============================================================ */

// Cuando se hace clic en el botón del equipo local,
// registra un punto para el equipo local.
document
  .getElementById("homePointButton")
  ?.addEventListener("click", () => addPoint("home"));

// Cuando se hace clic en el botón del rival,
// registra un punto para el equipo visitante.
document
  .getElementById("opponentPointButton")
  ?.addEventListener("click", () => addPoint("opponent"));

// Cuando se hace clic en finalizar partido,
// ejecuta la función finishMatch().
document
  .getElementById("finishMatchButton")
  ?.addEventListener("click", finishMatch);

// Conecta el botón para deshacer el último punto del marcador.
document
  .getElementById("undoLastPointButton")
  ?.addEventListener("click", undoLastPoint);

/* ============================================================
   10. INICIAR EL ARCHIVO
   ============================================================ */

// Ejecuta la inicialización cuando el navegador llega
// a esta línea del archivo JavaScript.
initializeMatch();
