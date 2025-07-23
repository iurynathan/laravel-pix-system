#!/bin/bash

# Aguardar o banco de dados estar pronto
echo "Aguardando banco de dados..."
sleep 5

# Executar migrations se necessário
if [ ! -f /var/www/.migrated ]; then
    php artisan migrate --force
    touch /var/www/.migrated
fi

# Iniciar servidor Laravel
echo "Iniciando servidor Laravel na porta 8000..."
exec php artisan serve --host=0.0.0.0 --port=8000