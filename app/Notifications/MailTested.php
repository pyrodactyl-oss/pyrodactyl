<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MailTested extends Notification
{
    public function __construct(private User $user)
    {
        $this->locale = config('app.locale', 'en');
    }

    public function locale(mixed $locale): static
    {
        $this->locale = config('app.locale', 'en');

        return $this;
    }

    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(): MailMessage
    {
        app()->setLocale($this->locale ?: config('app.locale', 'en'));

        return (new MailMessage())
            ->subject(__('auth.email_mail_tested.subject'))
            ->greeting(__('auth.email_mail_tested.greeting', ['name' => $this->user->name]))
            ->line(__('auth.email_mail_tested.line'));
    }
}
