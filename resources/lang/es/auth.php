<?php

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
];
