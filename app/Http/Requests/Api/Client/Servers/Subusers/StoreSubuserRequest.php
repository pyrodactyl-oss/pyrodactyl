<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Subusers;

use Pterodactyl\Models\Permission;

class StoreSubuserRequest extends SubuserRequest
{
    public function permission(): string
    {
        return Permission::ACTION_USER_CREATE;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|between:1,191',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'string',
        ];
    }

    public function messages(): array
    {
        return [
            'permissions.required' => trans('validation.subuser_permissions_required'),
            'permissions.min' => trans('validation.subuser_permissions_required'),
        ];
    }
}
