<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PixController;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/pix/{token}', [PixController::class, 'confirm'])
    ->middleware('pix.rate_limit:confirm')
    ->name('api.pix.confirm');

Route::get('/pix/qrcode/{token}', [PixController::class, 'qrcode'])
    ->name('api.pix.qrcode');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
    
    Route::prefix('pix')->group(function () {
        Route::get('/', [PixController::class, 'index']);
        Route::get('/statistics', [PixController::class, 'statistics']);
        Route::get('/timeline', [PixController::class, 'timeline']);
        
        Route::post('/', [PixController::class, 'store'])
            ->middleware('pix.rate_limit:create');
            
        Route::get('/{pixPayment}', [PixController::class, 'show']);
        Route::delete('/{pixPayment}', [PixController::class, 'destroy']);
    });
});