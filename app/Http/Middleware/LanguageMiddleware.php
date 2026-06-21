<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Foundation\Application;

class LanguageMiddleware
{
    /**
     * LanguageMiddleware constructor.
     */
    public function __construct(private Application $app)
    {
    }

    /**
     * Handle an incoming request and set the user's preferred language.
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        if ($request->is('admin', 'admin/*')) {
            $this->app->setLocale(config('app.locale', 'en'));
        } else {
            $this->app->setLocale($request->user()?->language ?? config('app.locale', 'en'));
        }

        return $next($request);
    }
}
