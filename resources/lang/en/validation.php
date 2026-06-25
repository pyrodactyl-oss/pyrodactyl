<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => 'The :attribute must be accepted.',
    'active_url' => 'The :attribute is not a valid URL.',
    'after' => 'The :attribute must be a date after :date.',
    'after_or_equal' => 'The :attribute must be a date after or equal to :date.',
    'alpha' => 'The :attribute may only contain letters.',
    'alpha_dash' => 'The :attribute may only contain letters, numbers, and dashes.',
    'alpha_num' => 'The :attribute may only contain letters and numbers.',
    'array' => 'The :attribute must be an array.',
    'before' => 'The :attribute must be a date before :date.',
    'before_or_equal' => 'The :attribute must be a date before or equal to :date.',
    'between' => [
        'numeric' => 'The :attribute must be between :min and :max.',
        'file' => 'The :attribute must be between :min and :max kilobytes.',
        'string' => 'The :attribute must be between :min and :max characters.',
        'array' => 'The :attribute must have between :min and :max items.',
    ],
    'boolean' => 'The :attribute field must be true or false.',
    'confirmed' => 'The :attribute confirmation does not match.',
    'date' => 'The :attribute is not a valid date.',
    'date_format' => 'The :attribute does not match the format :format.',
    'different' => 'The :attribute and :other must be different.',
    'digits' => 'The :attribute must be :digits digits.',
    'digits_between' => 'The :attribute must be between :min and :max digits.',
    'dimensions' => 'The :attribute has invalid image dimensions.',
    'distinct' => 'The :attribute field has a duplicate value.',
    'email' => 'The :attribute must be a valid email address.',
    'exists' => 'The selected :attribute is invalid.',
    'file' => 'The :attribute must be a file.',
    'filled' => 'The :attribute field is required.',
    'image' => 'The :attribute must be an image.',
    'in' => 'The selected :attribute is invalid.',
    'in_array' => 'The :attribute field does not exist in :other.',
    'integer' => 'The :attribute must be an integer.',
    'ip' => 'The :attribute must be a valid IP address.',
    'json' => 'The :attribute must be a valid JSON string.',
    'max' => [
        'numeric' => 'The :attribute may not be greater than :max.',
        'file' => 'The :attribute may not be greater than :max kilobytes.',
        'string' => 'The :attribute may not be greater than :max characters.',
        'array' => 'The :attribute may not have more than :max items.',
    ],
    'mimes' => 'The :attribute must be a file of type: :values.',
    'mimetypes' => 'The :attribute must be a file of type: :values.',
    'min' => [
        'numeric' => 'The :attribute must be at least :min.',
        'file' => 'The :attribute must be at least :min kilobytes.',
        'string' => 'The :attribute must be at least :min characters.',
        'array' => 'The :attribute must have at least :min items.',
    ],
    'not_in' => 'The selected :attribute is invalid.',
    'numeric' => 'The :attribute must be a number.',
    'present' => 'The :attribute field must be present.',
    'regex' => 'The :attribute format is invalid.',
    'required' => 'The :attribute field is required.',
    'required_if' => 'The :attribute field is required when :other is :value.',
    'required_unless' => 'The :attribute field is required unless :other is in :values.',
    'required_with' => 'The :attribute field is required when :values is present.',
    'required_with_all' => 'The :attribute field is required when :values is present.',
    'required_without' => 'The :attribute field is required when :values is not present.',
    'required_without_all' => 'The :attribute field is required when none of :values are present.',
    'same' => 'The :attribute and :other must match.',
    'size' => [
        'numeric' => 'The :attribute must be :size.',
        'file' => 'The :attribute must be :size kilobytes.',
        'string' => 'The :attribute must be :size characters.',
        'array' => 'The :attribute must contain :size items.',
    ],
    'string' => 'The :attribute must be a string.',
    'timezone' => 'The :attribute must be a valid zone.',
    'unique' => 'The :attribute has already been taken.',
    'uploaded' => 'The :attribute failed to upload.',
    'url' => 'The :attribute format is invalid.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap attribute place-holders
    | with something more reader friendly such as E-Mail Address instead
    | of "email". This simply helps us make messages a little cleaner.
    |
    */

    'attributes' => [
        // General
        'name' => 'name',
        'description' => 'description',
        'memo' => 'description',
        'host' => 'host',
        'port' => 'port',
        'username' => 'username',
        'password' => 'password',
        'email' => 'email',
        'first_name' => 'first name',
        'last_name' => 'last name',
        'password_confirmation' => 'password confirmation',
        // User
        'external_id' => 'third party identifier',
        'name_first' => 'first name',
        'name_last' => 'last name',
        'root_admin' => 'root administrator',
        'language' => 'language',
        'use_totp' => 'two-factor authentication',
        'totp_secret' => 'TOTP secret',
        'uuid' => 'UUID',
        // Server
        'owner_id' => 'owner ID',
        'node_id' => 'node ID',
        'memory' => 'memory',
        'overhead_memory' => 'overhead memory',
        'swap' => 'swap',
        'io' => 'IO',
        'cpu' => 'CPU',
        'threads' => 'threads',
        'oom_disabled' => 'OOM disabled',
        'disk' => 'disk',
        'allocation_id' => 'allocation ID',
        'nest_id' => 'nest ID',
        'egg_id' => 'egg ID',
        'startup' => 'startup command',
        'image' => 'Docker image',
        'database_limit' => 'database limit',
        'allocation_limit' => 'allocation limit',
        'backup_limit' => 'backup limit',
        'backup_storage_limit' => 'backup storage limit',
        // Node
        'location_id' => 'location ID',
        'public' => 'public visibility',
        'fqdn' => 'FQDN',
        'internal_fqdn' => 'internal FQDN',
        'scheme' => 'scheme',
        'behind_proxy' => 'behind proxy',
        'memory_overallocate' => 'memory overallocation',
        'disk_overallocate' => 'disk overallocation',
        'daemonBase' => 'daemon base path',
        'daemonSFTP' => 'daemon SFTP port',
        'daemonListen' => 'daemon listen port',
        'maintenance_mode' => 'maintenance mode',
        'upload_size' => 'maximum upload size',
        // Location
        'short' => 'identifier',
        'long' => 'description',
        // Allocation
        'ip' => 'IP address',
        'ip_alias' => 'IP alias',
        'notes' => 'notes',
        // Nest
        'author' => 'author',
        // Egg
        'docker_images' => 'Docker images',
        'force_outgoing_ip' => 'force outgoing IP',
        'file_denylist' => 'file denylist',
        'config_from' => 'copy configuration from',
        'config_stop' => 'stop command',
        'config_startup' => 'startup configuration',
        'config_logs' => 'log configuration',
        'config_files' => 'file configuration',
        // Database
        'database_host_id' => 'database host ID',
        'remote' => 'remote connection string',
        'max_connections' => 'max connections',
        'database' => 'database',
        // Mount
        'source' => 'source',
        'target' => 'target',
        'read_only' => 'read only',
        'user_mountable' => 'user mountable',
        // Schedule
        'cron_day_of_week' => 'day of week',
        'cron_month' => 'month',
        'cron_day_of_month' => 'day of month',
        'cron_hour' => 'hour',
        'cron_minute' => 'minute',
        'is_active' => 'active',
        'only_when_online' => 'only when online',
        // Task
        'action' => 'action',
        'payload' => 'task payload',
        'time_offset' => 'time offset',
        'sequence_id' => 'sequence',
        'continue_on_failure' => 'continue on failure',
        // Backup
        'is_successful' => 'successful',
        'is_locked' => 'locked',
        'ignored_files' => 'ignored files',
        'bytes' => 'bytes',
        // ApiKey
        'key_type' => 'key type',
        'identifier' => 'identifier',
        'token' => 'token',
        'allowed_ips' => 'allowed IPs',
        'expires_at' => 'expiration date',
        // Domain / DNS
        'dns_provider' => 'DNS provider',
        'dns_config' => 'DNS configuration',
        'is_default' => 'default',
        // Subdomain
        'subdomain' => 'subdomain',
        'record_type' => 'record type',
        'dns_records' => 'DNS records',
        // SSH Key
        'fingerprint' => 'fingerprint',
        'public_key' => 'public key',
        // Settings (app:xxx, pterodactyl:xxx)
        'app:name' => 'company name',
        'app:locale' => 'default language',
        'pterodactyl:auth:2fa_required' => 'two-factor authentication',
        'pterodactyl:guzzle:timeout' => 'HTTP request timeout',
        'pterodactyl:guzzle:connect_timeout' => 'HTTP connection timeout',
        'pterodactyl:client_features:allocations:enabled' => 'auto create allocations',
        'pterodactyl:client_features:allocations:range_start' => 'starting port',
        'pterodactyl:client_features:allocations:range_end' => 'ending port',
        'pterodactyl:trash:retention_days' => 'file trash retention days',
        'pterodactyl:captcha:provider' => 'captcha provider',
        'pterodactyl:captcha:turnstile:site_key' => 'turnstile site key',
        'pterodactyl:captcha:turnstile:secret_key' => 'turnstile secret key',
        'pterodactyl:captcha:hcaptcha:site_key' => 'hCaptcha site key',
        'pterodactyl:captcha:hcaptcha:secret_key' => 'hCaptcha secret key',
        'pterodactyl:captcha:recaptcha:site_key' => 'reCAPTCHA site key',
        'pterodactyl:captcha:recaptcha:secret_key' => 'reCAPTCHA secret key',
        // Nested fields
        'dns_config.api_token' => 'API token',
        'dns_config.access_key_id' => 'access key ID',
        'dns_config.secret_access_key' => 'secret access key',
        'dns_config.region' => 'AWS region',
        'dns_config.hosted_zone_id' => 'hosted zone ID',
        'feature_limits.databases' => 'database limit',
        'feature_limits.allocations' => 'allocation limit',
        'feature_limits.backups' => 'backup limit',
        'feature_limits.backup_storage_mb' => 'backup storage (MB)',
        'add_allocations' => 'allocations to add',
        'remove_allocations' => 'allocations to remove',
        'add_allocations.*' => 'allocation to add',
        'remove_allocations.*' => 'allocation to remove',
        'user' => 'user ID',
    ],

    'custom' => [
        'name' => [
            'required' => 'A domain name is required.',
            'regex' => 'The domain name format is invalid.',
            'unique' => 'This domain is already configured.',
        ],
        'dns_provider' => [
            'required' => 'A DNS provider must be selected.',
            'in' => 'The selected DNS provider is not supported.',
        ],
        'dns_config' => [
            'required' => 'DNS configuration is required.',
        ],
        'dns_config.api_token' => [
            'required_if' => 'API token is required for Cloudflare.',
        ],
        'dns_config.access_key_id' => [
            'required_if' => 'Access Key ID is required for Route53.',
        ],
        'dns_config.secret_access_key' => [
            'required_if' => 'Secret Access Key is required for Route53.',
        ],
        'database' => [
            'unique' => 'The database name you have selected is already in use by this server.',
        ],
        'operation_id' => [
            'required' => 'An operation ID is required.',
            'uuid' => 'The operation ID must be a valid UUID.',
        ],
        'confirm' => [
            'required' => 'You must confirm that you understand this action cannot be undone without administrator assistance.',
            'accepted' => 'You must confirm that you understand this action cannot be undone without administrator assistance.',
        ],
    ],

    // Internal validation logic for Pterodactyl
    'internal' => [
        'variable_value' => ':env variable',
        'invalid_password' => 'The password provided was invalid for this account.',
    ],
    'subuser_permissions_required' => 'You must select at least one permission for this subuser.',
    'subdomain_invalid_chars' => 'Subdomain contains invalid characters.',
    'subdomain_reserved' => 'This subdomain is reserved and cannot be used.',
    'subdomain_taken' => 'This subdomain is already taken.',
    'subdomain_domain_unavailable' => 'The selected domain is not available.',
    'task_invalid_power_action' => 'The power action must be one of: start, stop, restart, kill.',
    'egg_not_in_nest' => 'The selected egg does not belong to the specified nest.',
    'egg_docker_image_not_allowed' => 'The selected Docker image is not allowed for this egg.',
    'egg_env_invalid' => 'This environment variable is not valid for the selected egg.',
    'ip_invalid' => '":ip" is not a valid IP address or CIDR range.',
];
