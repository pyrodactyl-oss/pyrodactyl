@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.locations') }}
@endsection

@section('content-header')
    <h1>{{ trans('admin/general.locations') }}<small>{{ trans('admin/general.all_locations_available') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li class="active">{{ trans('admin/general.locations') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.location_list') }}</h3>
                <div class="box-tools">
                    <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newLocationModal">{{ trans('admin/general.create_new') }}</button>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>{{ trans('strings.id') }}</th>
                            <th>{{ trans('admin/general.short_code') }}</th>
                            <th>{{ trans('strings.description') }}</th>
                            <th class="text-center">{{ trans('admin/general.memory_alloc_percent') }}</th>
                            <th class="text-center">{{ trans('admin/general.disk_alloc_percent') }}</th>
                            <th class="text-center">{{ trans('admin/general.nodes') }}</th>
                            <th class="text-center">{{ trans('strings.servers') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($locations as $location)
                            @php
                                $memoryColor = $location->memory_percent < 50 ? '#50af51' : ($location->memory_percent < 70 ? '#e0a800' : '#d9534f');
                                $diskColor = $location->disk_percent < 50 ? '#50af51' : ($location->disk_percent < 70 ? '#e0a800' : '#d9534f');
                            @endphp
                            <tr>
                                <td><code>{{ $location->id }}</code></td>
                                <td><a href="{{ route('admin.locations.view', $location->id) }}">{{ $location->short }}</a></td>
                                <td>{{ $location->long }}</td>
                                <td class="text-center" style="color: {{ $memoryColor }}" title="{{ trans('admin/general.allocated') }}: {{ humanizeSize($location->allocated_memory * 1024 * 1024) }} / {{ trans('admin/general.total') }}: {{ humanizeSize($location->total_memory * 1024 * 1024) }}">
                                    {{ round($location->memory_percent) }}%
                                </td>
                                <td class="text-center" style="color: {{ $diskColor }}" title="{{ trans('admin/general.allocated') }}: {{ humanizeSize($location->allocated_disk * 1024 * 1024) }} / {{ trans('admin/general.total') }}: {{ humanizeSize($location->total_disk * 1024 * 1024) }}">
                                    {{ round($location->disk_percent) }}%
                                </td>
                                <td class="text-center">{{ $location->nodes_count }}</td>
                                <td class="text-center">{{ $location->servers_count }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="newLocationModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <form action="{{ route('admin.locations') }}" method="POST">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="{{ trans('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">{{ trans('admin/general.create_location') }}</h4>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-12">
                            <label for="pShortModal" class="form-label">{{ trans('admin/general.short_code') }}</label>
                            <input type="text" name="short" id="pShortModal" class="form-control" />
                            <p class="text-muted small">{!! trans('admin/general.location_short_desc') !!}</p>
                        </div>
                        <div class="col-md-12">
                            <label for="pLongModal" class="form-label">{{ trans('strings.description') }}</label>
                            <textarea name="long" id="pLongModal" class="form-control" rows="4"></textarea>
                            <p class="text-muted small">{{ trans('admin/general.location_long_desc') }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">{{ trans('strings.cancel') }}</button>
                    <button type="submit" class="btn btn-success btn-sm">{{ trans('strings.create') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
