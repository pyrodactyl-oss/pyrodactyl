<?php

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class AddedToServer extends Notification implements ShouldQueue
{
    use Queueable;

    public object $server;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $server)
    {
        $this->server = (object) $server;
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
            ->greeting(__('auth.email_subuser_added.greeting', ['name' => $this->server->user]))
            ->line(__('auth.email_subuser_added.line'))
            ->line(__('auth.email_subuser_added.server_name') . ': ' . $this->server->name)
            ->action(__('auth.email_subuser_added.visit'), url('/server/' . $this->server->uuidShort));
    }

    /**
     * Set the locale for the notification based on panel default.
     */
    public function locale(mixed $locale): string
    {
        return config('app.locale', 'en');
    }
}
