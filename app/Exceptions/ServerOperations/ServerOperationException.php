<?php

namespace Pterodactyl\Exceptions\ServerOperations;

use Exception;

class ServerOperationException extends Exception
{
    /**
     * Create a new server operation exception.
     */
    public function __construct(string $message = '', int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Create exception for when server cannot accept operations
     */
    public static function serverBusy(string $serverUuid): self
    {
        return new self(trans('exceptions.server_operations.server_busy', ['uuid' => $serverUuid]));
    }

    /**
     * Create exception for operation timeout
     */
    public static function operationTimedOut(string $operationId): self
    {
        return new self(trans('exceptions.server_operations.operation_timed_out', ['id' => $operationId]));
    }

    /**
     * Create exception for invalid operation state
     */
    public static function invalidOperationState(string $operationId, string $currentState): self
    {
        return new self(trans('exceptions.server_operations.invalid_operation_state', ['id' => $operationId, 'state' => $currentState]));
    }

    /**
     * Create exception for operation not found
     */
    public static function operationNotFound(string $operationId): self
    {
        return new self(trans('exceptions.server_operations.operation_not_found', ['id' => $operationId]));
    }

    /**
     * Create exception for rate limit exceeded
     */
    public static function rateLimitExceeded(string $operationType, int $windowSeconds): self
    {
        $minutes = ceil($windowSeconds / 60);
        return new self(trans('exceptions.server_operations.rate_limit_exceeded', ['type' => $operationType, 'minutes' => $minutes]));
    }
}