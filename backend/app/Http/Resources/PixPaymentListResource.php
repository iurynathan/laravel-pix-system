<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PixPaymentListResource extends JsonResource
{
    /**
     * Transform the resource into an array for listing performance.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'token' => $this->token,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'status' => $this->status,
            'expires_at' => $this->expires_at?->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'qr_code_url' => route('api.pix.qrcode', ['token' => $this->token]),
        ];

        // Se for admin e o relacionamento user estiver carregado, incluir dados do usuário
        if ($request->user()?->is_admin && $this->relationLoaded('user') && $this->user) {
            $data['user'] = [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ];
        }

        return $data;
    }
}