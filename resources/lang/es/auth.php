<?php

/*
|--------------------------------------------------------------------------
| Líneas de idioma para autenticación
|--------------------------------------------------------------------------
|
| Contiene todas las cadenas de traducción de autenticación
| y notificaciones por correo electrónico del panel.
|
*/
return [
    'login' => 'Iniciar sesión',
    'username_or_email' => 'Usuario o correo electrónico',
    'password' => 'Contraseña',
    'email_label' => 'Correo electrónico',
    'forgot_password' => '¿Olvidaste tu contraseña?',
    'invalid_credentials' => 'Usuario o contraseña inválidos. Inténtalo de nuevo.',
    'captcha_required' => 'Por favor, completa la verificación del captcha.',
    'captcha_failed' => 'La verificación del captcha falló. Inténtalo de nuevo.',
    'username_required' => 'Se requiere un usuario o correo electrónico.',
    'password_required' => 'Por favor, introduce la contraseña de tu cuenta.',

    'two_factor' => [
        'title' => 'Autenticación de dos factores',
        'description' => 'Revisa el dispositivo vinculado a tu cuenta para obtener el código.',
        'recovery_code_title' => 'Código de recuperación',
        'auth_code_title' => 'Código de autenticación',
        'recovery_description' => 'Introduce uno de los códigos de recuperación generados cuando configuraste la autenticación de dos factores en esta cuenta para continuar.',
        'auth_description' => 'Introduce el token de dos factores mostrado por tu dispositivo.',
        'lost_device' => 'He perdido mi dispositivo',
        'have_device' => 'Tengo mi dispositivo',
        'return_to_login' => 'Volver al inicio de sesión',
    ],

    'forgot' => [
        'title' => 'Restablecer contraseña',
        'description' => 'Te enviaremos un correo electrónico con un enlace para restablecer tu contraseña.',
        'email_required' => 'El correo electrónico es obligatorio.',
        'email_valid' => 'Introduce una dirección de correo electrónico válida.',
        'send_email' => 'Enviar correo',
        'success' => '¡Correo enviado!',
        'return_to_login' => 'Volver al inicio de sesión',
    ],

    'reset' => [
        'title' => 'Restablecer contraseña',
        'new_password' => 'Nueva contraseña',
        'confirm_password' => 'Confirmar nueva contraseña',
        'password_description' => 'Las contraseñas deben tener al menos 8 caracteres.',
        'password_required' => 'Se requiere una nueva contraseña.',
        'password_min' => 'Tu nueva contraseña debe tener al menos 8 caracteres.',
        'password_mismatch' => 'Las contraseñas nuevas no coinciden.',
        'return_to_login' => 'Volver al inicio de sesión',
    ],
    'failed' => 'Las credenciales no coinciden con nuestros registros.',
    'generic_greeting' => '¡Hola!',
    'email_account_created' => [
        'subject' => 'Cuenta creada',
        'greeting' => '¡Hola :name!',
        'line' => 'Recibes este correo porque se ha creado una cuenta para ti en :app.',
        'username' => 'Usuario',
        'email' => 'Correo electrónico',
        'setup_button' => 'Configurar tu cuenta',
    ],
    'email_password_reset' => [
        'subject' => 'Restablecer contraseña',
        'line' => 'Recibes este correo porque recibimos una solicitud de restablecimiento de contraseña para tu cuenta.',
        'action' => 'Restablecer contraseña',
        'no_action' => 'Si no solicitaste un restablecimiento de contraseña, no es necesario realizar ninguna acción.',
    ],
    'regards' => 'Saludos',
    'all_rights_reserved' => 'Todos los derechos reservados.',
    'trouble_clicking' => 'Si tienes problemas para hacer clic en el botón ":actionText", copia y pega la siguiente URL en tu navegador:',
    'email_subuser_added' => [
        'subject' => 'Añadido al servidor',
        'greeting' => '¡Hola :name!',
        'line' => 'Has sido añadido como subusuario al siguiente servidor, lo que te permite cierto control sobre el servidor.',
        'server_name' => 'Nombre del servidor',
        'visit' => 'Visitar servidor',
    ],
    'email_subuser_removed' => [
        'subject' => 'Eliminado del servidor',
        'greeting' => 'Hola :name.',
        'line' => 'Has sido eliminado como subusuario del siguiente servidor.',
        'server_name' => 'Nombre del servidor',
        'visit' => 'Visitar Panel',
    ],
    'email_server_installed' => [
        'subject' => 'Servidor instalado',        'greeting' => 'Hola :name.',
        'line' => 'Tu servidor ha terminado de instalarse y ya está listo para que lo uses.',
        'server_name' => 'Nombre del servidor',
        'action' => 'Iniciar sesión y comenzar',
    ],
    'email_mail_tested' => [
        'subject' => 'Mensaje de prueba de Pyrodactyl',
        'greeting' => '¡Hola :name!',
        'line' => 'Esto es una prueba del sistema de correo de Pyrodactyl. ¡Todo funciona correctamente!',
    ],
    'label_value' => ':label: :value',
    'two_factor' => [
        'checkpoint_failed' => 'El punto de control de autenticación de dos factores falló. Inténtalo de nuevo.',
    ],
    '2fa_must_be_enabled' => 'Debes tener la autenticación de dos factores activada en tu cuenta para acceder a este servidor.',
];
