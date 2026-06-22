<?php

namespace Pterodactyl\Services\ServerOperations;

use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerOperation;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * Service for validating server state before operations.
 *
 * Ensures servers are in appropriate states for modifications and prevents
 * concurrent operations that could cause conflicts.
 */
class ServerStateValidationService
{
    /**
     * Validate server state before making changes.
     */
    public function validateServerState(Server $server): void
    {
        try {
            if ($server->status === Server::STATUS_INSTALLING) {
                throw new ConflictHttpException(trans('exceptions.server.installing'));
            }
            
            if ($server->status === Server::STATUS_SUSPENDED) {
                throw new ConflictHttpException(trans('exceptions.server.suspended'));
            }
            
            if ($server->transfer) {
                throw new ConflictHttpException(trans('exceptions.server.transferring'));
            }
            
            $server->refresh();
        } catch (\Exception $e) {
            Log::error('Failed to validate server state', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            
            if ($e instanceof ConflictHttpException) {
                throw $e;
            }
            
            Log::warning('Server state validation failed, allowing request to proceed', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check for active operations on server.
     */
    public function checkForActiveOperations(Server $server): void
    {
        $activeOperation = ServerOperation::forServer($server)->active()->first();
        if ($activeOperation) {
            throw new ConflictHttpException(trans('exceptions.server.another_operation'));
        }
    }

    /**
     * Validate server can accept the operation.
     */
    public function validateCanAcceptOperation(Server $server, string $operationType): void
    {
        $this->validateServerState($server);
        $this->checkForActiveOperations($server);
    }
}