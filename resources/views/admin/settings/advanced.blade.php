@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@section('title')
  {{ trans('admin/general.advanced_settings') }}
@endsection

@section('content-header')
  <h1>{{ trans('admin/general.advanced_settings') }}<small>{{ trans('admin/general.advanced_settings_desc') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
    <li class="active">{{ trans('strings.settings') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
    <form action="" method="POST">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('admin/general.http_connections') }}</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">{{ trans('admin/general.connection_timeout') }}</label>
          <div>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout"
            value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
          <p class="text-muted small">{{ trans('admin/general.connection_timeout_desc') }}</p>
          </div>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">{{ trans('admin/general.request_timeout') }}</label>
          <div>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout"
            value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
          <p class="text-muted small">{{ trans('admin/general.request_timeout_desc') }}</p>
          </div>
        </div>
        </div>
      </div>
      </div>
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('admin/general.auto_allocation') }}</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-4">
          <label class="control-label">{{ trans('strings.status') }}</label>
          <div>
          <select class="form-control" name="pterodactyl:client_features:allocations:enabled">
            <option value="false">{{ trans('admin/general.disabled') }}</option>
            <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>{{ trans('admin/general.enabled') }}</option>
          </select>
          <p class="text-muted small">{{ trans('admin/general.allocation_status_desc') }}</p>
          </div>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">{{ trans('admin/general.starting_port') }}</label>
          <div>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start"
            value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
          <p class="text-muted small">{{ trans('admin/general.starting_port_desc') }}</p>
          </div>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">{{ trans('admin/general.ending_port') }}</label>
          <div>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end"
            value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
          <p class="text-muted small">{{ trans('admin/general.ending_port_desc') }}</p>
          </div>
        </div>
        </div>
      </div>
      </div>
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('admin/general.file_trash') }}</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">{{ trans('admin/general.trash_retention') }}</label>
          <div>
          <input type="number" required class="form-control" name="pterodactyl:trash:retention_days"
            value="{{ old('pterodactyl:trash:retention_days', config('pterodactyl.trash.retention_days', 30)) }}" min="1" max="365">
          <p class="text-muted small">{{ trans('admin/general.trash_retention_desc') }}</p>
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
@endsection
