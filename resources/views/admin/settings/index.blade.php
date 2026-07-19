@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'basic'])

@section('title')
  {{ trans('admin/general.panel_settings') }}
@endsection

@section('content-header')
  <h1>{{ trans('admin/general.panel_settings') }}<small>{{ trans('admin/general.panel_settings_desc') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ trans('admin/general.administration') }}</a></li>
    <li class="active">{{ trans('strings.settings') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">{{ trans('admin/general.panel_settings') }}</h3>
        </div>
        <form action="{{ route('admin.settings') }}" method="POST">
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-4">
                <label class="control-label">{{ trans('admin/general.company_name') }}</label>
                <div>
                  <input type="text" class="form-control" name="app:name"
                    value="{{ old('app:name', config('app.name')) }}" />
                  <p class="text-muted"><small>{{ trans('admin/general.company_name_desc') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-4">
                <label class="control-label">{{ trans('admin/general.require_2fa') }}</label>
                <div>
                  <div class="btn-group" data-toggle="buttons">
                    @php
                      $level = old('pterodactyl:auth:2fa_required', config('pterodactyl.auth.2fa_required'));
                    @endphp
                    <label class="btn btn-outline-primary @if ($level == 0) active @endif">
                      <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="0" @if ($level == 0) checked @endif> {{ trans('admin/general.not_required') }}
                    </label>
                    <label class="btn btn-outline-primary @if ($level == 1) active @endif">
                      <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="1" @if ($level == 1) checked @endif> {{ trans('admin/general.admin_only') }}
                    </label>
                    <label class="btn btn-outline-primary @if ($level == 2) active @endif">
                      <input type="radio" name="pterodactyl:auth:2fa_required" autocomplete="off" value="2" @if ($level == 2) checked @endif> {{ trans('admin/general.all_users') }}
                    </label>
                  </div>
                  <p class="text-muted"><small>{{ trans('admin/general.require_2fa_desc') }}</small></p>
                </div>
              </div>
              <div class="form-group col-md-4">
                <label class="control-label">{{ trans('admin/general.default_language') }}</label>
                <div>
                  <select name="app:locale" class="form-control">
                    @foreach($languages as $key => $value)
                      <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                    @endforeach
                  </select>
                  <p class="text-muted"><small>{{ trans('admin/general.default_language_hint') }}</small></p>
                </div>
              </div>
            </div>
          </div>
          <div class="box-footer">
            {!! csrf_field() !!}
            <button type="submit" name="_method" value="PATCH"
              class="btn btn-primary btn-sm btn-outline-primary pull-right">{{ trans('admin/general.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
