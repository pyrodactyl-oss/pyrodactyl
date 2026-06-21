<?php

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class SendPasswordReset extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $token)
    {
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
    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject(__('auth.email_password_reset.subject'))
            ->line(__('auth.email_password_reset.line'))
            ->action(
                __('auth.email_password_reset.action'),
                url('/auth/password/reset/' . $this->token . '?email=' . urlencode($notifiable->email))
            )
            ->line(__('auth.email_password_reset.no_action'));
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
