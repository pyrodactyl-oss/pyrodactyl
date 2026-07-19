@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'captcha'])

@section('title')
  {{ trans('admin/general.captcha_settings') }}
@endsection

@section('content-header')
  <h1>{{ trans('admin/general.captcha_settings') }}<small>{{ trans('admin/general.captcha_settings_desc') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
    <li class="active">{{ trans('strings.settings') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <form action="{{ route('admin.settings.captcha') }}" method="POST">
        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">{{ trans('admin/general.captcha_provider') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-4">
                <label class="control-label">{{ trans('admin/general.provider') }}</label>
                <div>
                  <select name="pterodactyl:captcha:provider" class="form-control" id="captcha-provider">
                    @foreach($providers as $key => $name)
                      <option value="{{ $key }}" @if(old('pterodactyl:captcha:provider', config('pterodactyl.captcha.provider', 'none')) === $key) selected @endif>{{ $name }}</option>
                    @endforeach
                  </select>
                  <p class="text-muted"><small>{{ trans('admin/general.select_captcha_provider') }}</small></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="turnstile-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ trans('admin/general.turnstile_config') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ trans('admin/general.site_key') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:turnstile:site_key"
                    value="{{ old('pterodactyl:captcha:turnstile:site_key', config('pterodactyl.captcha.turnstile.site_key', '')) }}" />
                  <p class="text-muted"><small>{{ trans('admin/general.turnstile_site_key_desc') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ trans('admin/general.secret_key') }}</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:turnstile:secret_key"
                    value="{{ old('pterodactyl:captcha:turnstile:secret_key', config('pterodactyl.captcha.turnstile.secret_key', '')) }}" />
                  <p class="text-muted"><small>{{ trans('admin/general.turnstile_secret_key_desc') }}</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>{{ trans('admin/general.setup_instructions') }}:</strong>
                  <ol>
                    <li><a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank">{{ trans('admin/general.turnstile_setup_1') }}</a></li>
                    <li>{{ trans('admin/general.turnstile_setup_2') }}</li>
                    <li>{{ trans('admin/general.turnstile_setup_3') }}</li>
                    <li>{{ trans('admin/general.turnstile_setup_4') }}</li>
                    <li>{{ trans('admin/general.turnstile_setup_5') }}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="hcaptcha-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ trans('admin/general.hcaptcha_config') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ trans('admin/general.site_key') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:hcaptcha:site_key"
                    value="{{ old('pterodactyl:captcha:hcaptcha:site_key', config('pterodactyl.captcha.hcaptcha.site_key', '')) }}" />
                  <p class="text-muted"><small>{{ trans('admin/general.hcaptcha_site_key_desc') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ trans('admin/general.secret_key') }}</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:hcaptcha:secret_key"
                    value="{{ old('pterodactyl:captcha:hcaptcha:secret_key', config('pterodactyl.captcha.hcaptcha.secret_key', '')) }}" />
                  <p class="text-muted"><small>{{ trans('admin/general.hcaptcha_secret_key_desc') }}</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>{{ trans('admin/general.setup_instructions') }}:</strong>
                  <ol>
                    <li><a href="https://dashboard.hcaptcha.com/sites" target="_blank">{{ trans('admin/general.hcaptcha_setup_1') }}</a></li>
                    <li>{{ trans('admin/general.hcaptcha_setup_2') }}</li>
                    <li>{{ trans('admin/general.hcaptcha_setup_3') }}</li>
                    <li>{{ trans('admin/general.hcaptcha_setup_4') }}</li>
                    <li>{{ trans('admin/general.hcaptcha_setup_5') }}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="recaptcha-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ trans('admin/general.recaptcha_config') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">{{ trans('admin/general.site_key') }}</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:recaptcha:site_key"
                    value="{{ old('pterodactyl:captcha:recaptcha:site_key', config('pterodactyl.captcha.recaptcha.site_key', '')) }}" />
                  <p class="text-muted"><small>{{ trans('admin/general.recaptcha_site_key_desc') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">{{ trans('admin/general.secret_key') }}</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:recaptcha:secret_key"
                    value="{{ old('pterodactyl:captcha:recaptcha:secret_key', config('pterodactyl.captcha.recaptcha.secret_key', '')) }}" />
                  <p class="text-muted"><small>{{ trans('admin/general.recaptcha_secret_key_desc') }}</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>{{ trans('admin/general.recaptcha_setup_title') }}:</strong>
                  <ol>
                    <li><a href="https://www.google.com/recaptcha/admin" target="_blank">{{ trans('admin/general.recaptcha_setup_1') }}</a></li>
                    <li>{{ trans('admin/general.recaptcha_setup_2') }}</li>
                    <li>{{ trans('admin/general.recaptcha_setup_3') }}</li>
                    <li>{{ trans('admin/general.recaptcha_setup_4') }}</li>
                    <li>{{ trans('admin/general.recaptcha_setup_5') }}</li>
                  </ol>
                  <p><strong>{{ trans('admin/general.note') }}:</strong> {{ trans('admin/general.recaptcha_config_note') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div class="box box-primary">
          <div class="box-footer">
            {{ csrf_field() }}
            <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">{{ trans('strings.save') }}</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const providerSelect = document.getElementById('captcha-provider');
      const turnstileSettings = document.getElementById('turnstile-settings');
      const hcaptchaSettings = document.getElementById('hcaptcha-settings');
      const recaptchaSettings = document.getElementById('recaptcha-settings');

      function toggleSettings() {
        const provider = providerSelect.value;

        // Hide all provider-specific settings first
        turnstileSettings.style.display = 'none';
        hcaptchaSettings.style.display = 'none';
        recaptchaSettings.style.display = 'none';

        if (provider === 'turnstile') {
          turnstileSettings.style.display = 'block';
        } else if (provider === 'hcaptcha') {
          hcaptchaSettings.style.display = 'block';
        } else if (provider === 'recaptcha') {
          recaptchaSettings.style.display = 'block';
        }
      }

      providerSelect.addEventListener('change', toggleSettings);

      // Initialize on page load with a small delay to ensure DOM is ready
      setTimeout(toggleSettings, 100);
    });
  </script>
@endsection
