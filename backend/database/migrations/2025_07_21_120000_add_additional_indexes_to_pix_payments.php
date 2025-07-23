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
            $table->index(['created_at'], 'idx_pix_payments_created_at');
            $table->index(['paid_at'], 'idx_pix_payments_paid_at');
            $table->index(['user_id', 'created_at'], 'idx_pix_payments_user_created');
            $table->index(['status', 'created_at'], 'idx_pix_payments_status_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pix_payments', function (Blueprint $table) {
            $table->dropIndex('idx_pix_payments_created_at');
            $table->dropIndex('idx_pix_payments_paid_at');
            $table->dropIndex('idx_pix_payments_user_created');
            $table->dropIndex('idx_pix_payments_status_created');
        });
    }
};