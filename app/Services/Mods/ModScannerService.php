<?php

namespace Pterodactyl\Services\Mods;

use ZipArchive;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\Server;

class ModScannerService
{
    private const CACHE_TTL_SECONDS = 604800;
    private const MAX_HASH_BYTES = 268435456;

    public function scan(Server $server, object $fileRepository, string $directory = 'mods', string $mode = 'quick'): array
    {
        $directory = trim($directory, '/');
        if ($directory === '') {
            $directory = 'mods';
        }

        $files = collect($fileRepository->setServer($server)->getDirectory('/' . $directory))
            ->filter(fn (array $file) => $this->isModFile($file))
            ->sortBy(fn (array $file) => strtolower((string) Arr::get($file, 'name')))
            ->values();

        $entries = [];
        $stats = [
            'total' => 0,
            'cached' => 0,
            'scanned' => 0,
            'pending' => 0,
            'failed' => 0,
        ];

        foreach ($files as $file) {
            $stats['total']++;

            $name = (string) Arr::get($file, 'name');
            $path = $directory . '/' . $name;
            $fingerprint = $this->fingerprint($file);
            $cacheKey = $this->cacheKey($server, $path, $fingerprint);
            $cached = Cache::get($cacheKey);
            $shouldScan = $mode === 'full' || ($mode === 'missing' && !$cached);

            if ($cached && !$shouldScan) {
                $stats['cached']++;
                $entries[] = $this->entry($file, $directory, $fingerprint, 'cached', $cached);
                continue;
            }

            if (!$shouldScan) {
                $stats['pending']++;
                $entries[] = $this->entry($file, $directory, $fingerprint, 'pending');
                continue;
            }

            try {
                $contents = $fileRepository->setServer($server)->getContent('/' . $path, self::MAX_HASH_BYTES);
                $result = [
                    'sha1' => sha1($contents),
                    'metadata' => $this->readJarMetadata($contents),
                ];

                Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);
                $stats['scanned']++;
                $entries[] = $this->entry($file, $directory, $fingerprint, 'scanned', $result);
            } catch (\Throwable $exception) {
                $stats['failed']++;
                $entries[] = $this->entry($file, $directory, $fingerprint, 'failed', null, $exception->getMessage());
            }
        }

        return [
            'data' => $entries,
            'meta' => [
                'directory' => $directory,
                'mode' => $mode,
                ...$stats,
            ],
        ];
    }

    private function isModFile(array $file): bool
    {
        if (!Arr::get($file, 'file', true)) {
            return false;
        }

        return preg_match('/\.jar(?:\.disabled)?$/i', (string) Arr::get($file, 'name')) === 1;
    }

    private function fingerprint(array $file): string
    {
        return implode(':', [
            (string) Arr::get($file, 'size', 0),
            CarbonImmutable::parse(Arr::get($file, 'modified', 'now'))->getTimestamp(),
        ]);
    }

    private function cacheKey(Server $server, string $path, string $fingerprint): string
    {
        $normalizedPath = preg_replace('/\.disabled$/i', '', $path) ?? $path;

        return sprintf('mods:scan:%s:%s:%s', $server->uuid, sha1($normalizedPath), sha1($fingerprint));
    }

    private function entry(
        array $file,
        string $directory,
        string $fingerprint,
        string $status,
        ?array $scan = null,
        ?string $error = null,
    ): array {
        $name = (string) Arr::get($file, 'name');

        return [
            'path' => $directory . '/' . $name,
            'name' => $name,
            'enabled' => !str_ends_with(strtolower($name), '.disabled'),
            'size' => (int) Arr::get($file, 'size', 0),
            'modified_at' => CarbonImmutable::parse(Arr::get($file, 'modified', 'now'))->toAtomString(),
            'fingerprint' => $fingerprint,
            'sha1' => $scan['sha1'] ?? null,
            'metadata' => $scan['metadata'] ?? [
                'mod_id' => null,
                'name' => null,
                'version' => null,
                'source' => null,
            ],
            'scan_status' => $status,
            'error' => $error,
        ];
    }

    private function readJarMetadata(string $contents): array
    {
        $empty = [
            'mod_id' => null,
            'name' => null,
            'version' => null,
            'source' => null,
        ];

        if (!class_exists(ZipArchive::class)) {
            return $empty;
        }

        $tmp = tempnam(sys_get_temp_dir(), 'pyro-mod-');
        if (!$tmp) {
            return $empty;
        }

        try {
            file_put_contents($tmp, $contents);
            $zip = new ZipArchive();
            if ($zip->open($tmp) !== true) {
                return $empty;
            }

            try {
                $fabric = $this->readJsonMember($zip, 'fabric.mod.json');
                if ($fabric) {
                    return [
                        'mod_id' => $fabric['id'] ?? null,
                        'name' => $fabric['name'] ?? null,
                        'version' => $fabric['version'] ?? null,
                        'source' => 'fabric.mod.json',
                    ];
                }

                $quilt = $this->readJsonMember($zip, 'quilt.mod.json');
                if ($quilt) {
                    $loader = $quilt['quilt_loader'] ?? [];

                    return [
                        'mod_id' => $loader['id'] ?? null,
                        'name' => $loader['metadata']['name'] ?? null,
                        'version' => $loader['version'] ?? null,
                        'source' => 'quilt.mod.json',
                    ];
                }

                $modsToml = $zip->getFromName('META-INF/mods.toml');
                if (is_string($modsToml)) {
                    return [
                        ...$this->parseModsToml($modsToml),
                        'source' => 'mods.toml',
                    ];
                }
            } finally {
                $zip->close();
            }
        } finally {
            @unlink($tmp);
        }

        return $empty;
    }

    private function readJsonMember(ZipArchive $zip, string $name): ?array
    {
        $contents = $zip->getFromName($name);
        if (!is_string($contents)) {
            return null;
        }

        $decoded = json_decode($contents, true);

        return is_array($decoded) ? $decoded : null;
    }

    private function parseModsToml(string $toml): array
    {
        $modId = null;
        $name = null;
        $version = null;
        $inModsBlock = false;

        foreach (preg_split('/\R/', $toml) ?: [] as $line) {
            $line = trim(preg_replace('/#.*/', '', $line) ?? '');
            if ($line === '') {
                continue;
            }

            if ($line === '[[mods]]') {
                $inModsBlock = true;
                continue;
            }

            if ($inModsBlock && str_starts_with($line, '[') && $line !== '[[mods]]') {
                break;
            }

            if (!$inModsBlock || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = array_map('trim', explode('=', $line, 2));
            $value = trim($value, "\"'");

            if ($key === 'modId') {
                $modId = $value;
            } elseif ($key === 'displayName') {
                $name = $value;
            } elseif ($key === 'version' && !str_starts_with($value, '${')) {
                $version = $value;
            }
        }

        return [
            'mod_id' => $modId,
            'name' => $name,
            'version' => $version,
        ];
    }
}
