
/*
 * ============================================================
 * PLAYERS.JS — GESTIÓN DE PARTIDOS Y JUGADORES
 * ============================================================
 *
 * Este archivo se encarga de:
 *
 * 1. Obtener los elementos HTML relacionados con los jugadores.
 * 2. Crear nuevos partidos.
 * 3. Registrar jugadores en el partido activo.
 * 4. Validar los nombres y números de camiseta.
 * 5. Mostrar la lista de jugadores en pantalla.
 * 6. Actualizar el selector utilizado para registrar jugadas.
 *
 * Dependencias:
 * - storage.js: proporciona loadPlayers(), savePlayers(),
 *   getActiveMatch() y createMatch().
 * - actions.js: utiliza los jugadores para registrar sus jugadas.
 * - match.js: inicializa la interfaz del partido.
 * - alerts.js: proporciona appAlert().
 */


/*
 * ============================================================
 * 1. OBTENER LOS ELEMENTOS DEL HTML
 * ============================================================
 *
 * getElementById() busca un elemento HTML por su atributo id.
 * Estas variables permiten acceder a los campos y a la lista
 * sin tener que buscarlos nuevamente en cada función.
 */

// Campo donde se escribe el nombre del jugador.
const playerName = document.getElementById("playerName");

// Campo donde se escribe el número de camiseta.
const playerNumber = document.getElementById("playerNumber");

// Lista HTML donde aparecerán los jugadores registrados.
const playerList = document.getElementById("playerList");

// Campo donde se escribe el nombre de nuestro equipo.
const teamInput = document.getElementById("team");

// Botón que permite crear un partido nuevo.
const createMatchButton = document.getElementById("createMatchButton");


/*
 * ============================================================
 * 2. CARGAR LOS JUGADORES GUARDADOS
 * ============================================================
 *
 * loadPlayers() está definida en storage.js.
 *
 * Recupera los jugadores del partido activo.
 * Si no existe un partido activo, devuelve un arreglo vacío.
 *
 * let permite reasignar la variable cuando se crea un partido
 * nuevo y es necesario reiniciar la lista de jugadores.
 */
let players = loadPlayers();


/*
 * ============================================================
 * 3. CREAR UN PARTIDO NUEVO
 * ============================================================
 *
 * addEventListener() escucha los clics sobre el botón de crear
 * partido y ejecuta la función que se encuentra dentro.
 */
createMatchButton.addEventListener("click", function () {

  // Recupera el nombre del equipo y elimina espacios
  // innecesarios al principio y al final.
  const teamName = teamInput.value.trim();

  // Busca el campo donde se escribe el nombre del rival.
  const opponentInput = document.getElementById("opponentTeam");

  // Recupera y limpia el nombre del equipo contrario.
  const opponentName = opponentInput.value.trim();


  // ----------------------------------------------------------
  // VALIDAR LOS NOMBRES DE LOS EQUIPOS
  // ----------------------------------------------------------

  // Si alguno de los nombres está vacío, muestra una advertencia.
  // El operador || significa "o".
  if (!teamName || !opponentName) {
    appAlert(
      "Escribe el nombre del equipo local y del rival.",
      "warning"
    );

    // return detiene la ejecución para evitar crear un partido
    // con información incompleta.
    return;
  }


  // ----------------------------------------------------------
  // CREAR EL PARTIDO EN EL ALMACENAMIENTO
  // ----------------------------------------------------------

  // createMatch() está definida en storage.js.
  // Recibe los nombres de los dos equipos.
  const match = createMatch(teamName, opponentName);

  // Si no se pudo crear el partido, termina esta función.
  // Por ejemplo, podría existir otro partido activo.
  if (!match) return;


  // ----------------------------------------------------------
  // REINICIAR LOS DATOS DE LA INTERFAZ
  // ----------------------------------------------------------

  // El partido nuevo comienza sin jugadores registrados.
  players = [];

  // Reinicia la lista de jugadas de la interfaz.
  // actions es una variable definida en actions.js.
  actions = [];

  // Actualiza la lista visible de jugadores.
  showPlayers();

  // Actualiza el historial de jugadas.
  showActions();


  // ----------------------------------------------------------
  // LIMPIAR LOS CAMPOS DEL FORMULARIO
  // ----------------------------------------------------------

  // Deja los campos vacíos para facilitar la creación
  // de un próximo partido.
  teamInput.value = "";
  opponentInput.value = "";


  // ----------------------------------------------------------
  // INICIALIZAR LA INTERFAZ DEL PARTIDO
  // ----------------------------------------------------------

  // initializeMatch() está definida en match.js.
  // Carga el estado del nuevo partido y actualiza el marcador.
  initializeMatch();


  // Informa al usuario que el partido se creó correctamente.
  appAlert("Partido creado correctamente.", "success");
});


