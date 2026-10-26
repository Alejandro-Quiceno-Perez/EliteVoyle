
/*
 * ============================================================
 * REPORT.JS — INFORMES Y ESTADÍSTICAS
 * ============================================================
 *
 * Este archivo genera los informes de rendimiento de los partidos.
 *
 * Sus responsabilidades principales son:
 *
 * 1. Obtener los datos de los partidos guardados.
 * 2. Calcular las acciones positivas y negativas.
 * 3. Calcular porcentajes de efectividad.
 * 4. Comparar el rendimiento de los jugadores.
 * 5. Analizar los resultados por tipo de jugada y por set.
 * 6. Crear gráficas con la biblioteca Chart.js.
 * 7. Permitir descargar las gráficas como imágenes PNG.
 *
 * Dependencias:
 * - storage.js: proporciona loadData().
 * - Chart.js: permite crear las gráficas.
 *
 * El contenedor principal de los informes debe existir en el HTML
 * y tener el ID "reportContent".
 */


// Guarda las instancias de las gráficas creadas.
// Se necesita conservarlas para destruirlas antes de generar
// un nuevo informe y evitar que las gráficas se dupliquen.
let reportCharts = [];


/*
 * ============================================================
 * 1. GENERAR EL INFORME PRINCIPAL
 * ============================================================
 *
 * Esta función coordina todo el proceso de generación del informe:
 * recupera los datos, calcula las estadísticas y crea las gráficas.
 */
