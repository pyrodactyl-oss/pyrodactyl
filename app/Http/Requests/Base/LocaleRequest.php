<?php

namespace Pterodactyl\Http\Requests\Base;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Pterodactyl\Traits\Helpers\AvailableLanguages;

class LocaleRequest extends FormRequest
{
    use AvailableLanguages;

    public function rules(): array
    {
        return [
            'locale' => ['required', 'string', Rule::in(array_keys($this->getAvailableLanguages()))],
            'namespace' => ['required', 'string', 'regex:/^[a-z]{1,191}$/'],
        ];
    }
}