/*
 * ============================================================
 * 4. REGISTRAR UN JUGADOR
 * ============================================================
 *
 * Esta función valida los datos de un jugador y lo incorpora
 * al partido activo.
 *
 * Para registrar un jugador se necesita:
 * - Tener un partido activo.
 * - Escribir un nombre.
 * - Escribir un número de camiseta válido.
 * - No repetir el número de camiseta.
 */
function addPlayer() {

  // Obtiene el partido que se encuentra activo.
  const match = getActiveMatch();


  // ----------------------------------------------------------
  // VALIDAR QUE EXISTA UN PARTIDO ACTIVO
  // ----------------------------------------------------------

  // No se permite registrar jugadores sin un partido activo.
  if (!match || match.status !== "active") {
    appAlert("Primero debes crear un partido.", "warning");
    return;
  }


  // ----------------------------------------------------------
  // RECUPERAR LOS DATOS DEL FORMULARIO
  // ----------------------------------------------------------

  // Lee el nombre y elimina los espacios externos.
  const name = playerName.value.trim();

  // Recupera el número como texto.
  // Se conserva el texto original para comprobar si el campo
  // estaba vacío antes de convertirlo a número.
  const numberText = playerNumber.value.trim();

  // Number() convierte el texto en un valor numérico.
  const number = Number(numberText);


  // ----------------------------------------------------------
  // VALIDAR QUE LOS CAMPOS ESTÉN COMPLETOS
  // ----------------------------------------------------------

  // Si el nombre o el número están vacíos, muestra una advertencia.
  if (name === "" || numberText === "") {
    appAlert(
      "Completa el nombre y el número del jugador.",
      "warning"
    );

    return;
  }


  // ----------------------------------------------------------
  // VALIDAR EL NÚMERO DE CAMISETA
  // ----------------------------------------------------------

  // Number.isInteger() comprueba que el valor sea un entero.
  // number < 0 impide registrar números negativos.
  //
  // Esta validación permite el número 0, porque la condición
  // comprueba que sea menor que cero y no menor o igual a cero.
  if (!Number.isInteger(number) || number < 0) {
    appAlert(
      "Ingresa un número de camiseta válido.",
      "warning"
    );

    return;
  }


  // ----------------------------------------------------------
  // EVITAR NÚMEROS DE CAMISETA DUPLICADOS
  // ----------------------------------------------------------

  // some() devuelve true si al menos un jugador cumple
  // la condición indicada.
  //
  // En este caso, comprueba si otro jugador ya utiliza
  // el número que se intenta registrar.
  const duplicated = players.some(
    (player) => player.number === number
  );

  // Si el número ya existe, no registra al jugador.
  if (duplicated) {
    appAlert(
      "Ese número de camiseta ya está registrado.",
      "warning"
    );

    return;
  }


  // ----------------------------------------------------------
  // AGREGAR EL JUGADOR AL ARREGLO
  // ----------------------------------------------------------

  // push() agrega un nuevo objeto al final del arreglo players.
  //
  // Cada jugador se representa mediante un objeto con
  // dos propiedades: name y number.
  players.push({
    name: name,
    number: number,
  });


  // ----------------------------------------------------------
  // GUARDAR Y ACTUALIZAR LOS DATOS
  // ----------------------------------------------------------

  // Guarda el arreglo de jugadores dentro del partido activo.
  // savePlayers() está definida en storage.js.
  savePlayers(players);

  // Actualiza la lista visible de jugadores.
  showPlayers();


  // ----------------------------------------------------------
  // ACTUALIZAR EL MÓDULO DE JUGADAS
  // ----------------------------------------------------------

  // typeof permite comprobar que la función exista antes de llamarla.
  // Esto evita un error si el módulo no está disponible.
  if (typeof showActionPlayers === "function") {

    // Actualiza los jugadores que se pueden seleccionar
    // para registrar una jugada.
    showActionPlayers();
  }


  // Comprueba si existe la función loadActions().
  if (typeof loadActions === "function") {

    // Recarga los datos de las jugadas para mantener
    // actualizada la interfaz.
    loadActions();
  }


  // ----------------------------------------------------------
  // LIMPIAR EL FORMULARIO DESPUÉS DEL REGISTRO
  // ----------------------------------------------------------

  // Limpia los dos campos.
  playerName.value = "";
  playerNumber.value = "";

  // focus() coloca el cursor nuevamente en el campo del nombre.
  // Así se facilita registrar al siguiente jugador.
  playerName.focus();
}


