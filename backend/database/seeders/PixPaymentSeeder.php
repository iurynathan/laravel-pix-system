<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Faker\Factory as Faker;
use App\Models\User;
use Carbon\Carbon;

class PixPaymentSeeder extends Seeder
{
    public function run(): void
    {
        $totalPixTarget = (int) (getenv('PIX_COUNT') ?: 1000);
        $daysRange = (int) (getenv('PIX_DAYS')  ?: 60);

        $chunkSizeUsers = 1000;
        $chunkSizePix = 500;

        $usersNeeded = (int) ceil($totalPixTarget / 18);

        $this->command->info("👥 Precisamos de {$usersNeeded} usuários para gerar {$totalPixTarget} PIX.");

        DB::disableQueryLog();
        Cache::flush();

        $existing = User::count();
        if ($existing < $usersNeeded) {
            $toCreate = $usersNeeded - $existing;
            $hashedPassword = bcrypt('secret');
            $faker = Faker::create('pt_BR');
            $this->command->warn("⚠️  Criando {$toCreate} usuários em batches de {$chunkSizeUsers}...");

            $batch = [];
            for ($i = 0; $i < $toCreate; $i++) {
                $signupDate = Carbon::now()
                    ->subDays(rand(0, $daysRange))
                    ->addHours(rand(0, 23))
                    ->addMinutes(rand(0, 59))
                    ->format('Y-m-d H:i:s');

                $batch[] = [
                    'name' => $faker->name,
                    'email' => $faker->unique()->safeEmail,
                    'password' => $hashedPassword,
                    'is_admin' => false,
                    'email_verified_at' => $signupDate,
                    'created_at' => $signupDate,
                    'updated_at' => $signupDate,
                ];

                if (count($batch) >= $chunkSizeUsers) {
                    DB::table('users')->insert($batch);
                    $batch = [];
                }
            }

            if (!empty($batch)) {
                DB::table('users')->insert($batch);
            }

            $this->command->info("✅ Inseridos {$toCreate} usuários.");
        }

        $userIds = User::pluck('id')->all();
        $this->command->info("👥 Total de usuários: " . count($userIds));

        $batchPix = [];
        $countPix = 0;
        $remaining = $totalPixTarget;
        $remainingDays = $daysRange;

        $descriptions = [
            'Pagamento de serviço', 'Transferência PIX', 'Compra online',
            'Pagamento de conta', 'Recarga de celular', 'Pagamento de freelance',
            'Venda de produto', 'Divisão de conta', 'Pagamento de delivery',
            'Transferência entre amigos', 'Pagamento de aluguel', 'Cobrança de serviço',
            null,
        ];

        DB::transaction(function () use (
            $totalPixTarget, $daysRange, $chunkSizePix,
            &$batchPix, &$countPix, &$remaining, &$remainingDays,
            $descriptions, $userIds
        ) {
            for ($day = $daysRange - 1; $day >= 0; $day--) {
                $baseDate = Carbon::now()
                    ->subDays($day)
                    ->startOfDay();

                $avgRemaining = max(1, $remaining / $remainingDays);
                $variation = rand(70, 130) / 100;
                $dailyCount = max(1, (int) round($avgRemaining * $variation));

                if ($dailyCount > $remaining) {
                    $dailyCount = $remaining;
                }

                for ($i = 0; $i < $dailyCount; $i++) {
                    $createdAt = null;
                    if ($day === 0) {
                        $endRange = now()->subHour();
                        if ($endRange->isBefore($baseDate)) {
                            $endRange = $baseDate->copy()->addMinutes(5);
                        }
                        $randomTimestamp = rand($baseDate->timestamp, $endRange->timestamp);
                        $createdAt = Carbon::createFromTimestamp($randomTimestamp);
                    } else {
                        $createdAt = $baseDate->copy()
                            ->addHours(rand(0, 23))
                            ->addMinutes(rand(0, 59));
                    }

                    $status = $this->getRandomStatus($day);
                    $paidAt = $status === 'paid'
                        ? $createdAt->copy()->addMinutes(rand(1, 9))
                        : null;
                    $expiresAt = $status === 'expired'
                        ? $createdAt->copy()->subMinutes(rand(1, 60))
                        : $createdAt->copy()->addMinutes(10);

                    $batchPix[] = [
                        'user_id' => $userIds[array_rand($userIds)],
                        'amount' => $this->getRandomAmount(),
                        'description' => $descriptions[array_rand($descriptions)],
                        'status' => $status,
                        'token' => Str::uuid()->toString(),
                        'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
                        'paid_at' => $paidAt?->format('Y-m-d H:i:s'),
                        'created_at' => $createdAt->format('Y-m-d H:i:s'),
                        'updated_at' => ($paidAt ?? $createdAt)->format('Y-m-d H:i:s'),
                    ];

                    $countPix++;
                    $remaining--;
                }

                if (count($batchPix) >= $chunkSizePix) {
                    usort($batchPix, fn($a, $b) =>
                        strtotime($a['created_at']) <=> strtotime($b['created_at'])
                    );
                    DB::table('pix_payments')->insert($batchPix);
                    $batchPix = [];
                }

                $remainingDays--;
            }

            if (!empty($batchPix)) {
                usort($batchPix, fn($a, $b) =>
                    strtotime($a['created_at']) <=> strtotime($b['created_at'])
                );
                DB::table('pix_payments')->insert($batchPix);
            }
        });

        if ($remaining > 0) {
            DB::table('pix_payments')->insert([
                [
                    'user_id' => $userIds[array_rand($userIds)],
                    'amount' => $this->getRandomAmount(),
                    'description' => 'PIX extra hoje',
                    'status' => 'generated',
                    'token' => Str::uuid()->toString(),
                    'expires_at' => now()->addMinutes(10)->format('Y-m-d H:i:s'),
                    'paid_at' => null,
                    'created_at' => now()->format('Y-m-d H:i:s'),
                    'updated_at' => now()->format('Y-m-d H:i:s'),
                ],
            ]);
            $this->command->info("✨ Inserido {$remaining} PIX extra(s) para hoje.");
        }

        $this->command->info("✅ Total de PIX gerados: {$totalPixTarget}.");
    }

    private function getRandomStatus(int $daysAgo): string
    {
        if ($daysAgo > 20) {
            return ['paid','expired','generated'][rand(0,2)];
        } elseif ($daysAgo > 10) {
            return ['paid','paid','generated','expired'][rand(0,3)];
        }
        return ['paid','generated','generated'][rand(0,2)];
    }

    private function getRandomAmount(): float
    {
        $ranges = [[1,50],[50,200],[200,1000],[1000,5000]];
        $weights = [40,35,20,5];
        $rand = rand(1, array_sum($weights));
        $cum = 0;
        foreach ($weights as $i => $w) {
            $cum += $w;
            if ($rand <= $cum) {
                [$min, $max] = $ranges[$i];
                return round(rand($min * 100, $max * 100) / 100, 2);
            }
        }
        return 50.00;
    }
}
