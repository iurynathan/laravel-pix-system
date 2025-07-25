<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pix_payments', function (Blueprint $table) {
            $table->index(['user_id', 'description'], 'idx_pix_payments_user_description');
            $table->index(['description'], 'idx_pix_payments_description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pix_payments', function (Blueprint $table) {
            $table->dropIndex('idx_pix_payments_user_description');
            $table->dropIndex('idx_pix_payments_description');  
        });
    }
};
