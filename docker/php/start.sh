#!/bin/bash

# Aguardar o banco de dados estar pronto
echo "Aguardando banco de dados..."
sleep 5

# Executar migrations como usuário laravel
if [ ! -f /var/www/.migrated ]; then
    su laravel -c "php artisan migrate --force"
    touch /var/www/.migrated
fi

# Iniciar servidor Laravel como usuário laravel (mais seguro)
echo "Iniciando servidor Laravel na porta 8000..."
su laravel -c "php artisan serve --host=0.0.0.0 --port=8000" &

echo "⏱️ Iniciando scheduler em modo work..."
exec su laravel -c "php artisan schedule:work"
