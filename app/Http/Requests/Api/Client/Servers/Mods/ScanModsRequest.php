<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Mods;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ScanModsRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_MOD_DOWNLOAD;
    }

    public function rules(): array
    {
        return [
            'directory' => ['sometimes', 'nullable', 'string', 'max:128', 'regex:/^(?!.*\.\.)(?!\/)[A-Za-z0-9_\/.-]+$/'],
            'mode' => ['sometimes', 'nullable', 'string', 'in:quick,missing,full'],
        ];
    }
}
