<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\QrCodeService;

class QrCodeServiceTest extends TestCase
{
    private QrCodeService $qrCodeService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->qrCodeService = new QrCodeService();
    }

    public function test_generate_pix_qr_code_returns_base64_string(): void
    {
        $qrCode = $this->qrCodeService->generatePixQrCode('test-token-123', 100.50, 'Test payment');

        $this->assertIsString($qrCode);
        $this->assertNotEmpty($qrCode);
        // Check if it's valid base64
        $this->assertNotFalse(base64_decode($qrCode, true));
    }

    public function test_generate_pix_qr_code_without_description(): void
    {
        $qrCode = $this->qrCodeService->generatePixQrCode('test-token-123', 50.0);

        $this->assertIsString($qrCode);
        $this->assertNotEmpty($qrCode);
    }

    public function test_generate_qr_code_url_returns_correct_route(): void
    {
        $url = $this->qrCodeService->generateQrCodeUrl('test-token-123');

        $this->assertStringContainsString('test-token-123', $url);
        $this->assertStringContainsString('qrcode', $url);
    }

    public function test_validate_pix_qr_code_with_valid_data(): void
    {
        $validQrCodeData = json_encode([
            'version' => '01',
            'transaction_currency' => '986',
            'country_code' => 'BR',
            'merchant_name' => 'Test Merchant'
        ]);

        $isValid = $this->qrCodeService->validatePixQrCode($validQrCodeData);

        $this->assertTrue($isValid);
    }

    public function test_validate_pix_qr_code_with_invalid_currency(): void
    {
        $invalidQrCodeData = json_encode([
            'version' => '01',
            'transaction_currency' => '840', // USD instead of BRL
            'country_code' => 'BR'
        ]);

        $isValid = $this->qrCodeService->validatePixQrCode($invalidQrCodeData);

        $this->assertFalse($isValid);
    }

    public function test_validate_pix_qr_code_with_invalid_country(): void
    {
        $invalidQrCodeData = json_encode([
            'version' => '01',
            'transaction_currency' => '986',
            'country_code' => 'US'
        ]);

        $isValid = $this->qrCodeService->validatePixQrCode($invalidQrCodeData);

        $this->assertFalse($isValid);
    }

    public function test_validate_pix_qr_code_with_missing_fields(): void
    {
        $invalidQrCodeData = json_encode([
            'version' => '01'
            // Missing required fields
        ]);

        $isValid = $this->qrCodeService->validatePixQrCode($invalidQrCodeData);

        $this->assertFalse($isValid);
    }

    public function test_validate_pix_qr_code_with_invalid_json(): void
    {
        $invalidQrCodeData = 'invalid json string';

        $isValid = $this->qrCodeService->validatePixQrCode($invalidQrCodeData);

        $this->assertFalse($isValid);
    }

    public function test_extract_pix_info_with_valid_data(): void
    {
        $qrCodeData = json_encode([
            'transaction_amount' => '150.75',
            'additional_info' => 'Payment for services',
            'merchant_name' => 'Test Store',
            'merchant_city' => 'São Paulo',
            'merchant_account' => [
                'url' => 'https://example.com/pix/confirm/token123'
            ]
        ]);

        $info = $this->qrCodeService->extractPixInfo($qrCodeData);

        $this->assertEquals(150.75, $info['amount']);
        $this->assertEquals('Payment for services', $info['description']);
        $this->assertEquals('Test Store', $info['merchant_name']);
        $this->assertEquals('São Paulo', $info['merchant_city']);
        $this->assertEquals('https://example.com/pix/confirm/token123', $info['url']);
    }

    public function test_extract_pix_info_with_missing_fields(): void
    {
        $qrCodeData = json_encode([
            'transaction_amount' => '100.00'
            // Missing other fields
        ]);

        $info = $this->qrCodeService->extractPixInfo($qrCodeData);

        $this->assertEquals(100.0, $info['amount']);
        $this->assertNull($info['description']);
        $this->assertNull($info['merchant_name']);
        $this->assertNull($info['merchant_city']);
        $this->assertNull($info['url']);
    }

    public function test_extract_pix_info_with_invalid_json_returns_default_values(): void
    {
        $invalidQrCodeData = 'invalid json';

        $info = $this->qrCodeService->extractPixInfo($invalidQrCodeData);

        $expected = [
            'amount' => 0.0,
            'description' => null,
            'merchant_name' => null,
            'merchant_city' => null,
            'url' => null
        ];
        
        $this->assertEquals($expected, $info);
    }

    public function test_extract_pix_info_with_zero_amount(): void
    {
        $qrCodeData = json_encode([
            'additional_info' => 'Zero amount payment'
        ]);

        $info = $this->qrCodeService->extractPixInfo($qrCodeData);

        $this->assertEquals(0.0, $info['amount']);
        $this->assertEquals('Zero amount payment', $info['description']);
    }

    public function test_generate_pix_qr_code_fallback_to_placeholder(): void
    {
        $qrCode = $this->qrCodeService->generatePixQrCode('test-token', 25.99, 'Fallback test');

        $this->assertIsString($qrCode);
        $this->assertNotEmpty($qrCode);
        $this->assertNotFalse(base64_decode($qrCode, true));
    }
}