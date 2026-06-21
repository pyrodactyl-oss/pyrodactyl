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

    public string $locale;

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
        return (new MailMessage())
            ->error()
            ->greeting(__('auth.email_subuser_removed.greeting', ['name' => $this->server->user]))
            ->line(__('auth.email_subuser_removed.line'))
            ->line(__('auth.email_subuser_removed.server_name') . ': ' . $this->server->name)
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
