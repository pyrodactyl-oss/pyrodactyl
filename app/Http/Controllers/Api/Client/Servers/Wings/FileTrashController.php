<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Wings;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\TrashedFile;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\DeleteFileRequest;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Ramsey\Uuid\Uuid;

class FileTrashController extends ClientApiController
{
    public function __construct(
        private DaemonFileRepository $fileRepository,
    ) {
        parent::__construct();
    }

    /**
     * List trashed files for the server, optionally filtered by original directory.
     */
    public function index(Request $request, Server $server): array
    {
        $query = TrashedFile::where('server_id', $server->id);

        if ($directory = $request->get('directory')) {
            $query->where('original_root', $directory);
        }

        $trashed = $query->orderBy('created_at', 'desc')->get();

        return [
            'object' => 'list',
            'data' => $trashed->map(fn (TrashedFile $f) => [
                'id' => $f->id,
                'uuid' => $f->uuid,
                'original_root' => $f->original_root,
                'original_name' => $f->original_name,
                'trash_path' => $f->trash_path,
                'is_directory' => $f->is_directory,
                'deleted_by' => $f->deleted_by,
                'trashed_at' => $f->created_at?->toIso8601String(),
            ]),
        ];
    }

    /**
     * Get total count of trashed files for the server.
     */
    public function count(Server $server): array
    {
        return [
            'count' => TrashedFile::where('server_id', $server->id)->count(),
        ];
    }

    /**
     * Move files/folders to trash (soft delete).
     */
    public function store(Server $server, DeleteFileRequest $request): JsonResponse
    {
        $root = $request->input('root') ?? '/';
        $files = $request->input('files', []);
        $batchUuid = Uuid::uuid4()->toString();
        $trashDir = '.trash';
        $batchDir = $trashDir . '/' . $batchUuid;

        try {
            $this->fileRepository->setServer($server)->createDirectory($trashDir, '/');
        } catch (\Exception) {
        }

        try {
            $this->fileRepository->setServer($server)->createDirectory($batchUuid, '/' . $trashDir);
        } catch (\Exception $e) {
            throw new DaemonConnectionException($e);
        }

        $moves = [];
        foreach ($files as $file) {
            $cleanFile = rtrim($file, '/');
            $trashPath = $batchDir . '/' . $cleanFile;
            $moves[] = [
                'from' => ltrim(trim($root, '/') . '/' . $cleanFile, '/'),
                'to' => $trashPath,
            ];

            TrashedFile::create([
                'server_id' => $server->id,
                'uuid' => Uuid::uuid4()->toString(),
                'original_root' => $root,
                'original_name' => $cleanFile,
                'trash_path' => $trashPath,
                'deleted_by' => $request->user()->id,
                'created_at' => CarbonImmutable::now(),
            ]);
        }

        try {
            $this->fileRepository->setServer($server)->renameFiles('/', $moves);
        } catch (\Exception $e) {
            TrashedFile::where('server_id', $server->id)
                ->whereIn('trash_path', array_column($moves, 'to'))
                ->delete();

            throw $e;
        }

        Activity::event('server:file.trash')
            ->property('directory', $root)
            ->property('files', $files)
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Restore a file or folder from trash.
     */
    public function restore(Server $server, TrashedFile $trashedFile): JsonResponse
    {
        if ($trashedFile->server_id !== $server->id) {
            abort(404);
        }

        $originalPath = ltrim(trim($trashedFile->original_root, '/') . '/' . $trashedFile->original_name, '/');

        try {
            $parentDir = dirname('/' . $originalPath);
            if ($parentDir !== '/') {
                try {
                    $this->fileRepository->setServer($server)->createDirectory(ltrim($parentDir, '/'), '/');
                } catch (\Exception) {
                }
            }
        } catch (\Exception) {
        }

        $this->fileRepository->setServer($server)->renameFiles('/', [
            [
                'from' => $trashedFile->trash_path,
                'to' => $originalPath,
            ],
        ]);

        Activity::event('server:file.restore')
            ->property('file', $trashedFile->original_name)
            ->property('directory', $trashedFile->original_root)
            ->log();

        $trashedFile->delete();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Permanently delete a single file/folder from trash.
     */
    public function destroy(Server $server, TrashedFile $trashedFile): JsonResponse
    {
        if ($trashedFile->server_id !== $server->id) {
            abort(404);
        }

        $this->fileRepository->setServer($server)->deleteFiles('/', [$trashedFile->trash_path]);

        Activity::event('server:file.trash-delete')
            ->property('file', $trashedFile->original_name)
            ->log();

        $trashedFile->delete();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Bulk restore trashed files by UUIDs.
     */
    public function bulkRestore(Server $server, Request $request): JsonResponse
    {
        $uuids = $request->input('uuids', []);
        $trashedFiles = TrashedFile::where('server_id', $server->id)->whereIn('uuid', $uuids)->get();

        $moves = [];
        foreach ($trashedFiles as $f) {
            $originalPath = ltrim(trim($f->original_root, '/') . '/' . $f->original_name, '/');
            $moves[] = ['from' => $f->trash_path, 'to' => $originalPath];
        }

        if (!empty($moves)) {
            $this->fileRepository->setServer($server)->renameFiles('/', $moves);
        }

        TrashedFile::whereIn('uuid', $uuids)->where('server_id', $server->id)->delete();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Bulk permanently delete trashed files by UUIDs.
     */
    public function bulkDestroy(Server $server, Request $request): JsonResponse
    {
        $uuids = $request->input('uuids', []);
        $trashedFiles = TrashedFile::where('server_id', $server->id)->whereIn('uuid', $uuids)->get();

        if ($trashedFiles->isNotEmpty()) {
            $paths = $trashedFiles->pluck('trash_path')->toArray();
            $this->fileRepository->setServer($server)->deleteFiles('/', $paths);
        }

        TrashedFile::whereIn('uuid', $uuids)->where('server_id', $server->id)->delete();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Empty all trash for the server.
     */
    public function empty(Server $server): JsonResponse
    {
        $trashedFiles = TrashedFile::where('server_id', $server->id)->get();

        if ($trashedFiles->isNotEmpty()) {
            $paths = $trashedFiles->pluck('trash_path')->toArray();
            $this->fileRepository->setServer($server)->deleteFiles('/', $paths);

            TrashedFile::where('server_id', $server->id)->delete();
        }

        Activity::event('server:file.trash-empty')->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
