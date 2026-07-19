{{-- Translated: server delete (titles, breadcrumbs, section headers, descriptions, buttons, JS confirmations) --}}
@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.server_title_prefix') }} — {{ $server->name }}: {{ trans('admin/general.delete') }}
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>{{ trans('admin/general.delete_server_desc') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.servers') }}">{{ trans('strings.servers') }}</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">{{ trans('admin/general.delete') }}</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<div class="row">
    <div class="col-md-6">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.safely_delete_server') }}</h3>
            </div>
            <div class="box-body">
                <p>{{ trans('admin/general.safely_delete_server_desc') }}</p>
                <p class="text-danger small">{!! trans('admin/general.delete_server_warning') !!}</p>
            </div>
            <div class="box-footer">
                <form id="deleteform" action="{{ route('admin.servers.view.delete', $server->id) }}" method="POST">
                    {!! csrf_field() !!}
                    <button id="deletebtn" class="btn btn-danger">{{ trans('admin/general.safely_delete_this_server') }}</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="box box-danger">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.force_delete_server') }}</h3>
            </div>
            <div class="box-body">
                <p>{{ trans('admin/general.force_delete_server_desc') }}</p>
                <p class="text-danger small">{!! trans('admin/general.force_delete_server_warning') !!}</p>
            </div>
            <div class="box-footer">
                <form id="forcedeleteform" action="{{ route('admin.servers.view.delete', $server->id) }}" method="POST">
                    {!! csrf_field() !!}
                    <input type="hidden" name="force_delete" value="1" />
                    <button id="forcedeletebtn"" class="btn btn-danger">{{ trans('admin/general.forcibly_delete_this_server') }}</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('#deletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: '{{ trans('admin/general.delete_server_confirm') }}',
            showCancelButton: true,
            confirmButtonText: '{{ trans('admin/general.delete') }}',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#deleteform').submit()
        });
    });

    $('#forcedeletebtn').click(function (event) {
        event.preventDefault();
        swal({
            title: '',
            type: 'warning',
            text: '{{ trans('admin/general.delete_server_confirm') }}',
            showCancelButton: true,
            confirmButtonText: '{{ trans('admin/general.delete') }}',
            confirmButtonColor: '#d9534f',
            closeOnConfirm: false
        }, function () {
            $('#forcedeleteform').submit()
        });
    });
    </script>
@endsection
