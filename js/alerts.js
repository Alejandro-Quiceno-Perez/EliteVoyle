
/*
 * ============================================================
 * ARCHIVO: alerts.js
 * PROPÓSITO: Centralizar las alertas y confirmaciones.
 *
 * RESPONSABILIDADES:
 * - Mostrar mensajes de éxito.
 * - Mostrar mensajes de error.
 * - Mostrar advertencias e información.
 * - Solicitar confirmación antes de realizar una acción.
 *
 * DEPENDENCIA:
 * - SweetAlert2: biblioteca externa que crea las ventanas
 *   emergentes personalizadas.
 *
 * IMPORTANTE:
 * - SweetAlert2 debe cargarse antes de este archivo.
 * - Los demás archivos pueden utilizar appAlert() y appConfirm().
 * ============================================================
 */


/* ============================================================
   1. MOSTRAR UNA ALERTA
   ============================================================ */

// Recibe el mensaje que se mostrará y el tipo de alerta.
// Si no se especifica un tipo, utiliza "info".
function appAlert(message, type = "info") {

    // Relaciona cada tipo de alerta con el icono
    // que mostrará SweetAlert2.
    const icons = {
        success: "success",
        error: "error",
        warning: "warning",
        info: "info"
    };


    // Abre la ventana emergente de SweetAlert2.
    // La función devuelve la promesa de Swal.fire().
    return Swal.fire({

        // Selecciona el título según el tipo de alerta.
        // Si el tipo no existe en el objeto, muestra
        // el título predeterminado "Información".
        title: {
            success: "¡Listo!",
            error: "Ha ocurrido un error",
            warning: "Atención",
            info: "Información"
        }[type] || "Información",

        // Texto principal que se mostrará en la ventana.
        text: message,

        // Selecciona el icono correspondiente al tipo.
        // Si el tipo no está definido, utiliza el icono info.
        icon: icons[type] || "info",

        // Color de fondo de la ventana emergente.
        background: "#1b2834",

        // Color del texto de la ventana.
        color: "#f4f7fa",

        // Color del botón para cerrar la alerta.
        confirmButtonColor: "#00a135",

        // Texto que aparecerá en el botón principal.
        confirmButtonText: "Entendido",

        // Permite asignar una clase CSS personalizada
        // al botón de confirmación.
        customClass: {
            confirmButton: "alert-confirm-button"
        }
    });
}


/* ============================================================
   2. SOLICITAR CONFIRMACIÓN AL USUARIO
   ============================================================ */

// Muestra una ventana con dos opciones:
// - Confirmar la acción.
// - Cancelar la acción.
//
// Es una función asíncrona porque debe esperar
// la respuesta del usuario antes de continuar.
async function appConfirm(
    message,
    title = "¿Estás seguro?"
) {

    // Abre la ventana de confirmación y espera
    // la respuesta mediante await.
    const result = await Swal.fire({

        // Título de la ventana.
        // Puede recibirse como argumento o utilizar
        // el título predeterminado.
        title,

        // Mensaje que explica qué acción se va a realizar.
        text: message,

        // Icono de pregunta para indicar que se requiere
        // una decisión del usuario.
        icon: "question",

        // Colores de fondo y texto de la ventana.
        background: "#1b2834",
        color: "#fafaf4",

        // Muestra el botón para cancelar.
        showCancelButton: true,

        // Texto del botón que confirma la acción.
        confirmButtonText: "Sí, continuar",

        // Texto del botón para cancelar.
        cancelButtonText: "Cancelar",

        // Color del botón de confirmación.
        confirmButtonColor: "#00a135",

        // Color del botón de cancelación.
        cancelButtonColor: "#ca0000",

        // Invierte el orden visual de los botones.
        reverseButtons: true
    });


    // Devuelve true si el usuario confirmó.
    // Devuelve false si canceló o cerró la ventana
    // sin confirmar la acción.
    return result.isConfirmed;
}
