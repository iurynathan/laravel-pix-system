<?php

declare(strict_types=1);

namespace App\Services;

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

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
     * Generate PIX QR Code URL
     */
    public function generateQrCodeUrl(string $pixToken): string
    {
        return route('api.pix.qrcode', ['token' => $pixToken]);
    }

    /**
     * Gera payload PIX fictício
     */
    private function generatePixPayload(string $pixToken, float $amount, ?string $description = null): string
    {
        $payload = [
            'version' => '01',
            'initiation_method' => '12',
            'merchant_account' => [
                'gui' => 'br.gov.bcb.pix',
                'key' => config('app.name', 'Laravel PIX System'),
                'url' => route('api.pix.confirm', ['token' => $pixToken])
            ],
            'merchant_category' => '0000',
            'transaction_currency' => '986',
            'transaction_amount' => number_format($amount, 2, '.', ''),
            'country_code' => 'BR',
            'merchant_name' => config('app.name', 'Laravel PIX System'),
            'merchant_city' => 'São Paulo',
            'additional_info' => $description ?? 'Pagamento PIX'
        ];

        return json_encode($payload);
    }

    /**
     * Validate PIX QR Code
     */
    public function validatePixQrCode(string $qrCodeData): bool
    {
        try {
            $data = json_decode($qrCodeData, true);
            
            return isset($data['version']) && 
                   isset($data['transaction_currency']) && 
                   $data['transaction_currency'] === '986' &&
                   isset($data['country_code']) && 
                   $data['country_code'] === 'BR';
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Extract PIX information
     */
    public function extractPixInfo(string $qrCodeData): array
    {
        try {
            $data = json_decode($qrCodeData, true);
            
            return [
                'amount' => (float) ($data['transaction_amount'] ?? 0),
                'description' => $data['additional_info'] ?? null,
                'merchant_name' => $data['merchant_name'] ?? null,
                'merchant_city' => $data['merchant_city'] ?? null,
                'url' => $data['merchant_account']['url'] ?? null
            ];
        } catch (\Exception $e) {
            return [];
        }
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