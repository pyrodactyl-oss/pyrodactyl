<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;

class GhostModeController extends Controller
{
    public function toggle(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->root_admin) {
            abort(403);
        }

        $user->ghost_mode = !$user->ghost_mode;
        $user->save();

        return new JsonResponse(['ghost_mode' => $user->ghost_mode]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return new JsonResponse([
            'ghost_mode' => $user && $user->ghost_mode,
            'available' => $user && $user->root_admin,
        ]);
    }
}
