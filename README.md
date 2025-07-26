# Sistema de Pagamento PIX Simulado

Este é um sistema web completo para simulação de pagamentos PIX, desenvolvido com uma arquitetura moderna e robusta, separando o backend do frontend. A aplicação permite o cadastro de usuários, geração de cobranças PIX com tempo de expiração, confirmação de pagamento e um dashboard para visualização de métricas em tempo real.

## 1. Arquitetura e Tecnologias

A aplicação é construída sobre uma arquitetura de serviços desacoplados, com um backend em **Laravel** e um frontend em **React (Vite)**.

-   **Backend (Laravel 12)**: Uma API RESTful responsável por toda a lógica de negócio, incluindo autenticação de usuários, gerenciamento de pagamentos PIX e comunicação com o banco de dados.
-   **Frontend (React 19)**: Uma Single Page Application (SPA) que consome a API do backend, oferecendo uma interface de usuário reativa e moderna para interagir com o sistema.
-   **Banco de Dados (MySQL 8.0)**: Utilizado para persistir os dados da aplicação, como usuários e transações PIX.
-   **Containerização (Docker)**: O ambiente de desenvolvimento do backend é orquestrado com Docker e Docker Compose, garantindo consistência e facilidade na configuração.

## 2. Fluxo de Funcionamento

1.  **Registro e Login**: O usuário cria uma conta e se autentica no sistema.
2.  **Geração de PIX**: O usuário autenticado pode gerar uma nova cobrança PIX, especificando um valor e uma descrição. O sistema cria um registro com status `generated` e um tempo de expiração.
3.  **Exibição do QR Code**: Um QR Code é gerado para a cobrança, apontando para a URL de confirmação.
4.  **Confirmação de Pagamento**: Ao acessar a URL do QR Code (simulando a leitura por um app de banco), o sistema valida o token. Se a cobrança não estiver expirada, seu status é alterado para `paid`. Caso contrário, o status muda para `expired`.
5.  **Dashboard**: O usuário pode visualizar um dashboard com estatísticas em tempo real sobre seus PIX (gerados, pagos, expirados) e um gráfico de linha do tempo.

---

## 3. Instalação e Execução

A abordagem recomendada é executar o backend com Docker e o frontend localmente na sua máquina.

### Pré-requisitos

