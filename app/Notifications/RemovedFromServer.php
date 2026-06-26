<?php

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class RemovedFromServer extends Notification implements ShouldQueue
{
    use Queueable;

    public object $server;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $server)
    {
        $this->server = (object) $server;
        $this->locale = config('app.locale', 'en');
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(): MailMessage
    {
        app()->setLocale($this->locale ?: config('app.locale', 'en'));

        return (new MailMessage())
            ->subject(__('auth.email_subuser_removed.subject'))
            ->error()
            ->greeting(__('auth.email_subuser_removed.greeting', ['name' => $this->server->user]))
            ->line(__('auth.email_subuser_removed.line'))
            ->line(__('auth.label_value', ['label' => __('auth.email_subuser_removed.server_name'), 'value' => $this->server->name]))
            ->action(__('auth.email_subuser_removed.visit'), route('index'));
    }

    /**
     * Set the locale for the notification based on panel default.
     */
    public function locale(mixed $locale): static
    {
        $this->locale = config('app.locale', 'en');

        return $this;
    }
}
