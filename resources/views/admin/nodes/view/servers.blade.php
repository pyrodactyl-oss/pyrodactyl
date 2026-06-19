@extends('layouts.admin')

@section('title')
    {{ $node->name }}: {{ trans('strings.servers') }}
@endsection

@section('content-header')
    <h1>{{ $node->name }}<small>{{ trans('admin/general.servers_on_node_description') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.nodes') }}">{{ trans('admin/general.nodes') }}</a></li>
        <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
        <li class="active">{{ trans('strings.servers') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ trans('admin/general.about') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">{{ trans('strings.settings') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">{{ trans('admin/general.configuration') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">{{ trans('admin/general.allocation') }}</a></li>
                <li class="active"><a href="{{ route('admin.nodes.view.servers', $node->id) }}">{{ trans('strings.servers') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-sm-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.process_manager') }}</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>{{ trans('strings.id') }}</th>
                        <th>{{ trans('admin/general.server_name') }}</th>
                        <th>{{ trans('admin/general.owner') }}</th>
                        <th>{{ trans('admin/general.service') }}</th>
                    </tr>
                    @foreach($servers as $server)
                        <tr data-server="{{ $server->uuid }}">
                            <td><code>{{ $server->uuidShort }}</code></td>
                            <td><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></td>
                            <td><a href="{{ route('admin.users.view', $server->owner_id) }}">{{ $server->user->username }} ({{ $server->user->email }})</a></td>
                            <td>{{ $server->nest->name }} ({{ $server->egg->name }})</td>
                        </tr>
                    @endforeach
                </table>
                @if($servers->hasPages())
                    <div class="box-footer with-border">
                        <div class="col-md-12 text-center">{!! $servers->render() !!}</div>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