-   [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
-   [Node.js >= 20.x](https://nodejs.org/en/) (versão LTS recomendada)
-   [NPM](https://www.npmjs.com/get-npm) ou [Yarn](https://yarnpkg.com/)

### Passos para Instalação

1.  **Clonar o Repositório**
    ```bash
    git clone https://github.com/iurynathan/laravel-pix-system.git
    cd laravel-pix-system
    ```

2.  **Configurar e Iniciar o Backend (Docker)**
    a. **Variáveis de Ambiente**: Navegue até a pasta `backend` e crie seu arquivo `.env`.
    ```bash
    cd backend
    cp .env.example .env
    cd ..
    ```
    b. **Iniciar Contêineres**: Suba os serviços do Docker (Laravel, MySQL).
    ```bash
    docker-compose up -d --build
    ```
    c. **Instalar Dependências**: Use o Composer dentro do contêiner.
    ```bash
    docker-compose exec app composer install
    ```
    d. **Gerar Chave da Aplicação**:
    ```bash
    docker-compose exec app php artisan key:generate
    ```
    e. **Executar Migrações e Seeds**: Crie a estrutura do banco e popule com dados iniciais.
    ```bash
    docker-compose exec app php artisan migrate --seed
    ```

3.  **Configurar e Iniciar o Frontend (Local)**
    a. **Navegue até a pasta `frontend`**:
    ```bash
    cd frontend
    ```
    b. **Instale as dependências**:
    ```bash
    npm install
    ```
    c. **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

4.  **Pronto!**
    A aplicação está em execução e pronta para ser acessada:
    -   **Frontend**: [http://localhost:5173](http://localhost:5173)
    -   **Backend API**: [http://localhost:8000](http://localhost:8000)
    -   **Mailhog**: [http://localhost:8025](http://localhost:8025)
    -   **phpMyAdmin**: [http://localhost:8080](http://localhost:8080)

---

## 4. Documentação da API

A API está disponível em `http://localhost:8000/api`.

### Autenticação

#### `POST /auth/register`
Registra um novo usuário.

-   **Payload:**
    ```json
    {
      "name": "Test User",
      "email": "test@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
    ```
-   **Resposta de Sucesso (201):**
    ```json
    {
      "success": true,
      "message": "Usuário registrado com sucesso",
      "data": {
        "access_token": "1|...",
        "token_type": "Bearer",
        "user": { "id": 1, "name": "Test User", "email": "test@example.com" }
      }
    }
    ```

#### `POST /auth/login`
Autentica um usuário e retorna um token de acesso.

-   **Payload:**
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
-   **Resposta de Sucesso (200):**
    ```json
    {
      "success": true,
      "message": "Login realizado com sucesso",
      "data": {
        "access_token": "2|...",
        "token_type": "Bearer",
        "user": { "id": 1, "name": "Test User", "email": "test@example.com" }
      }
    }
    ```

#### `POST /auth/logout`
Invalida o token de acesso do usuário. (Requer autenticação)

#### `GET /auth/me`
Retorna os dados do usuário autenticado. (Requer autenticação)

### Pagamentos PIX

#### `POST /pix`
Cria uma nova cobrança PIX. (Requer autenticação)

-   **Payload:**
    ```json
    {
      "amount": 150.50,
      "description": "Venda de produto X"
    }
    ```
-   **Resposta de Sucesso (201):**
    Retorna o objeto `PixPayment` recém-criado (ver estrutura abaixo).

#### `GET /pix`
Lista as cobranças PIX do usuário autenticado com filtros e paginação. (Requer autenticação)

-   **Parâmetros de Query:**
    -   `status`: `generated`, `paid`, `expired`
    -   `search`: `string` (busca na descrição)
    -   `start_date`, `end_date`: `YYYY-MM-DD`
    -   `min_value`, `max_value`: `numeric`
    -   `sort_by`: `created_at`, `amount`, `status`
    -   `sort_direction`: `asc`, `desc`
    -   `per_page`: `integer` (default: 15)

#### `GET /pix/{id}`
Exibe os detalhes de uma cobrança PIX específica. (Requer autenticação)

#### `DELETE /pix/{id}`
Remove uma cobrança PIX. (Requer autenticação)

#### `GET /pix/statistics`
Retorna estatísticas (`total`, `paid`, `expired`) para o dashboard. (Requer autenticação)

#### `GET /pix/timeline`
Retorna dados para o gráfico de linha do tempo do dashboard. (Requer autenticação)

#### `POST /pix/confirm/{token}`
Confirma o pagamento de um PIX. (Rota pública)

#### `GET /pix/qrcode/{token}`
Retorna a imagem PNG do QR Code para um PIX. (Rota pública)

### Estrutura do Objeto `PixPayment`
```json
{
  "id": 1,
  "token": "uuid-string-here",
  "amount": 150.50,
  "description": "Venda de produto X",
  "status": "generated",
  "expires_at": "2025-07-25T22:10:00.000000Z",
  "paid_at": null,
  "created_at": "2025-07-25T22:00:00.000000Z",
  "updated_at": "2025-07-25T22:00:00.000000Z",
  "qr_code_url": "http://localhost:8000/api/pix/qrcode/uuid-string-here",
  "remaining_time": 599, // em segundos
  "is_expired": false,
  "is_paid": false,
  "can_be_paid": true,
  "company": {
    "name": "Nome da Empresa Fictícia",
    "city": "Cidade Fictícia"
  }
}
```

---

## 5. Comandos Úteis

### Testes Automatizados

-   **Backend (Laravel/PHPUnit):**
    ```bash
    # Com Docker
    docker-compose exec app php artisan test
    # Manualmente
    (cd backend && php artisan test)
    ```

-   **Frontend (React/Vitest):**
    ```bash
    # Manualmente
    (cd frontend && npm test)
    # Para ver a cobertura de testes
    (cd frontend && npm run test:coverage)
    ```

### Análise de Código (Linting e Formatação)

Execute estes comandos na pasta `frontend`.

-   **Verificar e corrigir erros (ESLint):**
    ```bash
    npm run lint
    npm run lint:fix
    ```
-   **Verificar e corrigir formatação (Prettier):**
    ```bash
    npm run format:check
    npm run format
    ```

### Comandos de Backend (Artisan)

#### Limpeza de PIX Expirados (Agendado)

O sistema possui uma tarefa agendada para limpar automaticamente cobranças PIX que já expiraram.

-   **Comando**: `php artisan pix:cleanup-expired`
-   **Agendamento**: A tarefa é executada **por minuto**. A configuração pode ser encontrada em `backend/routes/console.php`.
-   **Execução Via Docker**: Para executar a limpeza manualmente, use o Docker:
    ```bash
    docker-compose exec app php artisan pix:cleanup-expired
    ```

#### Geração de Dados de Teste

Para popular o ambiente de desenvolvimento com dados de teste realistas para o dashboard, utilize o seguinte comando:

-   **Comando**: `php artisan pix:generate-test-data`
-   **Descrição**: Gera um número configurável de pagamentos PIX, distribuídos ao longo de um período de dias, associados ao usuário administrador.
-   **Uso Básico**:
    ```bash
    # Gera 300 PIX distribuídos em 30 dias
    docker-compose exec app php artisan pix:generate-test-data
    ```
-   **Parâmetros e Opções**:
    -   `count`: Define o número de registros a serem criados (ex: `1000`).
    -   `days`: Define o período em dias para distribuir os registros (ex: `90`).
    -   `--fresh`: Limpa a tabela `pix_payments` antes de inserir os novos dados.
    -   `--fresh-user`: Limpa as tabelas `pix_payments` e `users` (CUIDADO: apaga todos os usuários).
-   **Exemplo Avançado**:
    ```bash
    # Gera 1000 PIX distribuídos nos últimos 90 dias, limpando dados antigos
    docker-compose exec app php artisan pix:generate-test-data 1000 90 --fresh
    ```