function generateReport() {

    // Busca en el HTML el elemento donde aparecerá el informe.
    const report = document.getElementById("reportContent");


    // --------------------------------------------------------
    // ELIMINAR LAS GRÁFICAS ANTERIORES
    // --------------------------------------------------------

    // destroy() libera cada instancia anterior de Chart.js.
    // Esto evita acumular gráficas si se vuelve a generar el informe.
    reportCharts.forEach(chart => chart.destroy());

    // Reinicia el arreglo para registrar las nuevas gráficas.
    reportCharts = [];

    // Limpia el contenido HTML del informe anterior.
    report.innerHTML = "";


    // --------------------------------------------------------
    // COMPROBAR QUE CHART.JS ESTÉ DISPONIBLE
    // --------------------------------------------------------

    // typeof permite comprobar si Chart está definido sin provocar
    // un error de referencia cuando la biblioteca no se ha cargado.
    if (typeof Chart === "undefined") {

        // Muestra un mensaje directamente en el contenedor del informe.
        report.textContent =
            "No se pudo cargar Chart.js. Revisa tu conexión a internet.";

        // return detiene la función porque no es posible crear gráficas.
        return;
    }


    // --------------------------------------------------------
    // RECUPERAR LOS DATOS Y SELECCIONAR EL PARTIDO
    // --------------------------------------------------------

    // loadData() está definido en storage.js.
    // Devuelve los partidos y el identificador del partido activo.
    const data = loadData();

    // Primero intenta encontrar el partido activo.
    // Si no existe, busca el último partido finalizado.
    const match =
        data.matches.find(
            item =>
                item.id === data.activeMatchId &&
                item.status === "active"
        ) ||
        [...data.matches]
            .reverse()
            .find(item => item.status === "finished");


    // Si no hay partido activo ni partidos finalizados,
    // no existe información para generar el informe.
    if (!match) {
        report.textContent =
            "No hay partidos disponibles para analizar.";

        return;
    }


    // --------------------------------------------------------
    // OBTENER JUGADORES Y JUGADAS DEL PARTIDO
    // --------------------------------------------------------

    // Recupera los jugadores del partido.
    // Si la propiedad no existe o es null/undefined, utiliza [].
    const players = match.players || [];

    // Recupera las acciones registradas durante el partido.
    const actions = match.actions || [];


    // --------------------------------------------------------
    // CREAR EL ENCABEZADO DEL INFORME
    // --------------------------------------------------------

    // createElement() crea un elemento HTML desde JavaScript.
    const heading = document.createElement("h3");

    // className asigna las clases de Bootstrap para el diseño.
    const headingClass = "h4 mb-3";
    heading.className = headingClass;

    // textContent introduce texto sin interpretarlo como HTML.
    heading.textContent =
        `Análisis de ${match.teamName} vs. ${match.opponentName}`;

    // Agrega el encabezado al contenedor del informe.
    report.appendChild(heading);


    // Crea un párrafo con la fecha y el resultado por sets.
    const description = document.createElement("p");

    description.textContent =
        `Fecha: ${match.date} | Resultado por sets: ` +
        `${match.homeSets} - ${match.opponentSets}`;

    // Inserta la descripción debajo del encabezado.
    report.appendChild(description);


    // --------------------------------------------------------
    // COMPROBAR SI HAY JUGADORES REGISTRADOS
    // --------------------------------------------------------

    // Sin jugadores no se puede realizar la comparación individual.
    if (players.length === 0) {

        // Crea y agrega un nodo de texto al informe.
        report.appendChild(
            document.createTextNode(
                "Este partido todavía no tiene jugadores registrados."
            )
        );

        // Finaliza la generación del informe.
        return;
    }


    // --------------------------------------------------------
    // CLASIFICAR LAS ACCIONES POR RESULTADO
    // --------------------------------------------------------

    // filter() crea un nuevo arreglo con las acciones positivas.
    // Se conserva únicamente el resultado "Positiva".
    const positiveActions = actions.filter(
        action => action.result === "Positiva"
    );

    // Crea otro arreglo con las acciones negativas.
    const negativeActions = actions.filter(
        action => action.result === "Negativa"
    );


    // --------------------------------------------------------
    // CALCULAR LAS ESTADÍSTICAS GENERALES
    // --------------------------------------------------------

    // Suma las acciones positivas y negativas.
    // Este total se utiliza como denominador de la efectividad.
    const total = positiveActions.length + negativeActions.length;

    // Calcula el porcentaje de acciones positivas.
    // Si no hay acciones clasificadas, evita dividir entre cero.
    const effectiveness = total > 0
        ? Math.round((positiveActions.length / total) * 100)
        : 0;


    // Muestra cuatro indicadores generales del partido.
    // addSummary() está definida más abajo en este archivo.
    addSummary(report, "Jugadas registradas", total);

    addSummary(report, "Acciones positivas", positiveActions.length);

    addSummary(report, "Acciones negativas", negativeActions.length);

    addSummary(report, "Efectividad general", `${effectiveness}%`);


    // ========================================================
    // 2. EFECTIVIDAD DEL EQUIPO POR SET
    // ========================================================

    // Agrega un título para la sección de estadísticas por set.
    addSectionTitle(report, "Efectividad del equipo por set");


    // --------------------------------------------------------
    // DETERMINAR CUÁNTOS SETS SE DEBEN MOSTRAR
    // --------------------------------------------------------

    // reduce() recorre las acciones y obtiene el número de set mayor.
    // Number() convierte el valor a número.
    // || 1 utiliza el set 1 si el valor convertido es 0 o NaN.
    const maxActionSet = actions.reduce(
        (max, action) =>
            Math.max(max, Number(action.set) || 1),
        1
    );

    // Determina el número máximo de sets que se deben representar.
    // Considera:
    // - Un mínimo de un set.
    // - La cantidad de sets del historial.
    // - El set más alto presente en las acciones.
    const maxSet = Math.max(
        1,
        (match.setHistory || []).length,
        maxActionSet
    );


    // --------------------------------------------------------
    // CREAR LAS ETIQUETAS DEL EJE HORIZONTAL
    // --------------------------------------------------------

    // Array.from() crea un arreglo con tantos elementos como indique
    // length. El segundo argumento genera la etiqueta de cada set.
    //
    // Ejemplo:
    // ["Set 1", "Set 2", "Set 3"]
    const setLabels = Array.from(
        { length: maxSet },
        (_, index) => `Set ${index + 1}`
    );


    // Estos arreglos almacenarán los porcentajes por set.
    const positivePerSet = [];
    const negativePerSet = [];


    // --------------------------------------------------------
    // CALCULAR LA EFECTIVIDAD DE CADA SET
    // --------------------------------------------------------

    // El ciclo analiza cada set desde el primero hasta maxSet.
    for (let set = 1; set <= maxSet; set++) {

        // Selecciona las acciones que pertenecen al set actual.
        const setActions = actions.filter(
            action => Number(action.set) === set
        );


        // Si no hay acciones en este set, agrega null.
        // Chart.js interpreta null como un dato ausente.
        if (setActions.length === 0) {
            positivePerSet.push(null);
            negativePerSet.push(null);

            // Continúa con el siguiente set.
            continue;
        }


        // Cuenta las acciones positivas del set actual.
        const positive = setActions.filter(
            action => action.result === "Positiva"
        ).length;

        // Cuenta las acciones negativas del set actual.
        const negative = setActions.filter(
            action => action.result === "Negativa"
        ).length;


        // Total de acciones clasificadas en este set.
        const total = positive + negative;


        // Calcula el porcentaje de acciones positivas.
        // Ejemplo: 8 positivas de 10 acciones = 80 %.
        positivePerSet.push(
            total ? Math.round((positive / total) * 100) : null
        );

        // Calcula el porcentaje de acciones negativas.
        // Ejemplo: 2 negativas de 10 acciones = 20 %.
        negativePerSet.push(
            total ? Math.round((negative / total) * 100) : null
        );
    }


    // --------------------------------------------------------
    // CREAR LA GRÁFICA DE EFECTIVIDAD POR SET
    // --------------------------------------------------------

    // addChart() crea una tarjeta y dibuja la gráfica con Chart.js.
    addChart(report, {
        title: "Efectividad porcentual por set",

        // "line" indica que será una gráfica de líneas.
        type: "line",

        data: {
            // Etiquetas del eje horizontal.
            labels: setLabels,

            // Cada dataset representa una serie de datos.
            datasets: [
                {
                    label: "Acciones positivas (%)",
                    data: positivePerSet,

                    // Colores utilizados para la línea y sus puntos.
                    borderColor: "#198754",
                    backgroundColor: "#198754",

                    // Radio de los puntos de la gráfica.
                    pointRadius: 5,

                    // Suaviza visualmente las líneas.
                    tension: 0.3,

                    // Evita conectar automáticamente los espacios
                    // donde hay datos ausentes.
                    spanGaps: false
                },
                {
                    label: "Acciones negativas (%)",
                    data: negativePerSet,
                    borderColor: "#dc3545",
                    backgroundColor: "#dc3545",
                    pointRadius: 5,
                    tension: 0.3,
                    spanGaps: false
                }
            ]
        },

        // Esta propiedad indica que el eje vertical representa
        // porcentajes y debe llegar hasta 100.
        percentage: true
    });


    // ========================================================
    // 3. IDENTIFICAR LOS TIPOS DE JUGADA REGISTRADOS
    // ========================================================

    // map() obtiene el tipo de cada acción.
    // Set elimina los valores repetidos.
    // El operador spread convierte el Set nuevamente en un arreglo.
    //
    // Ejemplo:
    // ["Saque", "Bloqueo", "Saque"] -> ["Saque", "Bloqueo"]
    const actionTypes = [...new Set(
        actions.map(action => action.type)
    )];


    // ========================================================
    // 4. COMPARAR EL RENDIMIENTO DE LOS JUGADORES
    // ========================================================

    addSectionTitle(report, "Comparativa entre jugadores");


    // Para cada jugador, cuenta sus acciones positivas.
    // La comparación se realiza mediante el número de camiseta.
    const playerPositive = players.map(player =>
        actions.filter(
            action =>
                action.playerNumber === player.number &&
                action.result === "Positiva"
        ).length
    );


    // Para cada jugador, cuenta sus acciones negativas.
    const playerNegative = players.map(player =>
        actions.filter(
            action =>
                action.playerNumber === player.number &&
                action.result === "Negativa"
        ).length
    );


    // Crea una gráfica de barras que compara los resultados
    // positivos y negativos de cada jugador.
    addChart(report, {
        title: "Acciones positivas y negativas por jugador",
        type: "bar",

        data: {
            // Cada etiqueta combina el nombre con el número
            // de camiseta para identificar al jugador.
            labels: players.map(
                player => `${player.name} (#${player.number})`
            ),

            datasets: [
                {
                    label: "Positivas",
                    data: playerPositive,
                    backgroundColor: "#198754"
                },
                {
                    label: "Negativas",
                    data: playerNegative,
                    backgroundColor: "#dc3545"
                }
            ]
        }
    });


    // ========================================================
    // 5. RENDIMIENTO GENERAL DEL EQUIPO
    // ========================================================

    addSectionTitle(report, "Rendimiento general del equipo");


    // Compara cuántas acciones positivas y negativas se registraron
    // para cada tipo de jugada en todo el partido.
    addChart(report, {
        title: "Fortalezas y falencias por tipo de jugada",
        type: "bar",

        data: {
            // Cada barra corresponde a un tipo de jugada.
            labels: actionTypes,

            datasets: [
                {
                    label: "Positivas",

                    // Cuenta las acciones que coinciden con el tipo
                    // de jugada actual y tienen resultado positivo.
                    data: actionTypes.map(type =>
                        actions.filter(
                            action =>
                                action.type === type &&
                                action.result === "Positiva"
                        ).length
                    ),

                    backgroundColor: "#198754"
                },
                {
                    label: "Negativas",

                    // Cuenta las acciones del tipo actual
                    // cuyo resultado fue negativo.
                    data: actionTypes.map(type =>
                        actions.filter(
                            action =>
                                action.type === type &&
                                action.result === "Negativa"
                        ).length
                    ),

                    backgroundColor: "#dc3545"
                }
            ]
        }
    });


    // ========================================================
    // 6. ANÁLISIS INDIVIDUAL DE CADA JUGADOR
    // ========================================================

    addSectionTitle(report, "Análisis individual");


    // Recorre el arreglo de jugadores.
    // Cada iteración genera una tarjeta con estadísticas propias.
    players.forEach(player => {

        // Obtiene todas las acciones registradas para este jugador.
        const playerActions = actions.filter(
            action => action.playerNumber === player.number
        );


        // Cuenta las acciones positivas del jugador.
        const positives = playerActions.filter(
            action => action.result === "Positiva"
        ).length;

        // Cuenta las acciones negativas del jugador.
        const negatives = playerActions.filter(
            action => action.result === "Negativa"
        ).length;


        // Suma las acciones positivas y negativas.
        const playerTotal = positives + negatives;


        // Calcula el porcentaje individual de efectividad.
        // Si el jugador todavía no tiene acciones clasificadas,
        // el porcentaje inicial será 0.
        const percentage = playerTotal > 0
            ? Math.round((positives / playerTotal) * 100)
            : 0;


        // ----------------------------------------------------
        // CREAR LA TARJETA DEL JUGADOR
        // ----------------------------------------------------

        // Crea el contenedor principal de la tarjeta.
        const card = document.createElement("div");

        // Las clases de Bootstrap controlan su apariencia y margen.
        card.className = "card mb-4";


        // Crea el cuerpo interior de la tarjeta.
        const body = document.createElement("div");
        body.className = "card-body";


        // Crea el título con el nombre y el número del jugador.
        const title = document.createElement("h4");
        title.className = "h5";

        title.textContent =
            `${player.name} (#${player.number})`;


        // Crea un párrafo con el resumen estadístico.
        const stats = document.createElement("p");

        stats.textContent =
            `Total: ${playerTotal} | Positivas: ${positives} | ` +
            `Negativas: ${negatives} | Efectividad: ${percentage}%`;


        // append() permite agregar varios nodos en una sola operación.
        body.append(title, stats);

        // Introduce el cuerpo dentro de la tarjeta.
        card.appendChild(body);

        // Inserta la tarjeta dentro del informe.
        report.appendChild(card);


        // ----------------------------------------------------
        // IDENTIFICAR LOS TIPOS DE JUGADA DEL JUGADOR
        // ----------------------------------------------------

        // Obtiene los tipos de jugada que este jugador registró,
        // eliminando las categorías repetidas.
        const playerTypes = [...new Set(
            playerActions.map(action => action.type)
        )];


        // ----------------------------------------------------
        // CREAR LA GRÁFICA INDIVIDUAL
        // ----------------------------------------------------

        addChart(body, {
            title: `Indicadores de ${player.name}`,
            type: "bar",

            data: {
                // Las categorías del eje horizontal son los tipos
                // de jugada que aparecen en el historial del jugador.
                labels: playerTypes,

                datasets: [
                    {
                        label: "Positivas",

                        // Cuenta las acciones positivas de cada tipo.
                        data: playerTypes.map(type =>
                            playerActions.filter(
                                action =>
                                    action.type === type &&
                                    action.result === "Positiva"
                            ).length
                        ),

                        backgroundColor: "#198754"
                    },
                    {
                        label: "Negativas",

                        // Cuenta las acciones negativas de cada tipo.
                        data: playerTypes.map(type =>
                            playerActions.filter(
                                action =>
                                    action.type === type &&
                                    action.result === "Negativa"
                            ).length
                        ),

                        backgroundColor: "#dc3545"
                    }
                ]
            }
        });


        // ----------------------------------------------------
        // DETECTAR ASPECTOS POR MEJORAR
        // ----------------------------------------------------

        // Construye una lista con la cantidad de errores
        // registrados en cada tipo de jugada.
        const weakness = playerTypes
            .map(type => ({
                // Nombre de la categoría.
                type,

                // Cantidad de acciones negativas de esa categoría.
                count: playerActions.filter(
                    action =>
                        action.type === type &&
                        action.result === "Negativa"
                ).length
            }))

            // Conserva solo las categorías con errores registrados.
            .filter(item => item.count > 0)

            // Ordena de mayor a menor cantidad de errores.
            .sort((a, b) => b.count - a.count);


        // ----------------------------------------------------
        // DETECTAR FORTALEZAS OBSERVADAS
        // ----------------------------------------------------

        // Construye una lista con la cantidad de acciones positivas
        // de cada tipo de jugada.
        const strengths = playerTypes
            .map(type => ({
                type,

                count: playerActions.filter(
                    action =>
                        action.type === type &&
                        action.result === "Positiva"
                ).length
            }))

            // Conserva únicamente los tipos con acciones positivas.
            .filter(item => item.count > 0)

            // Ordena de mayor a menor cantidad de acciones positivas.
            .sort((a, b) => b.count - a.count);


        // ----------------------------------------------------
        // MOSTRAR EL RESUMEN INDIVIDUAL
        // ----------------------------------------------------

        // Crea un párrafo para presentar la fortaleza principal
        // y el aspecto con más errores registrados.
        const feedback = document.createElement("p");
        feedback.className = "mt-3 mb-0";


        // strengths[0] representa el primer elemento de la lista
        // ordenada, es decir, la categoría con más acciones positivas.
        //
        // weakness[0] representa la categoría con más acciones negativas.
        //
        // El operador ?. permite acceder a una propiedad solo si
        // el elemento existe.
        //
        // El operador || proporciona un texto alternativo si el
        // resultado está vacío o no existe.
        feedback.textContent =
            `Fortaleza observada: ${strengths[0]?.type || "Sin datos"}. ` +
            `Aspecto por mejorar: ${weakness[0]?.type || "Sin errores registrados"}.`;


        // Añade el resumen al cuerpo de la tarjeta.
        body.appendChild(feedback);
    });
}


