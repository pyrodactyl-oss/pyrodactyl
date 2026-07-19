<?php

/*
|--------------------------------------------------------------------------
| Authentication Language Lines
|--------------------------------------------------------------------------
|
| Contains all of the authentication and email notification
| translation strings for the panel.
|
*/
return [
    'login' => 'Login',
    'username_or_email' => 'Username or Email',
    'password' => 'Password',
    'email_label' => 'Email',
    'forgot_password' => 'Forgot Password?',
    'invalid_credentials' => 'Invalid username or password. Please try again.',
    'captcha_required' => 'Please complete the captcha verification.',
    'captcha_failed' => 'Captcha verification failed. Please try again.',
    'username_required' => 'A username or email must be provided.',
    'password_required' => 'Please enter your account password.',

    'two_factor' => [
        'title' => 'Two Factor Authentication',
        'description' => 'Check device linked with your account for code.',
        'recovery_code_title' => 'Recovery Code',
        'auth_code_title' => 'Authentication Code',
        'recovery_description' => 'Enter one of the recovery codes generated when you setup 2-Factor authentication on this account in order to continue.',
        'auth_description' => 'Enter the two-factor token displayed by your device.',
        'lost_device' => "I've Lost My Device",
        'have_device' => 'I Have My Device',
        'return_to_login' => 'Return to Login',
    ],

    'forgot' => [
        'title' => 'Reset Password',
        'description' => "We'll send you an email with a link to reset your password.",
        'email_required' => 'Email is required.',
        'email_valid' => 'Enter a valid email address.',
        'send_email' => 'Send Email',
        'success' => 'Email sent!',
        'return_to_login' => 'Return to Login',
    ],

    'reset' => [
        'title' => 'Reset Password',
        'new_password' => 'New Password',
        'confirm_password' => 'Confirm New Password',
        'password_description' => 'Passwords must be at least 8 characters in length.',
        'password_required' => 'A new password is required.',
        'password_min' => 'Your new password should be at least 8 characters in length.',
        'password_mismatch' => 'Your new password does not match.',
        'return_to_login' => 'Return to Login',
    ],
    'failed' => 'These credentials do not match our records.',
    'generic_greeting' => 'Hello!',
    'email_account_created' => [
        'subject' => 'Account Created',
        'greeting' => 'Hello :name!',
        'line' => 'You are receiving this email because an account has been created for you on :app.',
        'username' => 'Username',
        'email' => 'Email',
        'setup_button' => 'Setup Your Account',
    ],
    'email_password_reset' => [
        'subject' => 'Reset Password',
        'line' => 'You are receiving this email because we received a password reset request for your account.',
        'action' => 'Reset Password',
        'no_action' => 'If you did not request a password reset, no further action is required.',
    ],
    'regards' => 'Regards',
    'all_rights_reserved' => 'All rights reserved.',
    'trouble_clicking' => 'If you\'re having trouble clicking the ":actionText" button, copy and paste the URL below into your web browser:',
    'email_subuser_added' => [
        'subject' => 'Added to Server',
        'greeting' => 'Hello :name!',
        'line' => 'You have been added as a subuser for the following server, allowing you certain control over the server.',
        'server_name' => 'Server Name',
        'visit' => 'Visit Server',
    ],
    'email_subuser_removed' => [
        'subject' => 'Removed from Server',
        'greeting' => 'Hello :name.',
        'line' => 'You have been removed as a subuser for the following server.',
        'server_name' => 'Server Name',
        'visit' => 'Visit Panel',
    ],
    'email_server_installed' => [
        'subject' => 'Server Installed',        'greeting' => 'Hello :name.',
        'line' => 'Your server has finished installing and is now ready for you to use.',
        'server_name' => 'Server Name',
        'action' => 'Login and Begin Using',
    ],
    'email_mail_tested' => [
        'subject' => 'Pyrodactyl Test Message',
        'greeting' => 'Hello :name!',
        'line' => 'This is a test of the Pyrodactyl mail system. You\'re good to go!',
    ],
    'label_value' => ':label: :value',
    'two_factor' => [
        'checkpoint_failed' => 'Two-factor authentication checkpoint failed. Please try again.',
    ],
    '2fa_must_be_enabled' => 'You must have two-factor authentication enabled on your account in order to access this server.',
];
