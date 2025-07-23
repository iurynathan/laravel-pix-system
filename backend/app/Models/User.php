<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function pixPayments(): HasMany
    {
        return $this->hasMany(PixPayment::class);
    }

    // ✅ Business Methods
    public function getPixStatistics(): array
    {
        $stats = $this->pixPayments()
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "generated" THEN 1 ELSE 0 END) as generated,
                SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid,
                SUM(CASE WHEN status = "expired" THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN status = "paid" THEN amount ELSE 0 END) as total_paid
            ')
            ->first();

        return [
            'total' => $stats->total ?? 0,
            'generated' => $stats->generated ?? 0,
            'paid' => $stats->paid ?? 0,
            'expired' => $stats->expired ?? 0,
            'total_amount' => $stats->total_paid ?? 0,
        ];
    }
}