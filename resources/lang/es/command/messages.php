<?php

/*
|--------------------------------------------------------------------------
| Líneas de idioma para comandos de consola
|--------------------------------------------------------------------------
|
| Contiene todas las cadenas de traducción de comandos
| de consola para los comandos Artisan CLI.
|
*/
return [
    'location' => [
        'no_location_found' => 'No se pudo encontrar un registro que coincida con el código corto proporcionado.',
        'ask_short' => 'Código Corto de Ubicación',
        'ask_long' => 'Descripción de Ubicación',
        'created' => 'Se ha creado exitosamente una nueva ubicación (:name) con ID :id.',
        'deleted' => 'Se ha eliminado exitosamente la ubicación solicitada.',
    ],
    'user' => [
        'search_users' => 'Ingrese un Nombre de Usuario, ID de Usuario o Dirección de Correo Electrónico',
        'select_search_user' => 'ID del usuario a eliminar (Ingrese \'0\' para buscar nuevamente)',
        'deleted' => 'Usuario eliminado exitosamente del Panel.',
        'confirm_delete' => '¿Está seguro de que desea eliminar este usuario del Panel?',
        'no_users_found' => 'No se encontraron usuarios para el término de búsqueda proporcionado.',
        'multiple_found' => 'Se encontraron múltiples cuentas para el usuario proporcionado, no se puede eliminar un usuario debido a la bandera --no-interaction.',
        'ask_admin' => '¿Es este usuario un administrador?',
        'ask_email' => 'Dirección de Correo Electrónico',
        'ask_username' => 'Nombre de Usuario',
        'ask_name_first' => 'Nombre',
        'ask_name_last' => 'Apellido',
        'ask_password' => 'Contraseña',
        'ask_password_tip' => 'Si desea crear una cuenta con una contraseña aleatoria enviada por correo al usuario, vuelva a ejecutar este comando (CTRL+C) y pase la bandera `--no-password`.',
        'ask_password_help' => 'Las contraseñas deben tener al menos 8 caracteres de longitud y contener al menos una letra mayúscula y un número.',
        '2fa_help_text' => [
            'Este comando deshabilitará la autenticación de dos factores para la cuenta de un usuario si está habilitada. Esto solo debe usarse como un comando de recuperación de cuenta si el usuario no puede acceder a su cuenta.',
            'Si esto no es lo que deseaba hacer, presione CTRL+C para salir de este proceso.',
        ],
        '2fa_disabled' => 'La autenticación de dos factores ha sido deshabilitada para :email.',
    ],
    'schedule' => [
        'output_line' => 'Despachando trabajo para la primera tarea en `:schedule` (:hash).',
    ],
    'maintenance' => [
        'deleting_service_backup' => 'Eliminando archivo de respaldo del servicio :file.',
    ],
    'server' => [
        'rebuild_failed' => 'La solicitud de reconstrucción para ":name" (#:id) en el nodo ":node" falló con el error: :message',
        'reinstall' => [
            'failed' => 'La solicitud de reinstalación para ":name" (#:id) en el nodo ":node" falló con el error: :message',
            'confirm' => 'Está a punto de reinstalar un grupo de servidores. ¿Desea continuar?',
        ],
        'power' => [
            'confirm' => 'Está a punto de realizar :action en :count servidores. ¿Desea continuar?',
            'action_failed' => 'La solicitud de acción de energía para ":name" (#:id) en el nodo ":node" falló con el error: :message',
        ],
    ],
    'environment' => [
        'mail' => [
            'ask_smtp_host' => 'Host SMTP (ej. smtp.gmail.com)',
            'ask_smtp_port' => 'Puerto SMTP',
            'ask_smtp_username' => 'Nombre de Usuario SMTP',
            'ask_smtp_password' => 'Contraseña SMTP',
            'ask_mailgun_domain' => 'Dominio Mailgun',
            'ask_mailgun_endpoint' => 'Endpoint Mailgun',
            'ask_mailgun_secret' => 'Secreto Mailgun',
            'ask_mandrill_secret' => 'Secreto Mandrill',
            'ask_postmark_username' => 'Clave API de Postmark',
            'ask_driver' => '¿Qué controlador se debe usar para enviar correos electrónicos?',
            'ask_mail_from' => 'Dirección de correo electrónico de origen',
            'ask_mail_name' => 'Nombre que aparecerá como remitente',
            'ask_encryption' => 'Método de cifrado a utilizar',
        ],
    ],
];
