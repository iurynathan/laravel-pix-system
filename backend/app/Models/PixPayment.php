<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($pixPayment) {
            if (empty($pixPayment->token)) {
                $pixPayment->token = Str::uuid()->toString();
            }
            
            if (empty($pixPayment->expires_at)) {
                $pixPayment->expires_at = Carbon::now()
                    ->addMinutes(config('pix.expiration_minutes', 10));
            }
        });
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'generated')
                    ->where('expires_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'generated')
                    ->where('expires_at', '<=', now());
    }

    public function scopeByStatus($query, string $status)
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
        return route('pix.confirm', ['token' => $this->token]);
    }

    public function getRemainingTime(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        return $this->expires_at->diffInSeconds(now());
    }
}