/*
 * ============================================================
 * 7. CREAR UNA TARJETA DE RESUMEN
 * ============================================================
 *
 * Parámetros:
 * container: elemento HTML donde se insertará la tarjeta.
 * label: texto que identifica la estadística.
 * value: valor numérico o texto que se quiere mostrar.
 *
 * Ejemplo:
 * addSummary(report, "Acciones positivas", 12);
 */
function addSummary(container, label, value) {

    // Crea el contenedor de la tarjeta.
    const card = document.createElement("div");

    // Aplica clases de Bootstrap para el espaciado.
    card.className = "card p-3 mb-3";


    // Crea el texto descriptivo de la estadística.
    const title = document.createElement("span");
    title.textContent = label;


    // Crea el elemento que muestra el resultado.
    const result = document.createElement("strong");

    // fs-4 aumenta el tamaño de la cifra mediante Bootstrap.
    result.className = "fs-4";
    result.textContent = value;


    // Agrega la etiqueta y el valor a la tarjeta.
    card.append(title, result);

    // Inserta la tarjeta en el contenedor recibido.
    container.appendChild(card);
}


/*
 * ============================================================
 * 8. CREAR UN TÍTULO DE SECCIÓN
 * ============================================================
 *
 * Esta función evita repetir el mismo código cada vez que se
 * necesita agregar un título dentro del informe.
 *
 * Parámetros:
 * container: lugar donde se agregará el título.
 * text: texto que aparecerá como encabezado.
 */
