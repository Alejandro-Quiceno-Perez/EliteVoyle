
/*
 * ============================================================
 * STORAGE.JS — ALMACENAMIENTO DE DATOS
 * ============================================================
 *
 * Este archivo administra los datos de la aplicación utilizando
 * localStorage del navegador.
 *
 * localStorage permite guardar información en el navegador para
 * que los datos sigan disponibles después de recargar la página
 * o cerrar y volver a abrir el navegador.
 *
 * Los datos se guardan en formato JSON.
 *
 * Estructura general de los datos:
 *
 * {
 *   matches: [],       // Lista de partidos registrados.
 *   activeMatchId: null // ID del partido que está activo.
 * }
 *
 * Este archivo centraliza las operaciones de lectura, escritura,
 * creación y finalización de partidos.
 */

// Nombre de la clave con la que se almacenarán los datos.
// localStorage utiliza esta clave para identificar la información.
const STORAGE_KEY = "volleyData";


/*
 * ============================================================
 * 1. CARGAR LOS DATOS
 * ============================================================
 *
 * Lee la información almacenada en localStorage y la convierte
 * de JSON a un objeto de JavaScript.
 *
 * Retorna un objeto con los partidos y el ID del partido activo.
 */
function loadData() {
  // Busca los datos guardados usando la clave de la aplicación.
  const savedData = localStorage.getItem(STORAGE_KEY);

  // Si no existe información guardada, devuelve la estructura
  // inicial de la aplicación para evitar errores.
  if (!savedData) {
    return { matches: [], activeMatchId: null };
  }

  try {
    // JSON.parse convierte el texto JSON en un objeto de JavaScript.
    const data = JSON.parse(savedData);

    // Comprueba que matches sea un arreglo.
    // Si no lo es, utiliza un arreglo vacío.
    // El operador ?? utiliza null cuando activeMatchId es null
    // o undefined.
    return {
      matches: Array.isArray(data.matches) ? data.matches : [],
      activeMatchId: data.activeMatchId ?? null,
    };
  } catch {
    // Si el contenido guardado no es un JSON válido, informa
    // del problema y devuelve una estructura inicial.
    appAlert("No se pudieron leer los datos guardados.", "error");

    return { matches: [], activeMatchId: null };
  }
}


/*
 * ============================================================
 * 2. GUARDAR LOS DATOS
 * ============================================================
 *
 * Recibe un objeto con la información de la aplicación,
 * lo convierte a texto JSON y lo almacena en localStorage.
 */