/*
 * ============================================================
 * 5. MOSTRAR LOS JUGADORES
 * ============================================================
 *
 * Esta función construye la lista visible de jugadores.
 *
 * Primero elimina los elementos existentes y después crea
 * un elemento HTML por cada jugador del arreglo players.
 */
function showPlayers() {

  // Limpia el contenido anterior de la lista.
  // Esto evita que los jugadores aparezcan duplicados
  // cada vez que se actualiza la interfaz.
  playerList.innerHTML = "";


  // forEach() ejecuta una función por cada jugador del arreglo.
  players.forEach((player) => {

    // Crea un elemento de lista <li>.
    const item = document.createElement("li");

    // Asigna clases de Bootstrap:
    // list-group-item: apariencia de elemento de lista.
    // d-flex: utiliza Flexbox.
    // justify-content-between: distribuye los elementos
    // a los extremos del contenedor.
    item.className = "list-group-item d-flex justify-content-between";


    // Muestra el nombre y el número de camiseta.
    // La plantilla literal utiliza ${} para insertar variables.
    item.textContent =
      `${player.name} - Camiseta ${player.number}`;


    // Agrega el elemento <li> dentro de la lista de jugadores.
    playerList.appendChild(item);
  });


  // Actualiza también el selector que se utiliza para
  // asociar una jugada con un jugador.
  updatePlayerOptions();
}


/*
 * ============================================================
 * 6. ACTUALIZAR EL SELECTOR DE JUGADORES
 * ============================================================
 *
 * El selector HTML con ID "actionPlayer" permite elegir
 * qué jugador realizó una acción durante el partido.
 *
 * Esta función reconstruye sus opciones usando el arreglo players.
 */
function updatePlayerOptions() {

  // Busca el selector en el documento HTML.
  const selector = document.getElementById("actionPlayer");


  // Si el selector no existe en el HTML, termina la función.
  // El operador ! significa "no".
  if (!selector) {
    return;
  }


  // Elimina las opciones anteriores y deja una opción inicial.
  // Esta opción invita al usuario a seleccionar un jugador.
  selector.innerHTML =
    '<option value="">Seleccionar jugador</option>';


  // Crea una opción para cada jugador registrado.
  players.forEach((player) => {

    // Crea un elemento HTML <option>.
    const option = document.createElement("option");


    // El valor interno de la opción será el número de camiseta.
    // El módulo de jugadas puede utilizarlo para identificar
    // al jugador seleccionado.
    option.value = player.number;


    // El texto visible muestra el nombre y el número.
    option.textContent =
      `${player.name} (#${player.number})`;


    // Agrega la opción al selector.
    selector.appendChild(option);
  });
}


/*
 * ============================================================
 * 7. CONECTAR EL BOTÓN DE REGISTRO
 * ============================================================
 *
 * Cuando el usuario hace clic en el botón con ID
 * "addPlayerButton", se ejecuta addPlayer().
 *
 * El botón debe existir en index.html.
 */
document.getElementById("addPlayerButton")
  .addEventListener("click", addPlayer);


/*
 * ============================================================
 * 8. MOSTRAR LOS JUGADORES AL CARGAR EL ARCHIVO
 * ============================================================
 *
 * Ejecuta showPlayers() para que la lista aparezca actualizada
 * al cargar la página, utilizando los jugadores recuperados
 * mediante loadPlayers().
 */
showPlayers();
