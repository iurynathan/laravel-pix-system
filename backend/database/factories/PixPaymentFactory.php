<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PixPayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PixPayment>
 */
class PixPaymentFactory extends Factory
{
    protected $model = PixPayment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'amount' => fake()->randomFloat(2, 1, 1000),
            'description' => fake()->optional()->sentence(),
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15),
        ];
    }

    /**
     * Indicate that the PIX payment is paid.
     */
    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => 'paid',
            'paid_at' => Carbon::now(),
        ]);
    }

    /**
     * Indicate that the PIX payment is expired.
     */
    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => 'expired',
            'expires_at' => Carbon::now()->subMinutes(1),
        ]);
    }

    /**
     * Indicate that the PIX payment has a specific amount.
     */
    public function withAmount(float $amount): static
    {
        return $this->state(fn () => [
            'amount' => $amount,
        ]);
    }
}