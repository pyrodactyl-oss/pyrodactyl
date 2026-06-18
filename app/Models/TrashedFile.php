<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pterodactyl\Models\TrashedFile.
 *
 * @property int $id
 * @property int $server_id
 * @property string $uuid
 * @property string $original_root
 * @property string $original_name
 * @property string $trash_path
 * @property int|null $deleted_by
 * @property \Illuminate\Support\Carbon|null $created_at
 *
 * @property \Pterodactyl\Models\Server $server
 * @property \Pterodactyl\Models\User|null $deleter
 */
class TrashedFile extends Model
{
    public $timestamps = false;

    protected $table = 'trashed_files';

    protected $attributes = [
        'is_directory' => false,
    ];

    protected $fillable = [
        'server_id',
        'uuid',
        'original_root',
        'original_name',
        'trash_path',
        'deleted_by',
        'created_at',
    ];

    protected $casts = [
        'server_id' => 'integer',
        'deleted_by' => 'integer',
        'is_directory' => 'boolean',
        'created_at' => 'datetime',
    ];

    public static array $validationRules = [
        'server_id' => 'required|integer|exists:servers,id',
        'uuid' => 'required|string|max:191',
        'original_root' => 'required|string',
        'original_name' => 'required|string',
        'trash_path' => 'required|string',
        'deleted_by' => 'nullable|integer',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
