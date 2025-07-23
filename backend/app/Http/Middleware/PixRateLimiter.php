<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class PixRateLimiter
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $action): Response
    {
        $key = $this->getRateLimitKey($request, $action);
        $limit = $this->getRateLimit($action);

        if (RateLimiter::tooManyAttempts($key, $limit['attempts'])) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'success' => false,
                'message' => 'Muitas tentativas. Tente novamente em ' . $seconds . ' segundos.',
                'retry_after' => $seconds
            ], 429);
        }

        RateLimiter::hit($key, $limit['decay']);

        return $next($request);
    }

    /**
     * Generate rate limit key for the request
     */
    private function getRateLimitKey(Request $request, string $action): string
    {
        $userId = $request->user()?->id ?? $request->ip();
        return "pix_rate_limit:{$action}:{$userId}";
    }

    /**
     * Get rate limit configuration for action
     */
    private function getRateLimit(string $action): array
    {
        $config = config("pix.rate_limiting.{$action}", '10,1');
        [$attempts, $decay] = explode(',', $config);

        return [
            'attempts' => (int) $attempts,
            'decay' => (int) $decay * 60,
        ];
    }
}