function addSectionTitle(container, text) {

    // Crea un encabezado HTML de nivel 3.
    const title = document.createElement("h3");

    // Asigna clases de Bootstrap para tamaño y espaciado.
    title.className = "h5 mt-4 mb-3";

    // Introduce el texto del encabezado.
    title.textContent = text;

    // Inserta el encabezado en el contenedor indicado.
    container.appendChild(title);
}


/*
 * ============================================================
 * 9. CREAR UNA GRÁFICA Y SU TARJETA
 * ============================================================
 *
 * Esta es la función reutilizable que construye todas las gráficas.
 *
 * Parámetros:
 * container: elemento HTML donde aparecerá la gráfica.
 * config: objeto con el título, tipo, datos y opciones.
 *
 * La función:
 * 1. Crea una tarjeta.
 * 2. Crea el título.
 * 3. Prepara un canvas para Chart.js.
 * 4. Añade el botón para descargar la gráfica.
 * 5. Crea la gráfica.
 * 6. Guarda su instancia para poder destruirla posteriormente.
 */
function addChart(container, config) {

    // --------------------------------------------------------
    // CREAR LA TARJETA Y EL TÍTULO
    // --------------------------------------------------------

    // Contenedor visual de la gráfica.
    const card = document.createElement("div");
    card.className = "card p-3 mb-4";


    // Encabezado que identifica el contenido de la gráfica.
    const heading = document.createElement("h4");
    heading.className = "h6";
    heading.textContent = config.title;


    // --------------------------------------------------------
    // PREPARAR EL ESPACIO DE LA GRÁFICA
    // --------------------------------------------------------

    // Crea un contenedor para controlar las dimensiones del canvas.
    const canvasContainer = document.createElement("div");

    // position: relative permite que Chart.js calcule el tamaño
    // de la gráfica con respecto a este contenedor.
    canvasContainer.style.position = "relative";

    // Define una altura de 300 píxeles para el área de la gráfica.
    canvasContainer.style.height = "300px";


    // canvas es el elemento HTML sobre el que Chart.js dibuja.
    const canvas = document.createElement("canvas");

    // Introduce el canvas en su contenedor.
    canvasContainer.appendChild(canvas);


    // --------------------------------------------------------
    // CREAR EL BOTÓN PARA DESCARGAR LA GRÁFICA
    // --------------------------------------------------------

    const download = document.createElement("button");

    // Especifica que el botón no debe enviar formularios.
    download.type = "button";

    // Clases de Bootstrap para la apariencia y el margen.
    download.className = "btn btn-outline-primary mt-3";

    // Texto visible del botón.
    download.textContent = "Descargar gráfica PNG";


    // --------------------------------------------------------
    // PROGRAMAR LA DESCARGA DE LA IMAGEN
    // --------------------------------------------------------

    // addEventListener ejecuta esta función cuando el usuario
    // hace clic en el botón de descarga.
    download.addEventListener("click", function () {

        // Crea un enlace HTML temporal.
        const link = document.createElement("a");


        // Define el nombre del archivo descargado.
        // toLowerCase() convierte el título a minúsculas.
        // replace() sustituye grupos de caracteres no alfanuméricos
        // por guiones para generar un nombre de archivo más limpio.
        link.download =
            config.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") + ".png";


        // toDataURL() convierte el contenido del canvas en una
        // imagen PNG codificada como una URL de datos.
        link.href = canvas.toDataURL("image/png");


        // Simula un clic en el enlace para iniciar la descarga.
        link.click();
    });


    // --------------------------------------------------------
    // AGREGAR LOS ELEMENTOS A LA PÁGINA
    // --------------------------------------------------------

    // Introduce el título, el área de la gráfica y el botón
    // dentro de la tarjeta.
    card.append(heading, canvasContainer, download);

    // Inserta la tarjeta completa en el contenedor del informe.
    container.appendChild(card);


    // --------------------------------------------------------
    // CREAR LA GRÁFICA CON CHART.JS
    // --------------------------------------------------------

    // new Chart() crea la gráfica sobre el canvas.
    // config contiene el tipo de gráfica y los datos que se dibujarán.
    const chart = new Chart(canvas, {
        type: config.type,
        data: config.data,

        options: {

            // Adapta la gráfica al tamaño disponible.
            responsive: true,

            // Desactiva la proporción automática para respetar
            // la altura definida en canvasContainer.
            maintainAspectRatio: false,

            // Configura cómo interactúa el usuario con los datos.
            interaction: {
                // No exige que el cursor esté exactamente sobre
                // un punto para mostrar la información relacionada.
                intersect: false,

                // Compara los datos que comparten la misma posición
                // en el eje horizontal.
                mode: "index"
            },


            // ------------------------------------------------
            // CONFIGURAR EL EJE VERTICAL
            // ------------------------------------------------

            scales: {
                y: {

                    // El eje comienza en cero.
                    beginAtZero: true,

                    // Si la gráfica representa porcentajes,
                    // el valor máximo del eje será 100.
                    // En otras gráficas, Chart.js calcula el máximo.
                    max: config.percentage ? 100 : undefined,

                    ticks: {

                        // Evita mostrar valores decimales en las marcas.
                        precision: 0,

                        // Si la gráfica representa porcentajes,
                        // agrega el símbolo % a cada marca del eje.
                        // En las demás gráficas no aplica un formato.
                        callback: config.percentage
                            ? value => `${value}%`
                            : undefined
                    }
                }
            },


            // ------------------------------------------------
            // CONFIGURAR LA LEYENDA
            // ------------------------------------------------

            plugins: {
                legend: {

                    // Ubica la leyenda debajo de la gráfica.
                    // La leyenda identifica las series de datos.
                    position: "bottom"
                }
            }
        }
    });


    // Guarda la instancia de Chart.js.
    // generateReport() utilizará este arreglo para destruir
    // las gráficas anteriores antes de crear un nuevo informe.
    reportCharts.push(chart);
}
