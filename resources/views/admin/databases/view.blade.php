@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.database_hosts') }} &rarr; {{ trans('admin/general.location_details') }} &rarr; {{ $host->name }}
@endsection

@section('content-header')
    <h1>{{ $host->name }}<small>{{ trans('admin/general.viewing_databases') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.databases') }}">{{ trans('admin/general.database_hosts') }}</a></li>
        <li class="active">{{ $host->name }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.databases.view', $host->id) }}" method="POST">
    <div class="row">
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.host_details') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pName" class="form-label">{{ trans('strings.name') }}</label>
                        <input type="text" id="pName" name="name" class="form-control" value="{{ old('name', $host->name) }}" />
                    </div>
                    <div class="form-group">
                        <label for="pHost" class="form-label">{{ trans('admin/general.host') }}</label>
                        <input type="text" id="pHost" name="host" class="form-control" value="{{ old('host', $host->host) }}" />
                        <p class="text-muted small">{!! trans('admin/general.mysql_connect_desc') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="pPort" class="form-label">{{ trans('strings.port') }}</label>
                        <input type="text" id="pPort" name="port" class="form-control" value="{{ old('port', $host->port) }}" />
                        <p class="text-muted small">{{ trans('admin/general.mysql_port_desc') }}</p>
                    </div>
                    <div class="form-group">
                        <label for="pNodeId" class="form-label">{{ trans('admin/general.linked_node') }}</label>
                        <select name="node_id" id="pNodeId" class="form-control">
                            <option value="">{{ trans('strings.none') }}</option>
                            @foreach($locations as $location)
                                <optgroup label="{{ $location->short }}">
                                    @foreach($location->nodes as $node)
                                        <option value="{{ $node->id }}" {{ $host->node_id !== $node->id ?: 'selected' }}>{{ $node->name }}</option>
                                    @endforeach
                                </optgroup>
                            @endforeach
                        </select>
                        <p class="text-muted small">{{ trans('admin/general.linked_node_desc') }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.user_details') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pUsername" class="form-label">{{ trans('strings.username') }}</label>
                        <input type="text" name="username" id="pUsername" class="form-control" value="{{ old('username', $host->username) }}" />
                        <p class="text-muted small">{{ trans('admin/general.mysql_username_desc') }}</p>
                    </div>
                    <div class="form-group">
                        <label for="pPassword" class="form-label">{{ trans('strings.password') }}</label>
                        <input type="password" name="password" id="pPassword" class="form-control" />
                        <p class="text-muted small">{{ trans('admin/general.mysql_leave_blank') }}</p>
                    </div>
                    <hr />
                    <p class="text-danger small text-left">{!! trans('admin/general.mysql_grant_warning') !!}</p>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">{{ trans('strings.save') }}</button>
                    <button name="_method" value="DELETE" class="btn btn-sm btn-danger pull-left muted muted-hover"><i class="fa fa-trash-o"></i></button>
                </div>
            </div>
        </div>
    </div>
</form>
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.databases') }}</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>{{ trans('strings.servers') }}</th>
                        <th>{{ trans('admin/general.database_name') }}</th>
                        <th>{{ trans('strings.username') }}</th>
                        <th>{{ trans('admin/general.connections_from') }}</th>
                        <th>{{ trans('admin/general.max_connections') }}</th>
                        <th></th>
                    </tr>
                    @foreach($databases as $database)
                        <tr>
                            <td class="middle"><a href="{{ route('admin.servers.view', $database->getRelation('server')->id) }}">{{ $database->getRelation('server')->name }}</a></td>
                            <td class="middle">{{ $database->database }}</td>
                            <td class="middle">{{ $database->username }}</td>
                            <td class="middle">{{ $database->remote }}</td>
                            @if($database->max_connections != null)
                                <td class="middle">{{ $database->max_connections }}</td>
                            @else
                                <td class="middle">{{ trans('admin/general.unlimited') }}</td>
                            @endif
                            <td class="text-center">
                                <a href="{{ route('admin.servers.view.database', $database->getRelation('server')->id) }}">
                                    <button class="btn btn-xs btn-primary">{{ trans('admin/general.manage') }}</button>
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
            @if($databases->hasPages())
                <div class="box-footer with-border">
                    <div class="col-md-12 text-center">{!! $databases->render() !!}</div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#pNodeId').select2();
    </script>
@endsection
