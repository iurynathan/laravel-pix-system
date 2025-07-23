<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PixPayment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PixPaymentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PixPayment $pixPayment): bool
    {
        return $user->id === $pixPayment->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, PixPayment $pixPayment): bool
    {
        return $user->id === $pixPayment->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PixPayment $pixPayment): Response
    {
        if ($user->id !== $pixPayment->user_id) {
            return Response::deny('Você não tem permissão para deletar este PIX.');
        }

        if ($pixPayment->isPaid()) {
            return Response::deny('Não é possível deletar um PIX que já foi pago.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the user can confirm the payment.
     */
    public function confirm(User $user, PixPayment $pixPayment): Response
    {
        if ($user->id !== $pixPayment->user_id) {
            return Response::deny('Você não tem permissão para confirmar este PIX.');
        }

        if (!$pixPayment->canBePaid()) {
            return Response::deny('Este PIX não pode ser confirmado no momento.');
        }

        return Response::allow();
    }
}