# Laravel PIX System

Sistema de cobrança PIX fake desenvolvido com **Laravel MVC** + **TDD** + **Docker Compose**

## 📋 Visão Geral

Aplicação web completa que permite:
- ✅ Cadastro e autenticação de usuários
- ✅ Geração de cobranças PIX com QR Code
- ✅ Confirmação automática de pagamentos
- ✅ Dashboard em tempo real com métricas
- ✅ Testes automatizados (TDD)
- ✅ Versionamento colaborativo no GitHub

## 🚀 Setup Rápido

```bash
# Clone do repositório
git clone https://github.com/SEU-USUARIO/laravel-pix-system.git
cd laravel-pix-system

# Setup completo com um comando
make setup

# Frontend Structure

## Arquitetura Atomic Design + Feature-Based

### Atomic Design
- `components/atoms/` - Componentes básicos (Button, Input, Text)
- `components/molecules/` - Combinação de átomos (FormField, Card, Modal)
- `components/organisms/` - Seções complexas (Header, Sidebar, AuthForm)
- `components/templates/` - Layouts de páginas (AppLayout, AuthLayout)

### Features
- `features/auth/` - Autenticação (login, registro, logout)
- `features/pix/` - Geração e confirmação de PIX
- `features/dashboard/` - Estatísticas e gráficos

### Core Directories
- `services/` - Comunicação com API Laravel
- `hooks/` - Custom hooks reutilizáveis
- `context/` - Estados globais da aplicação
- `types/` - Definições TypeScript
- `utils/` - Funções utilitárias
- `test/` - Configurações e utilitários de teste
