<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | PIX Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for PIX payment system
    |
    */

    'expiration_minutes' => (int) env('PIX_EXPIRATION_MINUTES', 10),
    
    'qr_code' => [
        'size' => (int) env('PIX_QR_CODE_SIZE', 200),
    ],

    'limits' => [
        'min_amount' => (float) env('PIX_MIN_AMOUNT', 0.01),
        'max_amount' => (float) env('PIX_MAX_AMOUNT', 99999.99),
    ],

    'rate_limiting' => [
        'create' => env('PIX_RATE_LIMIT_CREATE', '10,1'), // 10 requests per minute
        'confirm' => env('PIX_RATE_LIMIT_CONFIRM', '10,1'), // 10 requests per minute
    ],

    'cleanup' => [
        'expired_after_days' => env('PIX_CLEANUP_EXPIRED_DAYS', 30),
        'schedule_enabled' => env('PIX_CLEANUP_SCHEDULE_ENABLED', true),
    ],

    'simulation' => [
        'company' => [
            'name' => 'TechPay Soluções Digitais LTDA',
            'trade_name' => 'TechPay',
            'cnpj' => '11.222.333/0001-81',
            'cnpj_masked' => '11.222.**/****-81',
            'institution' => [
                'name' => 'Nubank',
                'code' => '260',
                'short_name' => 'NUBANK'
            ],
            'pix_key' => [
                'type' => 'cnpj',
                'value' => '11222333000181',
                'masked' => '11.222.**/****-81',
                'label' => 'CNPJ'
            ],
            'address' => [
                'city' => 'São Paulo',
                'state' => 'SP'
            ]
        ]
    ],
];