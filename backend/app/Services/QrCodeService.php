<?php

declare(strict_types=1);

namespace App\Services;

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Piggly\Pix\StaticPayload;

class QrCodeService
{
    /**
     * Generate PIX QR Code
     */
    public function generatePixQrCode(string $pixToken, float $amount, ?string $description = null): string
    {
        $confirmationUrl = route('api.pix.confirm', ['token' => $pixToken]);
        
        $pixData = $this->generatePixPayload($pixToken, $amount, $description);
        
        try {
            $qrCode = new QrCode($pixData);
            $writer = new PngWriter();
            $result = $writer->write($qrCode);
            
            return base64_encode($result->getString());
        } catch (\Exception $e) {
            return $this->generatePlaceholderQrCode($pixToken, $amount, $description);
        }
    }

    /**
     * Get company beneficiary data
     */
    public function getCompanyData(): array
    {
        return config('pix.simulation.company');
    }

    /**
     * Generate PIX QR Code URL
     */
    public function generateQrCodeUrl(string $pixToken): string
    {
        return route('api.pix.qrcode', ['token' => $pixToken]);
    }

    /**
     * Gera payload PIX no formato BR Code (EMV) usando biblioteca especializada
     */
    private function generatePixPayload(string $pixToken, float $amount, ?string $description = null): string
    {
        $companyData = $this->getCompanyData();
        
        // Criar o payload PIX usando a biblioteca Piggly
        $payload = new StaticPayload();
        
        // Configurar chave PIX (usando document para CNPJ - adequado para simulação)
        $payload->setPixKey('document', $companyData['pix_key']['value']);
        
        // Configurar merchant
        $payload->setMerchantName($companyData['trade_name']);
        $payload->setMerchantCity($companyData['address']['city']);
        
        // Configurar valor se fornecido
        if ($amount > 0) {
            $payload->setAmount($amount);
        }
        
        // Adicionar descrição se fornecida
        if ($description) {
            $payload->setDescription($description);
        }
        
        // Adicionar TID para rastreamento
        $payload->setTid(substr(str_replace('-', '', $pixToken), 0, 25));
        
        // Gerar o código PIX
        return $payload->getPixCode();
    }

    /**
     * Formatar campo TLV (Tag-Length-Value)
     */
    private function formatTLV(string $tag, string $value): string
    {
        $length = str_pad((string)strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $length . $value;
    }

    /**
     * Normalizar texto removendo acentos e caracteres especiais
     */
    private function normalizeText(string $text): string
    {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        $text = preg_replace('/[^A-Za-z0-9\s\-\.]/', '', $text);
        return trim($text);
    }

    /**
     * Calcular CRC16 para BR Code (CCITT-FFFF)
     */
    private function calculateCRC16(string $data): string
    {
        $polynomial = 0x1021;
        $crc = 0xFFFF;
        
        for ($i = 0; $i < strlen($data); $i++) {
            $crc ^= (ord($data[$i]) << 8);
            
            for ($j = 0; $j < 8; $j++) {
                if ($crc & 0x8000) {
                    $crc = (($crc << 1) ^ $polynomial) & 0xFFFF;
                } else {
                    $crc = ($crc << 1) & 0xFFFF;
                }
            }
        }
        
        return sprintf('%04X', $crc);
    }

    /**
     * Validate PIX QR Code (BR Code format)
     */
    public function validatePixQrCode(string $qrCodeData): bool
    {
        try {
            // Verificações básicas do formato BR Code
            if (strlen($qrCodeData) < 10) {
                return false;
            }
            
            // Verificar se começa com o formato correto (00 + 02 + 01)
            if (substr($qrCodeData, 0, 6) !== '000201') {
                return false;
            }
            
            // Verificar se contém informações do PIX (tag 26)
            if (strpos($qrCodeData, '26') === false) {
                return false;
            }
            
            // Verificar país (tag 58 + BR)
            if (strpos($qrCodeData, '5802BR') === false) {
                return false;
            }
            
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Extract PIX information (simplified for our needs)
     */
    public function extractPixInfo(string $qrCodeData): array
    {
        try {
            $data = json_decode($qrCodeData, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return $this->getDefaultPixInfo();
            }
            
            return [
                'amount' => isset($data['transaction_amount']) ? (float) $data['transaction_amount'] : 0.0,
                'description' => $data['additional_info'] ?? null,
                'merchant_name' => $data['merchant_name'] ?? null,
                'merchant_trade_name' => $data['merchant_trade_name'] ?? null,
                'merchant_cnpj' => $data['merchant_cnpj'] ?? null,
                'merchant_city' => $data['merchant_city'] ?? null,
                'merchant_state' => $data['merchant_state'] ?? null,
                'merchant_institution' => $data['merchant_institution'] ?? null,
                'merchant_institution_code' => $data['merchant_institution_code'] ?? null,
                'pix_key_type' => $data['pix_key_type'] ?? null,
                'pix_key' => $data['pix_key'] ?? null,
                'url' => $data['merchant_account']['url'] ?? $data['url'] ?? null,
                'company' => $data['company'] ?? null
            ];
        } catch (\Exception $e) {
            return $this->getDefaultPixInfo();
        }
    }

    /**
     * Get default PIX info structure
     */
    private function getDefaultPixInfo(): array
    {
        return [
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
    }


    /**
     * Generate placeholder QR Code
     */
    private function generatePlaceholderQrCode(string $pixToken, float $amount, ?string $description = null): string
    {
        $size = config('pix.qr_code.size', 200);
        
        $img = imagecreate($size, $size);
        $bg = imagecolorallocate($img, 255, 255, 255);
        $text_color = imagecolorallocate($img, 0, 0, 0);
        
        $info = "PIX QR CODE\nR$ " . number_format($amount, 2, ',', '.');
        imagestring($img, 3, 10, $size/2 - 20, $info, $text_color);
        imagestring($img, 2, 10, $size/2 + 10, "Token: " . substr($pixToken, 0, 8) . "...", $text_color);
        
        ob_start();
        imagepng($img);
        $imageData = ob_get_contents();
        ob_end_clean();
        
        imagedestroy($img);
        
        return base64_encode($imageData);
    }
}