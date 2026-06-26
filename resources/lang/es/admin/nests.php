<?php

/*
|--------------------------------------------------------------------------
| Líneas de idioma para administración de nidos y huevos
|--------------------------------------------------------------------------
|
| Contiene las cadenas de traducción de administración de nidos
| y huevos para las vistas de gestión del panel de administración.
|
*/
return [
    'notices' => [
        'created' => 'Un nuevo nido, :name, ha sido creado exitosamente.',
        'deleted' => 'Se ha eliminado exitosamente el nido solicitado del Panel.',
        'updated' => 'Se han actualizado exitosamente las opciones de configuración del nido.',
    ],
    'eggs' => [
        'notices' => [
            'imported' => 'Se ha importado exitosamente este Huevo y sus variables asociadas.',
            'updated_via_import' => 'Este Huevo ha sido actualizado usando el archivo proporcionado.',
            'deleted' => 'Se ha eliminado exitosamente el huevo solicitado del Panel.',
            'updated' => 'La configuración del Huevo ha sido actualizada exitosamente.',
            'script_updated' => 'El script de instalación del Huevo ha sido actualizado y se ejecutará cuando se instalen servidores.',
            'egg_created' => 'Un nuevo huevo ha sido creado exitosamente. Deberá reiniciar todos los daemons en ejecución para aplicar este nuevo huevo.',
        ],
    ],
    'variables' => [
        'notices' => [
            'variable_deleted' => 'La variable ":variable" ha sido eliminada y ya no estará disponible para los servidores una vez reconstruidos.',
            'variable_updated' => 'La variable ":variable" ha sido actualizada. Deberá reconstruir todos los servidores que usen esta variable para aplicar los cambios.',
            'variable_created' => 'La nueva variable ha sido creada exitosamente y asignada a este huevo.',
        ],
    ],
];
