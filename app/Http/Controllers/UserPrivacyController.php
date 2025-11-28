<?php

namespace App\Http\Controllers\Client;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class UserPrivacyController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'privacy_blur' => (bool) $request->user()->privacy_blur,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'privacy_blur' => 'required|boolean',
        ]);

        $user = $request->user();
        $user->privacy_blur = $data['privacy_blur'];
        $user->save();

        return response()->json([
            'privacy_blur' => (bool) $user->privacy_blur,
        ]);
    }
}
