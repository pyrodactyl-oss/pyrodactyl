@extends('layouts.admin')

@section('title')
  {{ $node->name }}: {{ trans('strings.settings') }}
@endsection

@section('content-header')
  <h1>{{ $node->name }}<small>{{ trans('admin/general.configure_node_settings') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
    <li><a href="{{ route('admin.nodes') }}">{{ trans('admin/general.nodes') }}</a></li>
    <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
    <li class="active">{{ trans('strings.settings') }}</li>
  </ol>
@endsection

@section('content')
  <div class="row">
    <div class="col-xs-12">
    <div class="nav-tabs-custom nav-tabs-floating">
      <ul class="nav nav-tabs">
      <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ trans('admin/general.about') }}</a></li>
      <li class="active"><a href="{{ route('admin.nodes.view.settings', $node->id) }}">{{ trans('strings.settings') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">{{ trans('admin/general.configuration') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">{{ trans('admin/general.allocation') }}</a></li>
      <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">{{ trans('strings.servers') }}</a></li>
      </ul>
    </div>
    </div>
  </div>
  <form action="{{ route('admin.nodes.view.settings', $node->id) }}" method="POST">
    <div class="row">
    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('strings.settings') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-xs-12">
        <label for="name" class="control-label">{{ trans('admin/general.node_name') }}</label>
        <div>
          <input type="text" autocomplete="off" name="name" class="form-control"
          value="{{ old('name', $node->name) }}" />
          <p class="text-muted"><small>{{ trans('admin/general.character_limits') }} <code>a-zA-Z0-9_.-</code> {{ trans('admin/general.character_limits_desc') }}</small></p>
        </div>
        </div>
        <div class="form-group col-xs-12">
        <label for="description" class="control-label">{{ trans('strings.description') }}</label>
        <div>
          <textarea name="description" id="description" rows="4"
          class="form-control">{{ $node->description }}</textarea>
        </div>
        </div>
        <div class="form-group col-xs-12">
        <label for="name" class="control-label">{{ trans('admin/general.location') }}</label>
        <div>
          <select name="location_id" class="form-control">
          @foreach($locations as $location)
                <option value="{{ $location->id }}" {{ (old('location_id', $node->location_id) === $location->id) ? 'selected' : '' }}>{{ $location->long }} ({{ $location->short }})</option>
          @endforeach
          </select>
        </div>
        <label for="pDaemonType" class="form-label">{{ trans('admin/general.daemon') }}</label>
        <div>
        <select name="daemonType" id="pDaemonType" class="form-control">
            @foreach($daemonTypes as $daemon)
                <option value="{{ $daemon }}" {{ $daemon == old('daemon_type', $node->daemonType) ? 'selected' : '' }}>{{ $daemon }}</option>
            @endforeach
        </select>
        </div>
        <label for="public" class="control-label">{{ trans('admin/general.allow_automatic_allocation') }} <sup><a data-toggle="tooltip"
            data-placement="top" title="{{ trans('admin/general.allow_automatic_allocation_tooltip') }}">?</a></sup></label>
        <div>
          <input type="radio" name="public" value="1" {{ (old('public', $node->public)) ? 'checked' : '' }}
          id="public_1" checked> <label for="public_1" style="padding-left:5px;">{{ trans('strings.yes') }}</label><br />
          <input type="radio" name="public" value="0" {{ (old('public', $node->public)) ? '' : 'checked' }}
          id="public_0"> <label for="public_0" style="padding-left:5px;">{{ trans('strings.no') }}</label>
        </div>
        <label for="public" class="control-label">{{ trans('admin/general.domain_by_allocation_alias') }} <sup><a data-toggle="tooltip"
            data-placement="top" title="{{ trans('admin/general.domain_by_allocation_alias_tooltip') }}">?</a></sup></label>
        <div>
          <input type="radio" name="trust_alias" value="1" {{ (old('trustalias', $node->trust_alias)) ? 'checked' : '' }}
          id="trust_alias_1" checked> <label for="public_1" style="padding-left:5px;">{{ trans('strings.yes') }}</label><br />
          <input type="radio" name="trust_alias" value="0" {{ (old('trustalias', $node->trust_alias)) ? '' : 'checked' }}
          id="trust_alias_0"> <label for="trustalias_0" style="padding-left:5px;">{{ trans('strings.no') }}</label>
        </div>
        </div>
        <div class="form-group col-xs-12">
        <label for="fqdn" class="control-label">{{ trans('admin/general.public_fqdn') }}</label>
        <div>
          <input type="text" autocomplete="off" name="fqdn" class="form-control"
          value="{{ old('fqdn', $node->fqdn) }}" />
        </div>
        <p class="text-muted">
          <small>
          {!! str_replace([':daemonType'], [$node->daemonType], trans('admin/general.public_fqdn_hint_generic')) !!}
          <a tabindex="0" data-toggle="popover" data-trigger="focus" title="{{ trans('admin/general.why_fqdn_title') }}"
            data-content="{{ trans('admin/general.why_fqdn_content') }}">{{ trans('strings.why') }}</a>
          </small>
        </p>
        </div>
        <div class="form-group col-xs-12">
        <label for="internal_fqdn" class="control-label">
          {{ trans('admin/general.internal_fqdn') }}
          <strong>({{ trans('strings.optional') }})</strong>
        </label>
        <div>
          <input type="text" autocomplete="off" name="internal_fqdn" class="form-control"
          value="{{ old('internal_fqdn', $node->internal_fqdn) }}" />
        </div>
        <p class="text-muted">
          <small>
          {!! str_replace([':daemonType'], [$node->daemonType], trans('admin/general.internal_fqdn_hint_generic')) !!}
          </small>
        </p>
        </div>
        <div class="form-group col-xs-12">
        <label class="form-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span>
          {{ trans('admin/general.communicate_over_ssl') }}</label>
        <div>
          <div class="radio radio-success radio-inline">
          <input type="radio" id="pSSLTrue" value="https" name="scheme" {{ (old('scheme', $node->scheme) === 'https') ? 'checked' : '' }}>
          <label for="pSSLTrue"> {{ trans('admin/general.use_ssl') }}</label>
          </div>
          <div class="radio radio-danger radio-inline">
          <input type="radio" id="pSSLFalse" value="http" name="scheme" {{ (old('scheme', $node->scheme) !== 'https') ? 'checked' : '' }}>
          <label for="pSSLFalse"> {{ trans('admin/general.use_http') }}</label>
          </div>
        </div>
        <p class="text-muted small">{{ trans('admin/general.ssl_recommendation') }}</p>
        </div>
        <div class="form-group col-xs-12">
        <label class="form-label"><span class="label label-warning"><i class="fa fa-power-off"></i></span> {{ trans('admin/general.behind_proxy') }}</label>
        <div>
          <div class="radio radio-success radio-inline">
          <input type="radio" id="pProxyFalse" value="0" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == false) ? 'checked' : '' }}>
          <label for="pProxyFalse"> {{ trans('admin/general.not_behind_proxy') }} </label>
          </div>
          <div class="radio radio-info radio-inline">
          <input type="radio" id="pProxyTrue" value="1" name="behind_proxy" {{ (old('behind_proxy', $node->behind_proxy) == true) ? 'checked' : '' }}>
          <label for="pProxyTrue"> {{ trans('admin/general.behind_proxy') }} </label>
          </div>
        </div>
        <p class="text-muted small">{{ trans('admin/general.behind_proxy_hint') }}</p>
        </div>
        <div class="form-group col-xs-12">
        <label class="form-label"><span class="label label-warning"><i class="fa fa-wrench"></i></span> {{ trans('admin/general.maintenance_mode') }}</label>
        <div>
          <div class="radio radio-success radio-inline">
          <input type="radio" id="pMaintenanceFalse" value="0" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == false) ? 'checked' : '' }}>
          <label for="pMaintenanceFalse"> {{ trans('admin/general.disabled') }}</label>
          </div>
          <div class="radio radio-warning radio-inline">
          <input type="radio" id="pMaintenanceTrue" value="1" name="maintenance_mode" {{ (old('maintenance_mode', $node->maintenance_mode) == true) ? 'checked' : '' }}>
          <label for="pMaintenanceTrue"> {{ trans('admin/general.enabled') }}</label>
          </div>
        </div>
        <p class="text-muted small">{{ trans('admin/general.maintenance_mode_hint') }}</p>
        </div>
      </div>
      </div>
    </div>
    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('admin/general.allocation_limits') }}</h3>
      </div>
      <div class="box-body row">
        <div class="col-xs-12">
        <div class="row">
          <div class="form-group col-xs-6">
          <label for="memory" class="control-label">{{ trans('admin/general.total_memory') }}</label>
          <div class="input-group">
            <input type="text" name="memory" class="form-control" data-multiplicator="true"
            value="{{ old('memory', $node->memory) }}" />
            <span class="input-group-addon">MiB</span>
          </div>
          </div>
          <div class="form-group col-xs-6">
          <label for="memory_overallocate" class="control-label">{{ trans('admin/general.overallocate') }}</label>
          <div class="input-group">
            <input type="text" name="memory_overallocate" class="form-control"
            value="{{ old('memory_overallocate', $node->memory_overallocate) }}" />
            <span class="input-group-addon">%</span>
          </div>
          </div>
        </div>
        <p class="text-muted small">{{ trans('admin/general.memory_allocation_hint_short') }}</p>
        </div>
        <div class="col-xs-12">
        <div class="row">
          <div class="form-group col-xs-6">
          <label for="disk" class="control-label">{{ trans('admin/general.disk_space') }}</label>
          <div class="input-group">
            <input type="text" name="disk" class="form-control" data-multiplicator="true"
            value="{{ old('disk', $node->disk) }}" />
            <span class="input-group-addon">MiB</span>
          </div>
          </div>
          <div class="form-group col-xs-6">
          <label for="disk_overallocate" class="control-label">{{ trans('admin/general.overallocate') }}</label>
          <div class="input-group">
            <input type="text" name="disk_overallocate" class="form-control"
            value="{{ old('disk_overallocate', $node->disk_overallocate) }}" />
            <span class="input-group-addon">%</span>
          </div>
          </div>
        </div>
        <p class="text-muted small">{{ trans('admin/general.disk_allocation_hint_short') }}</p>
        </div>
      </div>
      </div>
    </div>
    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('admin/general.general_configuration') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-xs-12">
        <label for="disk_overallocate" class="control-label">{{ trans('admin/general.max_web_upload_filesize') }}</label>
        <div class="input-group">
          <input type="text" name="upload_size" class="form-control"
          value="{{ old('upload_size', $node->upload_size) }}" />
          <span class="input-group-addon">MiB</span>
        </div>
        <p class="text-muted"><small>{{ trans('admin/general.max_web_upload_filesize_hint') }}</small></p>
        </div>
        <div class="col-xs-12">
        <div class="row">
          <div class="form-group col-md-6">
          <label for="daemonListen" class="control-label"><span class="label label-warning"><i
              class="fa fa-power-off"></i></span> {{ trans('admin/general.daemon_port') }}</label>
          <div>
            <input type="text" name="daemonListen" class="form-control"
            value="{{ old('daemonListen', $node->daemonListen) }}" />
          </div>
          </div>
          <div class="form-group col-md-6">
          <label for="daemonSFTP" class="control-label"><span class="label label-warning"><i
              class="fa fa-power-off"></i></span> {{ trans('admin/general.daemon_sftp_port') }}</label>
          <div>
            <input type="text" name="daemonSFTP" class="form-control"
            value="{{ old('daemonSFTP', $node->daemonSFTP) }}" />
          </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
          <p class="text-muted"><small>{!! trans('admin/general.daemon_sftp_hint') !!}</small></p>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('admin/general.backup_config') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-xs-12">
        <label for="pBackupDisk" class="form-label">{{ trans('admin/general.backup_disk') }}</label>
        <div>
        <select name="backupDisk" id="pBackupDisk" class="form-control">
            <!-- Populated via Script-->
        </select>
        </div>
        </div>
      </div>
      </div>
    </div>

    <div class="col-xs-12">
      <div class="box box-primary">
      <div class="box-header with-border">
        <h3 class="box-title">{{ trans('admin/general.save_settings') }}</h3>
      </div>
      <div class="box-body row">
        <div class="form-group col-sm-6">
        <div>
          <input type="checkbox" name="reset_secret" id="reset_secret" /> <label for="reset_secret"
          class="control-label">{{ trans('admin/general.reset_daemon_master_key') }}</label>
        </div>
        <p class="text-muted"><small>{!! trans('admin/general.reset_daemon_master_key_hint') !!}</small></p>
        </div>
      </div>
      <div class="box-footer">
        {!! method_field('PATCH') !!}
        {!! csrf_field() !!}
        <button type="submit" class="btn btn-primary pull-right">{{ trans('admin/general.save_changes') }}</button>
      </div>
      </div>
    </div>
    </div>
  </form>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            const daemonSelect = document.getElementById('pDaemonType');
            const backupDiskSelect = document.getElementById('pBackupDisk');

            function updateBackupDisks() {
                const daemonValue = daemonSelect.value;
                const disks = {!! json_encode($backupDisks ?? []) !!}[daemonValue] || [];

                backupDiskSelect.innerHTML = '';

                disks.forEach(disk => {
                    const option = document.createElement('option');
                    option.value = disk;
                    option.textContent = disk;

                    if (disk === '{{ old("backupDisk", $node->backupDisk) }}') {
                        option.selected = true;
                    }

                    backupDiskSelect.appendChild(option);
                });
            }

            updateBackupDisks();

            daemonSelect.addEventListener('change', updateBackupDisks);

            $('[data-toggle="popover"]').popover({
                placement: 'auto'
            });

            $('select[name="location_id"]').select2();
        });
    </script>
@endsection
