<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Bus\Queueable;
use Pterodactyl\Events\Event;
use Pterodactyl\Models\Server;
use Illuminate\Container\Container;
use Pterodactyl\Events\Server\Installed;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Pterodactyl\Contracts\Core\ReceivesEvents;
use Illuminate\Contracts\Notifications\Dispatcher;
use Illuminate\Notifications\Messages\MailMessage;

class ServerInstalled extends Notification implements ShouldQueue, ReceivesEvents
{
    use Queueable;

    public Server $server;

    public User $user;

    public function __construct()
    {
        $this->locale = config('app.locale', 'en');
    }

    /**
     * Handle a direct call to this notification from the server installed event. This is configured
     * in the event service provider.
     */
    public function handle(Event|Installed $event): void
    {
        $event->server->loadMissing('user');

        $this->server = $event->server;
        $this->user = $event->server->user;

        // Since we are calling this notification directly from an event listener we need to fire off the dispatcher
        // to send the email now. Don't use send() or you'll end up firing off two different events.
        Container::getInstance()->make(Dispatcher::class)->sendNow($this->user, $this);
    }

    public function locale(mixed $locale): static
    {
        $this->locale = config('app.locale', 'en');

        return $this;
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
            ->subject(__('auth.email_server_installed.subject'))
            ->greeting(__('auth.email_server_installed.greeting', ['name' => $this->user->username]))
            ->line(__('auth.email_server_installed.line'))
            ->line(__('auth.label_value', ['label' => __('auth.email_server_installed.server_name'), 'value' => $this->server->name]))
            ->action(__('auth.email_server_installed.action'), route('index'));
    }
}
