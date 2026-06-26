<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Líneas de idioma para validación
    |--------------------------------------------------------------------------
    |
    | Las siguientes líneas de idioma contienen los mensajes de error
    | predeterminados usados por la clase validadora. Algunas de estas
    | reglas tienen múltiples versiones como las reglas de tamaño. Siéntete libre de modificar cada uno de estos mensajes aquí.
    |
    */

    'accepted' => 'El campo :attribute debe ser aceptado.',
    'active_url' => 'El campo :attribute no es una URL válida.',
    'after' => 'El campo :attribute debe ser una fecha posterior a :date.',
    'after_or_equal' => 'El campo :attribute debe ser una fecha posterior o igual a :date.',
    'alpha' => 'El campo :attribute solo puede contener letras.',
    'alpha_dash' => 'El campo :attribute solo puede contener letras, números y guiones.',
    'alpha_num' => 'El campo :attribute solo puede contener letras y números.',
    'array' => 'El campo :attribute debe ser un arreglo.',
    'before' => 'El campo :attribute debe ser una fecha anterior a :date.',
    'before_or_equal' => 'El campo :attribute debe ser una fecha anterior o igual a :date.',
    'between' => [
        'numeric' => 'El campo :attribute debe estar entre :min y :max.',
        'file' => 'El campo :attribute debe estar entre :min y :max kilobytes.',
        'string' => 'El campo :attribute debe tener entre :min y :max caracteres.',
        'array' => 'El campo :attribute debe tener entre :min y :max elementos.',
    ],
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'confirmed' => 'La confirmación de :attribute no coincide.',
    'date' => 'El campo :attribute no es una fecha válida.',
    'date_format' => 'El campo :attribute no coincide con el formato :format.',
    'different' => 'Los campos :attribute y :other deben ser diferentes.',
    'digits' => 'El campo :attribute debe tener :digits dígitos.',
    'digits_between' => 'El campo :attribute debe tener entre :min y :max dígitos.',
    'dimensions' => 'El campo :attribute tiene dimensiones de imagen inválidas.',
    'distinct' => 'El campo :attribute tiene un valor duplicado.',
    'email' => 'El campo :attribute debe ser una dirección de correo electrónico válida.',
    'exists' => 'El campo :attribute seleccionado es inválido.',
    'file' => 'El campo :attribute debe ser un archivo.',
    'filled' => 'El campo :attribute es obligatorio.',
    'image' => 'El campo :attribute debe ser una imagen.',
    'in' => 'El campo :attribute seleccionado es inválido.',
    'in_array' => 'El campo :attribute no existe en :other.',
    'integer' => 'El campo :attribute debe ser un número entero.',
    'ip' => 'El campo :attribute debe ser una dirección IP válida.',
    'json' => 'El campo :attribute debe ser una cadena JSON válida.',
    'max' => [
        'numeric' => 'El campo :attribute no puede ser mayor que :max.',
        'file' => 'El campo :attribute no puede ser mayor que :max kilobytes.',
        'string' => 'El campo :attribute no puede tener más de :max caracteres.',
        'array' => 'El campo :attribute no puede tener más de :max elementos.',
    ],
    'mimes' => 'El campo :attribute debe ser un archivo de tipo: :values.',
    'mimetypes' => 'El campo :attribute debe ser un archivo de tipo: :values.',
    'min' => [
        'numeric' => 'El campo :attribute debe ser al menos :min.',
        'file' => 'El campo :attribute debe ser al menos :min kilobytes.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
        'array' => 'El campo :attribute debe tener al menos :min elementos.',
    ],
    'not_in' => 'El campo :attribute seleccionado es inválido.',
    'numeric' => 'El campo :attribute debe ser un número.',
    'present' => 'El campo :attribute debe estar presente.',
    'regex' => 'El formato del campo :attribute es inválido.',
    'required' => 'El campo :attribute es obligatorio.',
    'required_if' => 'El campo :attribute es obligatorio cuando :other es :value.',
    'required_unless' => 'El campo :attribute es obligatorio a menos que :other esté en :values.',
    'required_with' => 'El campo :attribute es obligatorio cuando :values está presente.',
    'required_with_all' => 'El campo :attribute es obligatorio cuando :values está presente.',
    'required_without' => 'El campo :attribute es obligatorio cuando :values no está presente.',
    'required_without_all' => 'El campo :attribute es obligatorio cuando ninguno de :values está presente.',
    'same' => 'Los campos :attribute y :other deben coincidir.',
    'size' => [
        'numeric' => 'El campo :attribute debe ser :size.',
        'file' => 'El campo :attribute debe ser :size kilobytes.',
        'string' => 'El campo :attribute debe tener :size caracteres.',
        'array' => 'El campo :attribute debe contener :size elementos.',
    ],
    'string' => 'El campo :attribute debe ser una cadena de texto.',
    'timezone' => 'El campo :attribute debe ser una zona válida.',
    'unique' => 'Ya existe una cuenta asociada a este :attribute.',
    'uploaded' => 'El campo :attribute falló al subirse.',
    'url' => 'El formato del campo :attribute es inválido.',

    /*
    |--------------------------------------------------------------------------
    | Atributos de validación personalizados
    |--------------------------------------------------------------------------
    |
    | Las siguientes líneas de idioma se usan para intercambiar los
    | marcadores de atributos con algo más legible como "Dirección
    | de correo electrónico" en lugar de "email". Esto ayuda a hacer los mensajes más claros.
    |
    */

    'attributes' => [
        // Generales
        'name' => 'nombre',
        'description' => 'descripción',
        'memo' => 'descripción',
        'host' => 'servidor',
        'port' => 'puerto',
        'username' => 'usuario',
        'password' => 'contraseña',
        'email' => 'correo electrónico',
        'first_name' => 'nombre',
        'last_name' => 'apellidos',
        'password_confirmation' => 'confirmación de contraseña',
        // User
        'external_id' => 'identificador externo',
        'name_first' => 'nombre',
        'name_last' => 'apellidos',
        'root_admin' => 'administrador raíz',
        'language' => 'idioma',
        'use_totp' => 'autenticación de dos factores',
        'totp_secret' => 'secreto TOTP',
        'uuid' => 'UUID',
        // Server
        'owner_id' => 'ID de propietario',
        'node_id' => 'ID de nodo',
        'memory' => 'memoria',
        'overhead_memory' => 'memoria overhead',
        'swap' => 'swap',
        'io' => 'E/S',
        'cpu' => 'CPU',
        'threads' => 'hilos',
        'oom_disabled' => 'OOM deshabilitado',
        'disk' => 'disco',
        'allocation_id' => 'ID de asignación',
        'nest_id' => 'ID de nido',
        'egg_id' => 'ID de huevo',
        'startup' => 'comando de inicio',
        'image' => 'imagen Docker',
        'database_limit' => 'límite de bases de datos',
        'allocation_limit' => 'límite de asignaciones',
        'backup_limit' => 'límite de copias de seguridad',
        'backup_storage_limit' => 'límite de almacenamiento de copias',
        // Node
        'location_id' => 'ID de ubicación',
        'public' => 'visibilidad pública',
        'fqdn' => 'FQDN',
        'internal_fqdn' => 'FQDN interno',
        'scheme' => 'esquema',
        'behind_proxy' => 'detrás de proxy',
        'memory_overallocate' => 'sobreasignación de memoria',
        'disk_overallocate' => 'sobreasignación de disco',
        'daemonBase' => 'ruta base del daemon',
        'daemonSFTP' => 'puerto SFTP del daemon',
        'daemonListen' => 'puerto de escucha del daemon',
        'maintenance_mode' => 'modo mantenimiento',
        'upload_size' => 'tamaño máximo de carga',
        // Location
        'short' => 'identificador',
        'long' => 'descripción',
        // Allocation
        'ip' => 'dirección IP',
        'ip_alias' => 'alias de IP',
        'notes' => 'notas',
        // Nest
        'author' => 'autor',
        // Egg
        'docker_images' => 'imágenes Docker',
        'force_outgoing_ip' => 'forzar IP de salida',
        'file_denylist' => 'lista negra de archivos',
        'config_from' => 'copiar configuración desde',
        'config_stop' => 'comando de detención',
        'config_startup' => 'configuración de inicio',
        'config_logs' => 'configuración de logs',
        'config_files' => 'configuración de archivos',
        // Database
        'database_host_id' => 'ID de servidor de base de datos',
        'remote' => 'cadena de conexión remota',
        'max_connections' => 'conexiones máximas',
        'database' => 'base de datos',
        // Mount
        'source' => 'origen',
        'target' => 'destino',
        'read_only' => 'solo lectura',
        'user_mountable' => 'montable por usuario',
        // Schedule
        'cron_day_of_week' => 'día de la semana',
        'cron_month' => 'mes',
        'cron_day_of_month' => 'día del mes',
        'cron_hour' => 'hora',
        'cron_minute' => 'minuto',
        'is_active' => 'activo',
        'only_when_online' => 'solo cuando está en línea',
        // Task
        'action' => 'acción',
        'payload' => 'contenido de tarea',
        'time_offset' => 'desfase de tiempo',
        'sequence_id' => 'secuencia',
        'continue_on_failure' => 'continuar si falla',
        // Backup
        'is_successful' => 'exitoso',
        'is_locked' => 'bloqueado',
        'ignored_files' => 'archivos ignorados',
        'bytes' => 'bytes',
        // ApiKey
        'key_type' => 'tipo de clave',
        'identifier' => 'identificador',
        'token' => 'token',
        'allowed_ips' => 'IPs permitidas',
        'expires_at' => 'fecha de expiración',
        // Domain / DNS
        'dns_provider' => 'proveedor DNS',
        'dns_config' => 'configuración DNS',
        'is_default' => 'predeterminado',
        // Subdomain
        'subdomain' => 'subdominio',
        'record_type' => 'tipo de registro',
        'dns_records' => 'registros DNS',
        // SSH Key
        'fingerprint' => 'huella digital',
        'public_key' => 'clave pública',
        // Settings (app:xxx, pterodactyl:xxx)
        'app:name' => 'nombre de la empresa',
        'app:locale' => 'idioma predeterminado',
        'pterodactyl:auth:2fa_required' => 'autenticación de dos factores',
        'pterodactyl:guzzle:timeout' => 'timeout de solicitudes HTTP',
        'pterodactyl:guzzle:connect_timeout' => 'timeout de conexión HTTP',
        'pterodactyl:client_features:allocations:enabled' => 'creación automática de asignaciones',
        'pterodactyl:client_features:allocations:range_start' => 'puerto inicial',
        'pterodactyl:client_features:allocations:range_end' => 'puerto final',
        'pterodactyl:trash:retention_days' => 'días de retención en papelera',
        'pterodactyl:captcha:provider' => 'proveedor de Captcha',
        'pterodactyl:captcha:turnstile:site_key' => 'clave del sitio Turnstile',
        'pterodactyl:captcha:turnstile:secret_key' => 'clave secreta Turnstile',
        'pterodactyl:captcha:hcaptcha:site_key' => 'clave del sitio hCaptcha',
        'pterodactyl:captcha:hcaptcha:secret_key' => 'clave secreta hCaptcha',
        'pterodactyl:captcha:recaptcha:site_key' => 'clave del sitio reCAPTCHA',
        'pterodactyl:captcha:recaptcha:secret_key' => 'clave secreta reCAPTCHA',
        // Nested fields
        'dns_config.api_token' => 'token API',
        'dns_config.access_key_id' => 'ID de clave de acceso',
        'dns_config.secret_access_key' => 'clave de acceso secreta',
        'dns_config.region' => 'región de AWS',
        'dns_config.hosted_zone_id' => 'ID de zona alojada',
        'feature_limits.databases' => 'límite de bases de datos',
        'feature_limits.allocations' => 'límite de asignaciones',
        'feature_limits.backups' => 'límite de copias',
        'feature_limits.backup_storage_mb' => 'almacenamiento de copias (MB)',
        'add_allocations' => 'asignaciones a agregar',
        'remove_allocations' => 'asignaciones a eliminar',
        'add_allocations.*' => 'asignación a agregar',
        'remove_allocations.*' => 'asignación a eliminar',
        'user' => 'ID de usuario',
    ],

    'custom' => [
        'name' => [
            'required' => 'Se requiere un nombre de dominio.',
            'regex' => 'El formato del nombre de dominio no es válido.',
            'unique' => 'Este dominio ya está configurado.',
        ],
        'dns_provider' => [
            'required' => 'Se debe seleccionar un proveedor DNS.',
            'in' => 'El proveedor DNS seleccionado no es compatible.',
        ],
        'dns_config' => [
            'required' => 'Se requiere la configuración DNS.',
        ],
        'dns_config.api_token' => [
            'required_if' => 'Se requiere el token API para Cloudflare.',
        ],
        'dns_config.access_key_id' => [
            'required_if' => 'Se requiere el ID de clave de acceso para Route53.',
        ],
        'dns_config.secret_access_key' => [
            'required_if' => 'Se requiere la clave de acceso secreta para Route53.',
        ],
        'database' => [
            'unique' => 'El nombre de base de datos seleccionado ya está en uso en este servidor.',
        ],
        'operation_id' => [
            'required' => 'Se requiere un ID de operación.',
            'uuid' => 'El ID de operación debe ser un UUID válido.',
        ],
        'confirm' => [
            'required' => 'Debes confirmar que entiendes que esta acción no se puede deshacer sin asistencia de un administrador.',
            'accepted' => 'Debes confirmar que entiendes que esta acción no se puede deshacer sin asistencia de un administrador.',
        ],
    ],

    // Lógica interna de validación para Pyrodactyl
    'internal' => [
        'variable_value' => 'variable :env',
        'invalid_password' => 'La contraseña proporcionada es inválida para esta cuenta.',
    ],
    'subuser_permissions_required' => 'Debes seleccionar al menos un permiso para este subusuario.',
    'subdomain_invalid_chars' => 'El subdominio contiene caracteres no válidos.',
    'subdomain_reserved' => 'Este subdominio está reservado y no puede usarse.',
    'subdomain_taken' => 'Este subdominio ya está en uso.',
    'subdomain_domain_unavailable' => 'El dominio seleccionado no está disponible.',
    'task_invalid_power_action' => 'La acción de energía debe ser: iniciar, detener, reiniciar o forzar detención.',
    'egg_not_in_nest' => 'El huevo seleccionado no pertenece al nido especificado.',
    'egg_docker_image_not_allowed' => 'La imagen Docker seleccionada no está permitida para este huevo.',
    'egg_env_invalid' => 'Esta variable de entorno no es válida para el huevo seleccionado.',
    'ip_invalid' => '":ip" no es una dirección IP o rango CIDR válido.',
    'username_format' => 'El campo :attribute debe empezar y terminar con caracteres alfanuméricos y contener solo letras, números, guiones, guiones bajos y puntos.',
    'fqdn_not_ip' => 'El campo :attribute no debe ser una dirección IP cuando HTTPS está habilitado.',
    'fqdn_not_resolvable' => 'El campo :attribute no se pudo resolver a una dirección IP válida.',
];
