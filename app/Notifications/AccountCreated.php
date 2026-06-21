<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class AccountCreated extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public User $user, public ?string $token = null)
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
    public function toMail(): MailMessage
    {
        $message = (new MailMessage())
            ->greeting(__('auth.email_account_created.greeting', ['name' => $this->user->name]))
            ->line(__('auth.email_account_created.line', ['app' => config('app.name', 'Pyrodactyl')]))
            ->line(__('auth.email_account_created.username') . ': ' . $this->user->username)
            ->line(__('auth.email_account_created.email') . ': ' . $this->user->email);

        if (!is_null($this->token)) {
            return $message->action(
                __('auth.email_account_created.setup_button'),
                url('/auth/password/reset/' . $this->token . '?email=' . urlencode($this->user->email))
            );
        }

        return $message;
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
