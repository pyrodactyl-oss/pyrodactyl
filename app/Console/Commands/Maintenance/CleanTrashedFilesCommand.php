<?php

namespace Pterodactyl\Console\Commands\Maintenance;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Pterodactyl\Models\TrashedFile;
use Pterodactyl\Repositories\Eloquent\SettingsRepository;

class CleanTrashedFilesCommand extends Command
{
    protected $description = 'Permanently delete trashed files that have exceeded the retention period.';

    protected $signature = 'p:maintenance:clean-trash {--days= : Override the retention days setting}';

    public function __construct(private SettingsRepository $settings)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $days = $this->option('days')
            ?? $this->settings->get('settings::pterodactyl:trash:retention_days', 30);

        $cutoff = CarbonImmutable::now()->subDays((int) $days);

        $expired = TrashedFile::with('server.node')->where('created_at', '<', $cutoff)->get();

        if ($expired->isEmpty()) {
            $this->info('No expired trashed files to clean up.');

            return self::SUCCESS;
        }

        $count = $expired->count();
        $this->info("Cleaning up {$count} expired trashed file(s)...");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($expired as $file) {
            try {
                $server = $file->server;
                if ($server) {
                    $repository = $server->getFileRepository();
                    $repository->setServer($server)->deleteFiles('/', [$file->trash_path]);
                }
            } catch (\Exception $e) {
                $this->warn("Failed to delete {$file->uuid}: {$e->getMessage()}");
            }
            $file->delete();
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Trash cleanup completed.');

        return self::SUCCESS;
    }
}
