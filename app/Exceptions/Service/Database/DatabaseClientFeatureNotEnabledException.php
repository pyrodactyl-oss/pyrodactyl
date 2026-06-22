<?php

namespace Pterodactyl\Exceptions\Service\Database;

use Pterodactyl\Exceptions\PterodactylException;

class DatabaseClientFeatureNotEnabledException extends PterodactylException
{
    public function __construct()
    {
        parent::__construct(trans('exceptions.database.client_not_enabled'));
    }
}
