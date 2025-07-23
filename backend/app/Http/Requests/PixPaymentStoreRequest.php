<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PixPaymentStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => [
                'required',
                'numeric',
                'min:' . config('pix.limits.min_amount', 0.01),
            ],
            'description' => 'nullable|string|max:255',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'O valor para PIX é obrigatório',
            'amount.min' => 'O valor mínimo para PIX é R$ ' . number_format(config('pix.limits.min_amount', 0.01), 2, ',', '.'),
            'amount.numeric' => 'O valor deve ser numérico',
            'description.max' => 'A descrição deve ter no máximo 255 caracteres',
        ];
    }
}