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
        // Usar um formato BR Code válido simulado ao invés de JSON
        $validQrCodeData = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913Test Merchant6009Sao Paulo6304ABCD';

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
                'url' => 'https://example.com/pix/token123'
            ]
        ]);

        $info = $this->qrCodeService->extractPixInfo($qrCodeData);

        $this->assertEquals(150.75, $info['amount']);
        $this->assertEquals('Payment for services', $info['description']);
        $this->assertEquals('Test Store', $info['merchant_name']);
        $this->assertEquals('São Paulo', $info['merchant_city']);
        $this->assertEquals('https://example.com/pix/token123', $info['url']);
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
            'merchant_trade_name' => null,
            'merchant_cnpj' => null,
            'merchant_city' => null,
            'merchant_state' => null,
            'merchant_institution' => null,
            'merchant_institution_code' => null,
            'pix_key_type' => null,
            'pix_key' => null,
            'url' => null,
            'company' => null
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

    public function test_get_company_data(): void
    {
        $companyData = $this->qrCodeService->getCompanyData();
        
        $this->assertIsArray($companyData);
        $this->assertArrayHasKey('trade_name', $companyData);
        $this->assertArrayHasKey('address', $companyData);
        $this->assertArrayHasKey('pix_key', $companyData);
    }

    public function test_generate_pix_payload_private_method(): void
    {
        $reflection = new \ReflectionClass($this->qrCodeService);
        $method = $reflection->getMethod('generatePixPayload');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->qrCodeService, 'test-token-123', 100.50, 'Test payment');
        
        $this->assertIsString($result);
        $this->assertStringStartsWith('00020', $result);
        $this->assertStringContainsString('5802BR', $result);
    }

    public function test_generate_pix_payload_without_amount_and_description(): void
    {
        $reflection = new \ReflectionClass($this->qrCodeService);
        $method = $reflection->getMethod('generatePixPayload');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->qrCodeService, 'test-token-456', 0, null);
        
        $this->assertIsString($result);
        $this->assertStringStartsWith('00020', $result);
    }

    public function test_format_tlv_private_method(): void
    {
        $reflection = new \ReflectionClass($this->qrCodeService);
        $method = $reflection->getMethod('formatTLV');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->qrCodeService, '00', '01');
        $this->assertEquals('000201', $result);
        
        $result = $method->invoke($this->qrCodeService, '26', 'test');
        $this->assertEquals('2604test', $result);
    }

    public function test_normalize_text_private_method(): void
    {
        $reflection = new \ReflectionClass($this->qrCodeService);
        $method = $reflection->getMethod('normalizeText');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->qrCodeService, 'Açúcar São Paulo');
        $this->assertStringNotContainsString('ç', $result);
        $this->assertStringNotContainsString('ã', $result);
        
        $result = $method->invoke($this->qrCodeService, 'Test@#$%Company');
        $this->assertEquals('TestCompany', $result);
        
        $result = $method->invoke($this->qrCodeService, 'Test Company-123.0');
        $this->assertEquals('Test Company-123.0', $result);
    }

    public function test_calculate_crc16_private_method(): void
    {
        $reflection = new \ReflectionClass($this->qrCodeService);
        $method = $reflection->getMethod('calculateCRC16');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->qrCodeService, '00020101021226580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000');
        $this->assertIsString($result);
        $this->assertEquals(4, strlen($result));
        $this->assertMatchesRegularExpression('/^[0-9A-F]{4}$/', $result);
        
        $result = $method->invoke($this->qrCodeService, '');
        $this->assertEquals('FFFF', $result);
        
        $result = $method->invoke($this->qrCodeService, 'test');
        $this->assertIsString($result);
        $this->assertEquals(4, strlen($result));
    }

    public function test_get_default_pix_info_private_method(): void
    {
        $reflection = new \ReflectionClass($this->qrCodeService);
        $method = $reflection->getMethod('getDefaultPixInfo');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->qrCodeService);
        
        $this->assertIsArray($result);
        $this->assertEquals(0.0, $result['amount']);
        $this->assertNull($result['description']);
        $this->assertNull($result['merchant_name']);
        $this->assertNull($result['pix_key']);
        $this->assertArrayHasKey('company', $result);
    }

    public function test_generate_placeholder_qr_code_private_method(): void
    {
        $reflection = new \ReflectionClass($this->qrCodeService);
        $method = $reflection->getMethod('generatePlaceholderQrCode');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->qrCodeService, 'test-token-789', 75.50, 'Placeholder test');
        
        $this->assertIsString($result);
        $decodedImage = base64_decode($result);
        $this->assertNotFalse($decodedImage);
        $this->assertStringStartsWith("\x89PNG", $decodedImage);
        
        $result = $method->invoke($this->qrCodeService, 'test-token-abc', 25.00, null);
        $this->assertIsString($result);
        $decodedImage = base64_decode($result);
        $this->assertNotFalse($decodedImage);
    }

    public function test_extract_pix_info_with_nested_merchant_account(): void
    {
        $jsonData = json_encode([
            'transaction_amount' => 150.75,
            'additional_info' => 'Nested test',
            'merchant_account' => [
                'url' => 'https://example.com/payment'
            ],
            'company' => [
                'name' => 'Test Company'
            ]
        ]);
        
        $result = $this->qrCodeService->extractPixInfo($jsonData);
        
        $this->assertEquals(150.75, $result['amount']);
        $this->assertEquals('Nested test', $result['description']);
        $this->assertEquals('https://example.com/payment', $result['url']);
        $this->assertEquals(['name' => 'Test Company'], $result['company']);
    }

    public function test_extract_pix_info_with_direct_url(): void
    {
        $jsonData = json_encode([
            'transaction_amount' => 200.00,
            'url' => 'https://direct.example.com/payment',
            'merchant_name' => 'Direct Merchant'
        ]);
        
        $result = $this->qrCodeService->extractPixInfo($jsonData);
        
        $this->assertEquals(200.00, $result['amount']);
        $this->assertEquals('https://direct.example.com/payment', $result['url']);
        $this->assertEquals('Direct Merchant', $result['merchant_name']);
    }

    public function test_validate_pix_qr_code_edge_cases(): void
    {
        $this->assertFalse($this->qrCodeService->validatePixQrCode('123'));
        $this->assertFalse($this->qrCodeService->validatePixQrCode('0102030405060708090'));
        $this->assertFalse($this->qrCodeService->validatePixQrCode('0002010102030405067890'));
        $this->assertFalse($this->qrCodeService->validatePixQrCode('00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005802US'));
        
        $validCode = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005802BR';
        $this->assertTrue($this->qrCodeService->validatePixQrCode($validCode));
    }

    public function test_validate_pix_qr_code_exception_handling(): void
    {
        $result = $this->qrCodeService->validatePixQrCode('');
        $this->assertFalse($result);
        
        $result = $this->qrCodeService->validatePixQrCode('invalid-format');
        $this->assertFalse($result);
    }

    public function test_extract_pix_info_exception_handling(): void
    {
        $result = $this->qrCodeService->extractPixInfo('');
        
        $expected = [
            'amount' => 0.0,
            'description' => null,
            'merchant_name' => null,
            'merchant_trade_name' => null,
            'merchant_cnpj' => null,
            'merchant_city' => null,
            'merchant_state' => null,
            'merchant_institution' => null,
            'merchant_institution_code' => null,
            'pix_key_type' => null,
            'pix_key' => null,
            'url' => null,
            'company' => null
        ];
        
        $this->assertEquals($expected, $result);
    }
}