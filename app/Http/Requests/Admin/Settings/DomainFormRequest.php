<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class DomainFormRequest extends AdminFormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $domainId = $this->route('domain')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/',
                $domainId ? "unique:domains,name,{$domainId}" : 'unique:domains,name',
            ],
            'dns_provider' => 'required|string|in:cloudflare,hetzner,route53',
            'dns_config' => 'required|array',
            'dns_config.api_token' => 'required_if:dns_provider,cloudflare,hetzner|string|min:1',
            'dns_config.access_key_id' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.secret_access_key' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.region' => 'sometimes|string|min:1',
            'dns_config.hosted_zone_id' => 'sometimes|string|min:1',
            'dns_config.zone_id' => 'sometimes|string|min:1',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize domain name to lowercase
        if ($this->has('name')) {
            $this->merge([
                'name' => strtolower(trim($this->input('name'))),
            ]);
        }

        // Ensure boolean fields are properly cast
        foreach (['is_active', 'is_default'] as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN),
                ]);
            }
        }
    }
}
