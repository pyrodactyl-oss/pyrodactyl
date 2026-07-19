<?php

/*
|--------------------------------------------------------------------------
| Líneas de idioma para administración de servidores
|--------------------------------------------------------------------------
|
| Contiene las cadenas de traducción de administración específicas
| de servidores para las vistas de gestión del panel de administración.
|
*/
return [
    'exceptions' => [
        'no_new_default_allocation' => 'Está intentando eliminar la asignación predeterminada para este servidor pero no hay una asignación alternativa disponible.',
        'marked_as_failed' => 'Este servidor fue marcado como fallido en una instalación anterior. El estado actual no se puede cambiar en este estado.',
        'bad_variable' => 'Hubo un error de validación con la variable :name.',
        'daemon_exception' => 'Hubo una excepción al intentar comunicarse con el daemon, resultando en un código de respuesta HTTP/:code. Esta excepción ha sido registrada. (id de solicitud: :request_id)',
        'default_allocation_not_found' => 'La asignación predeterminada solicitada no fue encontrada en las asignaciones de este servidor.',
    ],
    'alerts' => [
        'startup_changed' => 'La configuración de inicio de este servidor ha sido actualizada. Si el nest o egg de este servidor fue cambiado, se realizará una reinstalación ahora.',
        'server_deleted' => 'El servidor ha sido eliminado exitosamente del sistema.',
        'server_created' => 'El servidor fue creado exitosamente en el panel. Por favor, permita al daemon unos minutos para completar la instalación de este servidor.',
        'build_updated' => 'Los detalles de compilación de este servidor han sido actualizados. Algunos cambios pueden requerir un reinicio para surtir efecto.',
        'suspension_toggled' => 'El estado de suspensión del servidor ha sido cambiado a :status.',
        'rebuild_on_boot' => 'Este servidor ha sido marcado como que requiere una reconstrucción del contenedor Docker. Esto ocurrirá la próxima vez que se inicie el servidor.',
        'install_toggled' => 'El estado de instalación de este servidor ha sido cambiado.',
        'server_reinstalled' => 'Este servidor ha sido puesto en cola para una reinstalación que comienza ahora.',
        'details_updated' => 'Los detalles del servidor han sido actualizados exitosamente.',
        'docker_image_updated' => 'Se ha cambiado exitosamente la imagen Docker predeterminada para este servidor. Se requiere un reinicio para aplicar este cambio.',
        'node_required' => 'Debe tener al menos un nodo configurado antes de poder agregar un servidor a este panel.',
        'transfer_nodes_required' => 'Debe tener al menos dos nodos configurados antes de poder transferir servidores.',
        'transfer_started' => 'La transferencia del servidor ha comenzado.',
        'transfer_not_viable' => 'El nodo seleccionado no tiene el espacio en disco o la memoria disponible requerida para alojar este servidor.',
    ],
];
