<?php

namespace Pterodactyl\Exceptions\Service\User;

use Pterodactyl\Exceptions\DisplayException;

class TwoFactorAuthenticationTokenInvalid extends DisplayException
{
    /**
     * TwoFactorAuthenticationTokenInvalid constructor.
     */
    public function __construct()
    {
        parent::__construct(trans('exceptions.auth.2fa_token_invalid'));
    }
}
