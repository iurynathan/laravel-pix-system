<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\PixPayment;
use App\Policies\PixPaymentPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(PixPayment::class, PixPaymentPolicy::class);
    }
}