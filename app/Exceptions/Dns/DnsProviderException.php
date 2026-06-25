<?php

namespace Pterodactyl\Exceptions\Dns;

use Exception;

class DnsProviderException extends Exception
{
    /**
     * Create a new DNS provider exception.
     */
    public function __construct(string $message = '', int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Create an exception for connection failures.
     */
    public static function connectionFailed(string $provider, string $reason = ''): self
    {
        $message = trans('exceptions.dns.connection_failed', ['provider' => $provider]);
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for authentication failures.
     */
    public static function authenticationFailed(string $provider): self
    {
        return new self(trans('exceptions.dns.authentication_failed', ['provider' => $provider]));
    }

    /**
     * Create an exception for invalid configuration.
     */
    public static function invalidConfiguration(string $provider, string $field): self
    {
        return new self(trans('exceptions.dns.invalid_configuration', ['provider' => $provider, 'field' => $field]));
    }

    /**
     * Create an exception for record creation failures.
     */
    public static function recordCreationFailed(string $domain, string $subdomain, string $reason = ''): self
    {
        $message = trans('exceptions.dns.record_creation_failed', ['subdomain' => $subdomain, 'domain' => $domain]);
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for record update failures.
     */
    public static function recordUpdateFailed(string $domain, array $recordIds, string $reason = ''): self
    {
        $recordList = implode(', ', $recordIds);
        $message = trans('exceptions.dns.record_update_failed', ['records' => $recordList, 'domain' => $domain]);
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for record deletion failures.
     */
    public static function recordDeletionFailed(string $domain, array $recordIds, string $reason = ''): self
    {
        $recordList = implode(', ', $recordIds);
        $message = trans('exceptions.dns.record_deletion_failed', ['records' => $recordList, 'domain' => $domain]);
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for unsupported record types.
     */
    public static function unsupportedRecordType(string $provider, string $recordType): self
    {
        return new self(trans('exceptions.dns.unsupported_record_type', ['provider' => $provider, 'recordType' => $recordType]));
    }
}