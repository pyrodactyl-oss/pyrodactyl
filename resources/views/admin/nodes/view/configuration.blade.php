@extends('layouts.admin')

@section('title')
    {{ $node->name }}: {{ trans('admin/general.configuration') }}
@endsection

@section('content-header')
    <h1>{{ $node->name }}<small>{{ trans('admin/general.configuration_file_description') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.nodes') }}">{{ trans('admin/general.nodes') }}</a></li>
        <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
        <li class="active">{{ trans('admin/general.configuration') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
       <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ trans('admin/general.about') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">{{ trans('strings.settings') }}</a></li>
                <li class="active"><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">{{ trans('admin/general.configuration') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">{{ trans('admin/general.allocation') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">{{ trans('strings.servers') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-sm-8">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.configuration_file') }}</h3>
            </div>
            <div class="box-body">
                <pre class="no-margin">{{ $node->getYamlConfiguration() }}</pre>
            </div>
            <div class="box-footer">
                <p class="no-margin">{!! trans('admin/general.config_file_location_hint') !!}</p>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.auto_deploy') }}</h3>
            </div>
            <div class="box-body">
                <p class="text-muted small">
                    {{ trans('admin/general.auto_deploy_description') }}
                </p>
            </div>
            <div class="box-footer">
                <button type="button" id="configTokenBtn" class="btn btn-sm btn-default" style="width:100%;">{{ trans('admin/general.generate_token') }}</button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#configTokenBtn').on('click', function (event) {
        $.ajax({
            method: 'POST',
            url: '{{ route('admin.nodes.view.configuration.token', $node->id) }}',
            headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
        }).done(function (data) {

            var commandTemplate = "{!! addslashes($node->getAutoDeploy("PLACEHOLDER_TOKEN")) !!}";
            var command = commandTemplate.replace('PLACEHOLDER_TOKEN', data.token);
            swal({
                type: 'success',
                title: '{{ trans('admin/general.token_created') }}',
                text: "<p>{{ trans('admin/general.auto_configure_command') }}<br /><small><pre>" + command + "</pre></small></p>",
                html: true,
            })
        }).fail(function () {
            swal({
                title: '{{ trans('admin/general.error') }}',
                text: '{{ trans('admin/general.token_error') }}',
                type: 'error'
            });
        });
    });
    </script>
@endsection
