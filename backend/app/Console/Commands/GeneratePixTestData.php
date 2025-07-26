<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\PixPaymentSeeder;
use App\Models\PixPayment;
use Illuminate\Support\Facades\DB;

class GeneratePixTestData extends Command
{
    protected $signature = 'pix:generate-test-data 
                            {count=300 : Number of PIX payments to generate} 
                            {days=30 : Number of days to distribute the PIX over}
                            {--fresh : Clear existing PIX data before generating new data}
                            {--fresh-user : Clear existing user data before generating new data}';

    protected $description = 'Generate test PIX payment data with specified parameters';

    public function handle(): int
    {
        $count = (int) $this->argument('count');
        $days = (int) $this->argument('days');
        $fresh = $this->option('fresh');
        $freshUser = $this->option('fresh-user');

        if ($count < 1 || $count > 10000) {
            $this->error('❌ Count must be between 1 and 10,000');
            return self::FAILURE;
        }

        if ($days < 1 || $days > 365) {
            $this->error('❌ Days must be between 1 and 365');
            return self::FAILURE;
        }

        $this->info("🎯 Gerando {$count} PIX de teste distribuídos em {$days} dias...");

        if ($freshUser) {
            $this->warn('🗑️  Limpando dados de usuários e PIX existentes...');

            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            PixPayment::truncate();
            DB::table('users')->truncate();

            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            $this->info('✅ Dados de usuários e PIX limpos com sucesso!');
        } elseif ($fresh) {
            $this->warn('🗑️  Limpando dados PIX existentes...');
            PixPayment::truncate();
            $this->info('✅ Dados de PIX limpos com sucesso!');
        }
        
        $admin = \App\Models\User::where('email', 'admin@pixsystem.com')->first();
        if (!$admin) {
            $admin = \App\Models\User::create([
                'name' => 'Administrador',
                'email' => 'admin@pixsystem.com',
                'password' => bcrypt('admin123'),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]);
            $this->info('👑 Usuário admin criado: admin@pixsystem.com / admin123');
        } else {
            $this->info('👑 Usuário admin já existe: admin@pixsystem.com');
        }

        $seeder = new PixPaymentSeeder();
        
        putenv("PIX_COUNT={$count}");
        putenv("PIX_DAYS={$days}");
        
        $seeder->setCommand($this);
        $seeder->run();
        
        $exitCode = 0;

        if ($exitCode === 0) {
            $this->newLine();
            $this->info('🎉 Dados de teste gerados com sucesso!');
            $this->info('📊 Acesse o dashboard para visualizar os gráficos com dados reais.');
        }

        return $exitCode;
    }
}
