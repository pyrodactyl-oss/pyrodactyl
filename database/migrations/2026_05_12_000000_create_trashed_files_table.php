<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trashed_files', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('server_id');
            $table->string('uuid')->unique();
            $table->string('original_root');
            $table->string('original_name');
            $table->string('trash_path');
            $table->boolean('is_directory')->default(false);
            $table->unsignedInteger('deleted_by')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->foreign('deleted_by')->references('id')->on('users')->onDelete('set null');

            $table->index('server_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trashed_files');
    }
};
