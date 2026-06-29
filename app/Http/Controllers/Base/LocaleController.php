<?php

namespace Pterodactyl\Http\Controllers\Base;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Translation\Translator;
use Illuminate\Contracts\Translation\Loader;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Http\Requests\Base\LocaleRequest;

class LocaleController extends Controller
{
    use AvailableLanguages;

    protected Loader $loader;

    public function __construct(Translator $translator)
    {
        $this->loader = $translator->getLoader();
    }

    /**
     * Returns the list of available languages.
     */
    public function languages(): JsonResponse
    {
        return new JsonResponse($this->getAvailableLanguages(true), 200, [
            'Cache-Control' => 'max-age=60, must-revalidate',
        ]);
    }

    /**
     * Returns translation data given a specific locale and namespace.
     */
    public function __invoke(LocaleRequest $request): JsonResponse
    {
        $locale = $request->input('locale');
        $namespace = $request->input('namespace');

        try {
            $response[$locale][$namespace] = $this->i18n($this->loader->load($locale, $namespace));
        } catch (\Exception $e) {
            Log::warning("Failed to load locale data for {$locale}/{$namespace}: {$e->getMessage()}");
            $response[$locale][$namespace] = [];
        }

        return new JsonResponse($response, 200, [
            'Cache-Control' => 'public, max-age=60, must-revalidate',
            'ETag' => md5(json_encode($response, JSON_THROW_ON_ERROR)),
        ]);
    }

    /**
     * Convert standard Laravel translation keys that look like ":foo"
     * into key structures that are supported by the front-end i18n
     * library, like "{{foo}}".
     */
    protected function i18n(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->i18n($value);
            } else {
                // Find a Laravel style translation replacement in the string and replace it with
                // one that the front-end is able to use. This won't always be present, especially
                // for complex strings or things where we'd never have a backend component anyways.
                //
                // For example:
                // "Hello :name, the :notifications.0.title notification needs :count actions :foo.0.bar."
                //
                // Becomes:
                // "Hello {{name}}, the {{notifications.0.title}} notification needs {{count}} actions {{foo.0.bar}}."
                $data[$key] = preg_replace_callback('/:(\w[\w.-]*)/m', fn($m) => '{{' . $m[1] . '}}', $value);
            }
        }

        return $data;
    }
}
