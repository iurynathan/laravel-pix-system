<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PixPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'token',
        'amount',
        'description',
        'status',
        'expires_at',
        'paid_at',
        'metadata'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
        'metadata' => 'array',
        'amount' => 'decimal:2'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function boot(): void
    {
        parent::boot();
        
        static::creating(function (PixPayment $pixPayment): void {
            if (empty($pixPayment->token)) {
                $pixPayment->token = Str::uuid()->toString();
            }
            
            if (empty($pixPayment->expires_at)) {
                $pixPayment->expires_at = Carbon::now()
                    ->addMinutes(config('pix.expiration_minutes', 10));
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'generated')
                    ->where('expires_at', '>', now());
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('status', 'generated')
                    ->where('expires_at', '<=', now());
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function isExpired(): bool
    {
        return $this->status === 'generated' && 
               $this->expires_at->isPast();
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function canBePaid(): bool
    {
        return $this->status === 'generated' && 
               !$this->isExpired();
    }

    public function markAsPaid(): bool
    {
        if (!$this->canBePaid()) {
            return false;
        }

        return $this->update([
            'status' => 'paid',
            'paid_at' => now()
        ]);
    }

    public function markAsExpired(): bool
    {
        if ($this->status !== 'generated') {
            return false;
        }

        return $this->update([
            'status' => 'expired'
        ]);
    }

    public function getQrCodeUrl(): string
    {
        return route('api.pix.qrcode', ['token' => $this->token]);
    }

    /**
     * Gera QR Code em base64 para o PIX
     */
    public function getQrCodeBase64(): string
    {
        $qrCodeService = app(\App\Services\QrCodeService::class);
        return $qrCodeService->generatePixQrCode(
            $this->token, 
            (float) $this->amount, 
            $this->description
        );
    }

    public function getRemainingTime(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        $now = Carbon::now();

        if ($this->expires_at->lessThanOrEqualTo($now)) {
            return 0;
        }

        return (int) $now->diffInSeconds($this->expires_at);
    }

    /**
     * Transform model to API response format
     */
    public function toApiResponse(): array
    {
        return [
            'id' => $this->id,
            'token' => $this->token,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'status' => $this->status,
            'expires_at' => $this->expires_at->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'qr_code_url' => $this->getQrCodeUrl(),
            'remaining_time' => $this->getRemainingTime(),
            'is_expired' => $this->isExpired(),
            'is_paid' => $this->isPaid(),
            'can_be_paid' => $this->canBePaid(),
        ];
    }
}