<?php

namespace Pterodactyl\Exceptions\Http\Server;

use Pterodactyl\Models\Server;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ServerStateConflictException extends ConflictHttpException
{
    /**
     * Exception thrown when the server is in an unsupported state for API access or
     * certain operations within the codebase.
     */
    public function __construct(Server $server, ?\Throwable $previous = null)
    {
        $message = trans('exceptions.server.another_operation');
        if ($server->isSuspended()) {
            $message = trans('exceptions.server.suspended');
        } elseif ($server->node->isUnderMaintenance()) {
            $message = trans('exceptions.server.cannot_accept_operations');
        } elseif (!$server->isInstalled()) {
            $message = trans('exceptions.server.installing');
        } elseif ($server->status === Server::STATUS_RESTORING_BACKUP) {
            $message = trans('exceptions.server.another_operation');
        } elseif (!is_null($server->transfer)) {
            $message = trans('exceptions.server.transferring');
        }

        parent::__construct($message, $previous);
    }
}
