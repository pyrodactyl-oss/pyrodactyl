<?php

/*
|--------------------------------------------------------------------------
| Líneas de idioma para administración de nodos
|--------------------------------------------------------------------------
|
| Contiene las cadenas de traducción de administración específicas
| de nodos para las vistas de gestión del panel de administración.
|
*/
return [
    'validation' => [
        'fqdn_not_resolvable' => 'El FQDN o dirección IP proporcionada no resuelve a una dirección IP válida.',
        'fqdn_required_for_ssl' => 'Se requiere un nombre de dominio completo que resuelva a una dirección IP pública para poder usar SSL en este nodo.',
    ],
    'notices' => [
        'allocations_added' => 'Las asignaciones han sido agregadas exitosamente a este nodo.',
        'node_deleted' => 'El nodo ha sido eliminado exitosamente del panel.',
        'location_required' => 'Debe tener al menos una ubicación configurada antes de poder agregar un nodo a este panel.',
        'node_created' => 'Nuevo nodo creado exitosamente. Puede configurar automáticamente el daemon en esta máquina visitando la pestaña \'Configuración\'. <strong>Antes de poder agregar servidores, primero debe asignar al menos una dirección IP y puerto.</strong>',
        'node_updated' => 'La información del nodo ha sido actualizada. Si se cambió alguna configuración del daemon, deberá reiniciarlo para que los cambios surtan efecto.',
        'unallocated_deleted' => 'Se eliminaron todos los puertos no asignados para <code>:ip</code>.',
    ],
];
