<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PixPaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'token' => $this->token,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'status' => $this->status,
            'expires_at' => $this->expires_at->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'qr_code_url' => $this->getQrCodeUrl(),
            'qr_code_base64' => $this->getQrCodeBase64(),
            'remaining_time' => $this->getRemainingTime(),
            'is_expired' => $this->isExpired(),
            'is_paid' => $this->isPaid(),
            'can_be_paid' => $this->canBePaid(),
        ];
    }
}