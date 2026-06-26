<?php

/**
 * Contiene todas las cadenas de traducción para los diferentes eventos
 * del registro de actividad. Deben estar indexadas por el valor delante
 * de los dos puntos (:) en el nombre del evento. Si no hay dos puntos,
 * deben estar en el nivel superior.
 */
return [
    'auth' => [
        'fail' => 'Inicio de sesión fallido',
        'success' => 'Sesión iniciada',
        'password-reset' => 'Contraseña restablecida',
        'reset-password' => 'Solicitó restablecer contraseña',
        'checkpoint' => 'Autenticación de dos factores solicitada',
        'recovery-token' => 'Usó token de recuperación de dos factores',
        'token' => 'Resolvió el desafío de dos factores',
        'ip-blocked' => 'Solicitud bloqueada desde dirección IP no listada para :identifier',
        'sftp' => [
            'fail' => 'Inicio de sesión SFTP fallido',
        ],
    ],
    'user' => [
        'account' => [
            'email-changed' => 'Cambió el correo de :old a :new',
            'password-changed' => 'Cambió la contraseña',
        ],
        'api-key' => [
            'create' => 'Creó nueva clave API :identifier',
            'delete' => 'Eliminó la clave API :identifier',
        ],
        'ssh-key' => [
            'create' => 'Añadió la clave SSH :fingerprint a la cuenta',
            'delete' => 'Eliminó la clave SSH :fingerprint de la cuenta',
        ],
        'two-factor' => [
            'create' => 'Activó la autenticación de dos factores',
            'delete' => 'Desactivó la autenticación de dos factores',
        ],
    ],
    'server' => [
        'reinstall' => 'Reinstaló el servidor',
        'console' => [
            'command' => 'Ejecutó ":command" en el servidor',
        ],
        'power' => [
            'start' => 'Inició el servidor',
            'stop' => 'Detuvo el servidor',
            'restart' => 'Reinició el servidor',
            'kill' => 'Forzó la detención del proceso del servidor',
        ],
        'backup' => [
            'download' => 'Descargó la copia de seguridad :name',
            'delete' => 'Eliminó la copia de seguridad :name',
            'restore' => 'Restauró la copia de seguridad :name (archivos eliminados: :truncate)',
            'restore-complete' => 'Completó la restauración de la copia de seguridad :name',
            'restore-failed' => 'Falló la restauración de la copia de seguridad :name',
            'start' => 'Inició una nueva copia de seguridad :name',
            'complete' => 'Marcó la copia de seguridad :name como completada',
            'fail' => 'Marcó la copia de seguridad :name como fallida',
            'lock' => 'Bloqueó la copia de seguridad :name',
            'unlock' => 'Desbloqueó la copia de seguridad :name',
            'software-change' => 'Creó copia de seguridad antes del cambio de software',
        ],
        'database' => [
            'create' => 'Creó la base de datos :name',
            'rotate-password' => 'Rotó la contraseña de la base de datos :name',
            'delete' => 'Eliminó la base de datos :name',
        ],
        'file' => [
            'compress_one' => 'Comprimió :directory:file',
            'compress_other' => 'Comprimió :count archivos en :directory',
            'read' => 'Vio el contenido de :file',
            'copy' => 'Creó una copia de :file',
            'create-directory' => 'Creó el directorio :directory:name',
            'decompress' => 'Descomprimió :files en :directory',
            'delete_one' => 'Eliminó :directory:files.0',
            'delete_other' => 'Eliminó :count archivos en :directory',
            'download' => 'Descargó :file',
            'pull' => 'Descargó un archivo remoto desde :url a :directory',
            'rename_one' => 'Renombró :directory:files.0.from a :directory:files.0.to',
            'rename_other' => 'Renombró :count archivos en :directory',
            'write' => 'Escribió nuevo contenido en :file',
            'upload' => 'Inició una subida de archivo',
            'uploaded' => 'Subió :directory:file',
            'trash_one' => 'Movió :directory:files.0 a la papelera',
            'trash_other' => 'Movió :count archivos en :directory a la papelera',
            'trash-delete_one' => 'Eliminó permanentemente :file de la papelera',
            'trash-delete_other' => 'Eliminó permanentemente :count archivos de la papelera',
            'trash-empty' => 'Vació toda la papelera',
            'restore_one' => 'Restauró :file de la papelera',
            'restore_other' => 'Restauró :count archivos de la papelera',
            'software-change-wipe' => 'Eliminó archivos del servidor durante el cambio de software',
        ],
        'sftp' => [
            'denied' => 'Bloqueó el acceso SFTP por permisos',
            'create_one' => 'Creó :files.0',
            'create_other' => 'Creó :count archivos nuevos',
            'write_one' => 'Modificó el contenido de :files.0',
            'write_other' => 'Modificó el contenido de :count archivos',
            'delete_one' => 'Eliminó :files.0',
            'delete_other' => 'Eliminó :count archivos',
            'create-directory_one' => 'Creó el directorio :files.0',
            'create-directory_other' => 'Creó :count directorios',
            'rename_one' => 'Renombró :files.0.from a :files.0.to',
            'rename_other' => 'Renombró o movió :count archivos',
        ],
        'allocation' => [
            'create' => 'Añadió :allocation al servidor',
            'notes' => 'Actualizó las notas de :allocation de ":old" a ":new"',
            'primary' => 'Estableció :allocation como la asignación principal del servidor',
            'delete' => 'Eliminó la asignación :allocation',
        ],
        'schedule' => [
            'create' => 'Creó la programación :name',
            'update' => 'Actualizó la programación :name',
            'execute' => 'Ejecutó manualmente la programación :name',
            'delete' => 'Eliminó la programación :name',
        ],
        'task' => [
            'create' => 'Creó una nueva tarea ":action" para la programación :name',
            'update' => 'Actualizó la tarea ":action" para la programación :name',
            'delete' => 'Eliminó una tarea de la programación :name',
        ],
        'settings' => [
            'rename' => 'Renombró el servidor de :old a :new',
            'description' => 'Cambió la descripción del servidor de :old a :new',
            'egg' => 'Cambió el huevo del servidor',
            'egg-preview' => 'Previsualizó el cambio de huevo del servidor',
        ],
        'software' => [
            'change-queued' => 'Cambio de software en cola',
            'change-started' => 'Cambio de software iniciado',
            'changed' => 'Software cambiado exitosamente',
            'change-failed' => 'Cambio de software fallido',
        ],
        'startup' => [
            'edit' => 'Cambió la variable :variable de ":old" a ":new"',
            'image' => 'Actualizó la imagen Docker del servidor de :old a :new',
        ],
        'subuser' => [
            'create' => 'Añadió a :email como subusuario',
            'update' => 'Actualizó los permisos del subusuario :email',
            'delete' => 'Eliminó a :email como subusuario',
        ],
    ],
];
