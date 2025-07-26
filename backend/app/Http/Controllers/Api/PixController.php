<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PixPaymentIndexRequest;
use App\Http\Requests\PixPaymentStoreRequest;
use App\Http\Resources\PixPaymentCollection;
use App\Http\Resources\PixPaymentResource;
use App\Models\PixPayment;
use App\Services\PixService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Exception;

class PixController extends Controller
{
    public function __construct(
        private readonly PixService $pixService
    ) {
    }

    /**
     * Get user's PIX payments
     */
    public function index(PixPaymentIndexRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $user = $request->user();

            $query = $user->is_admin
                ? PixPayment::with('user:id,name,email')->forDashboard()
                : $user->pixPayments()->forDashboard();

            // Aplicar filtros e ordenação
            $query
                ->when($validated['status'] ?? null, fn ($q, $status) => $q->byStatus($status))
                ->when($validated['search'] ?? null, fn ($q, $search) => $q->search($search))
                ->byDateRange($validated['start_date'] ?? null, $validated['end_date'] ?? null)
                ->byValueRange($validated['min_value'] ?? null, $validated['max_value'] ?? null)
                ->applySort($validated['sort_by'] ?? 'created_at', $validated['sort_direction'] ?? 'desc');

            $perPage = min($validated['per_page'] ?? 15, 50);
            $pixPayments = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => new PixPaymentCollection($pixPayments)
            ]);
        } catch (Exception $e) {
            // Log do erro para depuração
            \Log::error('Erro ao buscar pagamentos PIX: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar pagamentos PIX.'
            ], 500);
        }
    }

    /**
     * Create new PIX payment
     */
    public function store(PixPaymentStoreRequest $request): JsonResponse
    {
        try {
            Gate::authorize('create', PixPayment::class);

            $pixPayment = $this->pixService->generatePixPayment(
                user: $request->user(),
                amount: (float) ($request->amount ?? 0),
                description: $request->description
            );

            return response()->json([
                'success' => true,
                'message' => 'PIX gerado com sucesso',
                'data' => new PixPaymentResource($pixPayment)
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get specific PIX payment
     */
    public function show(Request $request, PixPayment $pixPayment): JsonResponse
    {
        try {
            Gate::authorize('view', $pixPayment);

            return response()->json([
                'success' => true,
                'data' => new PixPaymentResource($pixPayment)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'PIX não encontrado'
            ], 404);
        }
    }

    /**
     * Delete PIX payment
     */
    public function destroy(Request $request, PixPayment $pixPayment): JsonResponse
    {
        try {
            Gate::authorize('delete', $pixPayment);

            $pixPayment->delete();

            return response()->json([
                'success' => true,
                'message' => 'PIX deletado com sucesso'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Confirm PIX payment
     */
    public function confirm(Request $request, string $token): JsonResponse
    {
        try {
            $pixPayment = PixPayment::where('token', $token)->first();

            if (!$pixPayment) {
                return response()->json([
                    'success' => false, 
                    'message' => 'PIX não encontrado'
                ], 404);
            }

            $result = $this->pixService->confirmPayment($token);

            $statusCode = match($result['status'] ?? 'error') {
                'paid', 'already_paid' => 200,
                'not_found' => 404,
                'expired' => 422,
                default => 400,
            };

            return response()->json($result, $statusCode);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 403);
        }
    }

    /**
     * Get user's PIX statistics
     */
    public function statistics(PixPaymentIndexRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $user = $request->user();
            
            if ($user->is_admin) {
                $statistics = $this->pixService->getSystemStatistics($validated);
            } else {
                $statistics = $this->pixService->getUserStatistics($user, $validated);
            }

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (Exception $e) {
            \Log::error('Statistics error: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao obter estatísticas'
            ], 500);
        }
    }

    /**
     * Get PIX timeline data for charts
     */
    public function timeline(Request $request): JsonResponse
    {
        try {
            $days = min((int) $request->get('days', 30), 90);
            $user = $request->user();
            
            if ($user->is_admin) {
                $timelineData = $this->pixService->getSystemTimelineData($days);
            } else {
                $timelineData = $this->pixService->getTimelineData($user, $days);
            }

            return response()->json([
                'success' => true,
                'data' => $timelineData
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar dados temporais: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display QR Code image for PIX
     */
    public function qrcode(string $token): Response
    {
        try {
            $pixPayment = PixPayment::where('token', $token)->first();

            if (!$pixPayment) {
                return response('PIX não encontrado', 404);
            }

            if ($pixPayment->isExpired()) {
                return response('QR Code expirado', 410);
            }

            $qrCodeService = app(\App\Services\QrCodeService::class);
            $qrCodeBase64 = $qrCodeService->generatePixQrCode(
                $pixPayment->token,
                (float) $pixPayment->amount,
                $pixPayment->description
            );

            $qrCodeBinary = base64_decode($qrCodeBase64);

            return response($qrCodeBinary)
                ->header('Content-Type', 'image/png')
                ->header('Cache-Control', 'max-age=300, public')
                ->header('Content-Disposition', 'inline; filename="pix-qrcode.png"');

        } catch (Exception $e) {
            abort(500, 'Erro ao gerar QR Code');
        }
    }
}
