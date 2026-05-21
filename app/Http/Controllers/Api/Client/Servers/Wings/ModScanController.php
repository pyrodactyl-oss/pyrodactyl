<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Wings;

use Pterodactyl\Models\Server;
use Pterodactyl\Services\Mods\ModScannerService;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Mods\ScanModsRequest;

class ModScanController extends ClientApiController
{
    public function __construct(
        private DaemonFileRepository $fileRepository,
        private ModScannerService $scanner,
    ) {
        parent::__construct();
    }

    public function __invoke(ScanModsRequest $request, Server $server): array
    {
        return $this->scanner->scan(
            $server,
            $this->fileRepository,
            $request->input('directory', 'mods'),
            $request->input('mode', 'quick'),
        );
    }
}
