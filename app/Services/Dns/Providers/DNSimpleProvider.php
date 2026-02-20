<?php

namespace Pterodactyl\Services\Dns\Providers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Pterodactyl\Contracts\Dns\DnsProviderInterface;
use Pterodactyl\Exceptions\Dns\DnsProviderException;

class DNSimpleProvider implements DnsProviderInterface
{
    private Client $client;
    private array $config;
    private ?string $accountId = null;

    public function __construct(array $config)
    {
        $this->config = $config;

        if (!empty($config['api_token'])) {
            $this->client = new Client([
                'base_uri' => 'https://api.dnsimple.com/v2/',
                'headers' => [
                    'Authorization' => 'Bearer ' . $config['api_token'],
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'timeout' => 30,
            ]);
        }
    }

    public function testConnection(): bool
    {
        if (!isset($this->client)) {
            throw DnsProviderException::invalidConfiguration('dnsimple', 'api_token');
        }

        try {
            $this->getAccountId();
            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('dnsimple', $e->getMessage());
        }
    }

    public function createRecord(string $domain, string $name, string $type, $content, int $ttl = 300): string
    {
        $accountId = $this->getAccountId();
        $zoneId = $domain; // DNSimple uses the domain name as the zone ID usually, or we can fetch it.

        try {
            $payload = [
                'name' => $name,
                'type' => strtoupper($type),
                'content' => is_array($content) ? ($content['content'] ?? json_encode($content)) : $content,
                'ttl' => $ttl,
            ];

            // Handle priority for MX/SRV if needed, but for now specific implementations might need parsing
            // For simple use cases, content is the value.

            $response = $this->client->post("{$accountId}/zones/{$zoneId}/records", [
                'json' => $payload,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return (string) $data['data']['id'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordCreationFailed($domain, $name, $e->getMessage());
        }
    }

    public function updateRecord(string $domain, string $recordId, $content, ?int $ttl = null): bool
    {
        $accountId = $this->getAccountId();
        $zoneId = $domain;

        try {
            $payload = [];
            if ($content) {
                $payload['content'] = is_array($content) ? ($content['content'] ?? json_encode($content)) : $content;
            }
            if ($ttl) {
                $payload['ttl'] = $ttl;
            }

            $this->client->patch("{$accountId}/zones/{$zoneId}/records/{$recordId}", [
                'json' => $payload,
            ]);

            return true;
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordUpdateFailed($domain, [$recordId], $e->getMessage());
        }
    }

    public function deleteRecord(string $domain, string $recordId): void
    {
        $accountId = $this->getAccountId();
        $zoneId = $domain;

        try {
            $this->client->delete("{$accountId}/zones/{$zoneId}/records/{$recordId}");
        } catch (GuzzleException $e) {
            throw DnsProviderException::recordDeletionFailed($domain, [$recordId], $e->getMessage());
        }
    }

    public function getRecord(string $domain, string $recordId): array
    {
        $accountId = $this->getAccountId();
        $zoneId = $domain;

        try {
            $response = $this->client->get("{$accountId}/zones/{$zoneId}/records/{$recordId}");
            $data = json_decode($response->getBody()->getContents(), true);

            return $data['data'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('dnsimple', $e->getMessage());
        }
    }

    public function listRecords(string $domain, ?string $name = null, ?string $type = null): array
    {
        $accountId = $this->getAccountId();
        $zoneId = $domain;

        try {
            $query = [];
            if ($name) {
                $query['name'] = $name;
            }
            if ($type) {
                $query['type'] = $type;
            }

            // DNSimple uses pagination, we might need to loop if there are many, but for now simple list
            $response = $this->client->get("{$accountId}/zones/{$zoneId}/records", [
                'query' => $query,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return $data['data'];
        } catch (GuzzleException $e) {
            throw DnsProviderException::connectionFailed('dnsimple', $e->getMessage());
        }
    }

    public function getConfigurationSchema(): array
    {
        return [
            'api_token' => [
                'type' => 'string',
                'required' => true,
                'description' => 'DNSimple API Access Token',
                'sensitive' => true,
            ],
            'account_id' => [
                'type' => 'string',
                'required' => false,
                'description' => 'DNSimple Account ID (Optional, will be auto-detected if not provided)',
                'sensitive' => false,
            ],
        ];
    }

    public function validateConfiguration(array $config): bool
    {
        if (empty($config['api_token'])) {
            throw DnsProviderException::invalidConfiguration('dnsimple', 'api_token');
        }
        return true;
    }

    public function getSupportedRecordTypes(): array
    {
        return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'CAA'];
    }

    private function getAccountId(): string
    {
        if ($this->accountId) {
            return $this->accountId;
        }

        if (!empty($this->config['account_id'])) {
            $this->accountId = $this->config['account_id'];
            return $this->accountId;
        }

        $response = $this->client->get('whoami');
        $data = json_decode($response->getBody()->getContents(), true);

        if (!isset($data['data']['account']['id'])) {
            throw new \Exception('Unable to determine Account ID from DNSimple API.');
        }

        $this->accountId = (string) $data['data']['account']['id'];
        return $this->accountId;
    }
}