function saveData(data) {
  // JSON.stringify convierte el objeto de JavaScript en texto JSON.
  // localStorage almacena los valores como cadenas de texto.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


/*
 * ============================================================
 * 3. OBTENER EL PARTIDO ACTIVO
 * ============================================================
 *
 * Busca el partido cuyo ID coincide con activeMatchId y cuyo
 * estado es "active".
 *
 * Si encuentra un partido que cumple ambas condiciones,
 * devuelve ese partido.
 *
 * Si no existe, devuelve null.
 */
function getActiveMatch() {
  // Carga la información actual de la aplicación.
  const data = loadData();

  // find() devuelve el primer elemento que cumple la condición.
  // Se comprueban tanto el ID como el estado del partido.
  return (
    data.matches.find(
      (match) => match.id === data.activeMatchId && match.status === "active",
    ) || null
  );
}


/*
 * ============================================================
 * 4. ACTUALIZAR Y GUARDAR UN PARTIDO
 * ============================================================
 *
 * Recibe un partido modificado y actualiza su versión guardada.
 *
 * Es importante porque un partido puede cambiar durante el juego:
 * marcador, sets, jugadores, jugadas e historial.
 *
 * Devuelve true si pudo guardar el partido o false si no lo encontró.
 */
function saveActiveMatch(match) {
  // Obtiene todos los datos guardados.
  const data = loadData();

  // Busca la posición del partido dentro del arreglo matches.
  // findIndex() devuelve -1 cuando no encuentra coincidencias.
  const index = data.matches.findIndex((item) => item.id === match.id);

  // Si el partido no existe en el arreglo, no hay nada que actualizar.
  if (index === -1) return false;

  // Guarda una referencia al partido que ya estaba almacenado.
  const savedMatch = data.matches[index];

  // Sustituye el partido guardado por una versión actualizada.
  data.matches[index] = {
    // Copia primero las propiedades del partido anterior.
    ...savedMatch,

    // Después incorpora las propiedades del partido recibido.
    // Si una propiedad existe en ambos objetos, prevalece la nueva.
    ...match,

    // Conserva los jugadores anteriores si el objeto recibido
    // no incluye la propiedad players o si su valor es null/undefined.
    players: match.players ?? savedMatch.players ?? [],

    // Aplica la misma protección a las jugadas registradas.
    actions: match.actions ?? savedMatch.actions ?? [],
  };

  // Persiste los cambios en localStorage.
  saveData(data);

  // Confirma que la actualización se realizó.
  return true;
}


/*
 * ============================================================
 * 5. CREAR UN PARTIDO
 * ============================================================
 *
 * Recibe el nombre de nuestro equipo y el del equipo contrario.
 *
 * Antes de crear el partido, comprueba que no haya otro activo.
 * Si todo está correcto, crea un nuevo objeto con los valores
 * iniciales y lo guarda en la aplicación.
 *
 * Devuelve el partido creado o null si no puede crearlo.
 */
function createMatch(teamName, opponentName) {
  // Carga la información actual.
  const data = loadData();

  // Evita que haya dos partidos activos simultáneamente.
  if (getActiveMatch()) {
    appAlert("Finaliza el partido actual antes de crear otro.", "warning");
    return null;
  }

  // Crea el objeto que representa el nuevo partido.
  const match = {
    // Date.now() genera un identificador basado en la fecha y hora
    // actual expresada en milisegundos.
    id: Date.now(),

    // Datos generales del partido.
    teamName,
    opponentName,

    // Guarda la fecha de creación con el formato regional colombiano.
    date: new Date().toLocaleDateString("es-CO"),

    // El partido comienza activo.
    status: "active",

    // Arreglos para almacenar jugadores, jugadas e historial de sets.
    players: [],
    actions: [],

    // Marcador inicial de ambos equipos.
    homeScore: 0,
    opponentScore: 0,

    // Cantidad de sets ganados por cada equipo.
    homeSets: 0,
    opponentSets: 0,

    // El partido comienza en el primer set.
    currentSet: 1,

    // Historial de los sets finalizados.
    setHistory: [],

    
  };

  // Agrega el nuevo partido al arreglo de partidos.
  data.matches.push(match);

  // Registra el ID del partido que acaba de crearse.
  data.activeMatchId = match.id;

  // Guarda la información actualizada.
  saveData(data);

  // Devuelve el objeto para que otras funciones puedan utilizarlo.
  return match;
}


/*
 * ============================================================
 * 6. FINALIZAR EL PARTIDO ACTIVO
 * ============================================================
 *
 * Cambia el estado del partido de "active" a "finished".
 * También registra la fecha y hora de finalización y elimina
 * la referencia al partido activo.
 *
 * Devuelve true si finalizó el partido o false si no había
 * un partido activo válido.
 */
function closeActiveMatch() {
  // Carga los datos de la aplicación.
  const data = loadData();

  // Busca el partido cuyo ID corresponde al partido activo.
  const match = data.matches.find((item) => item.id === data.activeMatchId);

  // Comprueba que el partido exista y siga activo.
  if (!match || match.status !== "active") {
    return false;
  }

  // Actualiza el estado para indicar que el partido terminó.
  match.status = "finished";

  // Registra la fecha y hora de finalización.
  match.finishedAt = new Date().toLocaleString("es-CO");

  // Ya no hay un partido activo seleccionado.
  // El partido finalizado continúa guardado en matches.
  data.activeMatchId = null;

  // Persiste los cambios.
  saveData(data);

  // Informa que la operación se completó correctamente.
  return true;
}


/*
 * ============================================================
 * 7. GUARDAR LOS JUGADORES
 * ============================================================
 *
 * Recibe el arreglo de jugadores y lo almacena dentro del partido
 * activo, no en una lista independiente.
 *
 * Si no hay un partido activo, devuelve false.
 */
function savePlayers(players) {
  // Obtiene el partido activo.
  const match = getActiveMatch();

  // Sin partido activo no se pueden guardar sus jugadores.
  if (!match) return false;

  // Actualiza la lista de jugadores del partido.
  match.players = players;

  // Guarda el partido completo con la lista actualizada.
  // Devuelve el resultado de saveActiveMatch().
  return saveActiveMatch(match);
}


/*
 * ============================================================
 * 8. CARGAR LOS JUGADORES
 * ============================================================
 *
 * Obtiene la lista de jugadores del partido activo.
 *
 * Si hay un partido activo, devuelve su arreglo de jugadores.
 * Si no hay partido activo, devuelve un arreglo vacío.
 */
function loadPlayers() {
  // Busca el partido que está activo actualmente.
  const match = getActiveMatch();

  // Devuelve sus jugadores o un arreglo vacío si no hay partido.
  return match ? match.players : [];
}
