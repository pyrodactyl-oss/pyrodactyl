@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.nodes') }} &rarr; {{ trans('strings.new') }}
@endsection

@section('content-header')
    <h1>{{ trans('admin/general.new_node') }}<small>{{ trans('admin/general.create_node_description') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.nodes') }}">{{ trans('admin/general.nodes') }}</a></li>
        <li class="active">{{ trans('strings.new') }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.nodes.new') }}" method="POST">
    <div class="row">
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.basic_details') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pName" class="form-label">{{ trans('strings.name') }}</label>
                        <input type="text" name="name" id="pName" class="form-control" value="{{ old('name') }}"/>
                        <p class="text-muted small">{{ trans('admin/general.character_limits') }} <code>a-zA-Z0-9_.-</code> {{ trans('admin/general.character_limits_desc') }}</p>
                    </div>
                    <div class="form-group">
                        <label for="pDescription" class="form-label">{{ trans('strings.description') }}</label>
                        <textarea name="description" id="pDescription" rows="4" class="form-control">{{ old('description') }}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="pLocationId" class="form-label">{{ trans('admin/general.location') }}</label>
                        <select name="location_id" id="pLocationId">
                            @foreach($locations as $location)
                                <option value="{{ $location->id }}" {{ $location->id != old('location_id') ?: 'selected' }}>{{ $location->short }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pDaemonType" class="form-label">{{ trans('admin/general.daemon') }}</label>
                        <select name="daemonType" id="pDaemonType" class="form-control">
                            @foreach($daemonTypes as $daemon => $label)
                                <option value="{{ $daemon }}" {{ $daemon == old('daemon_type', 'wings') ? 'selected' : '' }}>
                                    {{ $label }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pBackupDisk" class="form-label">{{ trans('admin/general.backup_disk') }}</label>
                        <div>
                        <select name="backupDisk" id="pBackupDisk" class="form-control">
                            <!-- Populated via Script-->
                        </select>
                        </div>
                    </div>


                    <div class="form-group">
                        <label class="form-label">{{ trans('admin/general.node_visibility') }}</label>
                        <div>
                            <div class="radio radio-success radio-inline">

                                <input type="radio" id="pPublicTrue" value="1" name="public" checked>
                                <label for="pPublicTrue"> {{ trans('admin/general.public') }} </label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pPublicFalse" value="0" name="public">
                                <label for="pPublicFalse"> {{ trans('admin/general.private') }} </label>
                            </div>
                        </div>
                        <p class="text-muted small">{!! trans('admin/general.node_visibility_hint') !!}
                    </div>
                    <div class="form-group">
                        <label for="pFQDN" class="form-label">{{ trans('admin/general.public_fqdn') }}</label>
                        <input type="text" name="fqdn" id="pFQDN" class="form-control" value="{{ old('fqdn') }}" />
                        <p class="text-muted small">
                            {!! trans('admin/general.public_fqdn_hint') !!}
                        </p>
                    </div>
                    <div class="form-group">
                        <label for="pInternalFQDN" class="form-label">
                            {{ trans('admin/general.internal_fqdn') }}
                            <strong>({{ trans('strings.optional') }})</strong>
                        </label>
                        <input type="text" name="internal_fqdn" id="pInternalFQDN" class="form-control"
                            value="{{ old('internal_fqdn') }}" />
                        <p class="text-muted small">
                            {!! trans('admin/general.internal_fqdn_hint') !!}
                        </p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">{{ trans('admin/general.communicate_over_ssl') }}</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pSSLTrue" value="https" name="scheme" checked>
                                <label for="pSSLTrue"> {{ trans('admin/general.use_ssl') }}</label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pSSLFalse" value="http" name="scheme" @if(request()->isSecure()) disabled @endif>
                                <label for="pSSLFalse"> {{ trans('admin/general.use_http') }}</label>
                            </div>
                        </div>
                        @if(request()->isSecure())
                            <p class="text-danger small">{!! trans('admin/general.ssl_required_notice') !!}</p>
                        @else
                            <p class="text-muted small">{{ trans('admin/general.ssl_recommendation') }}</p>
                        @endif
                    </div>
                    <div class="form-group">
                        <label class="form-label">{{ trans('admin/general.behind_proxy') }}</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pProxyFalse" value="0" name="behind_proxy" checked>
                                <label for="pProxyFalse"> {{ trans('admin/general.not_behind_proxy') }} </label>
                            </div>
                            <div class="radio radio-info radio-inline">
                                <input type="radio" id="pProxyTrue" value="1" name="behind_proxy">
                                <label for="pProxyTrue"> {{ trans('admin/general.behind_proxy') }} </label>
                            </div>
                        </div>
                        <p class="text-muted small">{{ trans('admin/general.behind_proxy_hint') }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.configuration') }}</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDaemonBase" class="form-label">{{ trans('admin/general.daemon_server_file_directory') }}</label>
                            <input type="text" name="daemonBase" id="pDaemonBase" class="form-control" value="/var/lib/elytra/volumes" />
                            <p class="text-muted small">{!! trans('admin/general.daemon_files_directory_hint') !!}</p>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pMemory" class="form-label">{{ trans('admin/general.total_memory') }}</label>
                            <div class="input-group">
                                <input type="text" name="memory" data-multiplicator="true" class="form-control" id="pMemory" value="{{ old('memory') }}"/>
                                <span class="input-group-addon">MiB</span>
                            </div>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pMemoryOverallocate" class="form-label">{{ trans('admin/general.memory_overallocation') }}</label>
                            <div class="input-group">
                                <input type="text" name="memory_overallocate" class="form-control" id="pMemoryOverallocate" value="{{ old('memory_overallocate') }}"/>
                                <span class="input-group-addon">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">{!! trans('admin/general.memory_allocation_hint') !!}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDisk" class="form-label">{{ trans('admin/general.total_disk_space') }}</label>
                            <div class="input-group">
                                <input type="text" name="disk" data-multiplicator="true" class="form-control" id="pDisk" value="{{ old('disk') }}"/>
                                <span class="input-group-addon">MiB</span>
                            </div>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pDiskOverallocate" class="form-label">{{ trans('admin/general.disk_overallocation') }}</label>
                            <div class="input-group">
                                <input type="text" name="disk_overallocate" class="form-control" id="pDiskOverallocate" value="{{ old('disk_overallocate') }}"/>
                                <span class="input-group-addon">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">{!! trans('admin/general.disk_allocation_hint') !!}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDaemonListen" class="form-label">{{ trans('admin/general.daemon_port') }}</label>
                            <input type="text" name="daemonListen" class="form-control" id="pDaemonListen" value="8080" />
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pDaemonSFTP" class="form-label">{{ trans('admin/general.daemon_sftp_port') }}</label>
                            <input type="text" name="daemonSFTP" class="form-control" id="pDaemonSFTP" value="2022" />
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">{!! trans('admin/general.daemon_sftp_hint') !!}</p>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-success pull-right">{{ trans('admin/general.create_node') }}</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#pLocationId').select2();

        $(document).ready(function() {
            const daemonSelect = document.getElementById('pDaemonType');
            const backupDiskSelect = document.getElementById('pBackupDisk');

            // Auto Update backup disks based on the selected daemon type
            function updateBackupDisks() {
                const daemonValue = daemonSelect.value;
                const disks = {!! json_encode($backupDisks ?? []) !!}[daemonValue] || [];

                backupDiskSelect.innerHTML = '';

                disks.forEach(disk => {
                    const option = document.createElement('option');
                    option.value = disk;
                    option.textContent = disk;

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
