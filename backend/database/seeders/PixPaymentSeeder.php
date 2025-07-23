<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PixPayment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PixPaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Criar usuário de teste se não existir
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Usuário Teste',
                'password' => bcrypt('password123'),
            ]
        );

        // Criar alguns PIX de exemplo
        $pixData = [
            [
                'amount' => 10.50,
                'description' => 'Teste PIX - Pagamento pendente',
                'status' => 'generated',
                'expires_at' => Carbon::now()->addMinutes(15),
            ],
            [
                'amount' => 25.00,
                'description' => 'Teste PIX - Pagamento pago',
                'status' => 'paid',
                'expires_at' => Carbon::now()->addMinutes(15),
                'paid_at' => Carbon::now()->subMinutes(5),
            ],
            [
                'amount' => 5.00,
                'description' => 'Teste PIX - Pagamento expirado',
                'status' => 'expired',
                'expires_at' => Carbon::now()->subMinutes(10),
            ],
        ];

        foreach ($pixData as $data) {
            PixPayment::create(array_merge($data, ['user_id' => $user->id]));
        }
    }
}