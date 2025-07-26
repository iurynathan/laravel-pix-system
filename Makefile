.PHONY: help setup up down restart logs shell db test fresh seed clear cache test-coverage-xml test-coverage-html coverage-open frontend-install frontend-dev frontend-build frontend-test frontend-test-coverage frontend-lint frontend-format coverage-front-open

help:
	@echo "🚀 Laravel PIX System - Commands"
	@echo ""
	@echo "🐳 Backend (Docker) Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v "frontend\|coverage" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🎨 Frontend Commands:"
	@grep -E '^frontend[a-zA-Z_-]*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[33m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📊 Coverage Commands:"
	@grep -E '^coverage[a-zA-Z_-]*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-20s\033[0m %s\n", $$1, $$2}'

setup:
	@echo "🏗️ Setting up Laravel PIX System..."
	docker-compose build
	docker-compose up -d
	docker-compose exec app bash -lc "composer create-project laravel/laravel /var/www --prefer-dist --no-interaction"
	docker-compose exec app bash -lc "cp /var/www/.env.example /var/www/.env && php /var/www/artisan key:generate"
	@echo "⏳ Waiting for database..."
	sleep 10
	docker-compose exec app bash -lc "php /var/www/artisan migrate:fresh --seed && php /var/www/artisan test"
	@echo "✅ Setup complete! Access: http://localhost"

install:
	docker-compose exec app composer install
	docker-compose exec app npm install

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

build:
	docker-compose up -d --build

logs:
	docker-compose logs -f

logs-app:
	docker-compose logs -f app

logs-nginx:
	docker-compose logs -f nginx

logs-mysql:
	docker-compose logs -f mysql

shell:
	docker-compose exec app bash

shell-root:
	docker-compose exec -u root app bash

db:
	docker-compose exec mysql mysql -u root -psecret laravel_pix

redis-cli:
	docker-compose exec redis redis-cli

migrate:
	docker-compose exec app php artisan migrate

fresh:
	docker-compose exec app php artisan migrate:fresh --seed

seed:
	docker-compose exec app php artisan db:seed

rollback:
	docker-compose exec app php artisan migrate:rollback

test:
	docker-compose exec app php artisan test

test-feature:
	docker-compose exec app php artisan test --testsuite=Feature

test-unit:
	docker-compose exec app php artisan test --testsuite=Unit

test-coverage:
	docker-compose exec app php artisan test --coverage

test-coverage-xml:
	docker-compose exec app php artisan test --env=testing --coverage-clover ./coverage.xml
	@echo "Coverage XML gerado em: backend/coverage.xml"

test-coverage-html:
	docker-compose exec app php artisan test --env=testing --coverage-html ./coverage-html
	@echo "Coverage HTML gerado em: backend/coverage-html/index.html"

coverage-open:
	@if command -v xdg-open > /dev/null; then \
		xdg-open backend/coverage-html/index.html; \
	elif command -v open > /dev/null; then \
		open backend/coverage-html/index.html; \
	else \
		echo "Abra manualmente: backend/coverage-html/index.html"; \
	fi

coverage-front-open:
	@if command -v xdg-open > /dev/null; then \
		xdg-open frontend/coverage/index.html; \
	elif command -v open > /dev/null; then \
		open frontend/coverage/index.html; \
	else \
		echo "Abra manualmente: frontend/coverage/index.html"; \
	fi

clear:
	docker-compose exec app php artisan cache:clear
	docker-compose exec app php artisan config:clear
	docker-compose exec app php artisan route:clear
	docker-compose exec app php artisan view:clear

cache:
	docker-compose exec app php artisan config:cache
	docker-compose exec app php artisan route:cache
	docker-compose exec app php artisan view:cache

npm-dev:
	docker-compose exec app npm run dev

npm-build:
	docker-compose exec app npm run build

npm-watch:
	docker-compose exec app npm run watch

key-generate:
	docker-compose exec app php artisan key:generate

permissions:
	sudo chown -R $$USER:$$USER .
	sudo chmod -R 755 storage bootstrap/cache

deploy:
	git pull origin main
	docker-compose exec app composer install --no-dev --optimize-autoloader
	docker-compose exec app php artisan migrate --force
	docker-compose exec app php artisan config:cache
	docker-compose exec app php artisan route:cache
	docker-compose exec app php artisan view:cache
	docker-compose exec app npm run build

clean:
	docker-compose down -v --remove-orphans
	docker-compose rm -f
	docker volume prune -f

stats:
	docker stats

ps:
	docker-compose ps

# 🎨 Frontend Commands
frontend-install:
	cd frontend && npm ci

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-test:
	cd frontend && npm run test

frontend-test-coverage:
	cd frontend && npm run test:coverage -- --run

frontend-lint:
	cd frontend && npm run lint

frontend-lint-fix:
	cd frontend && npm run lint:fix

frontend-format:
	cd frontend && npm run format

frontend-format-check:
	cd frontend && npm run format:check

frontend-type-check:
	cd frontend && npm run type-check

coverage-frontend: frontend-test-coverage coverage-front-open

coverage-backend: test-coverage-html coverage-open

coverage-all: coverage-backend coverage-frontend