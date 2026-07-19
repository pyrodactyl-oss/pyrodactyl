<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('trashed_files', 'is_directory')) {
            Schema::table('trashed_files', function (Blueprint $table) {
                $table->boolean('is_directory')->default(false)->after('trash_path');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('trashed_files', 'is_directory')) {
            Schema::table('trashed_files', function (Blueprint $table) {
                $table->dropColumn('is_directory');
            });
        }
    }
};
