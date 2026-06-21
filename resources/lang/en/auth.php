<?php

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
];
