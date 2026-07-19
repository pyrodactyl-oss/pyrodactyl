@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.locations') }} &rarr; {{ trans('admin/general.location_details') }} &rarr; {{ $location->short }}
@endsection

@section('content-header')
    <h1>{{ $location->short }}<small>{{ str_limit($location->long, 75) }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.locations') }}">{{ trans('admin/general.locations') }}</a></li>
        <li class="active">{{ $location->short }}</li>
    </ol>
@endsection

@section('content')
@php
    $totalMemory = 0;
    $allocatedMemory = 0;
    $totalDisk = 0;
    $allocatedDisk = 0;

    foreach ($location->nodes as $node) {
        $memoryLimit = $node->memory * (1 + ($node->memory_overallocate / 100));
        $diskLimit = $node->disk * (1 + ($node->disk_overallocate / 100));

        $totalMemory += $memoryLimit;
        $totalDisk += $diskLimit;

        $nodeAllocatedMemory = $node->servers->where('exclude_from_resource_calculation', false)->sum('memory');
        $nodeAllocatedDisk = $node->servers->where('exclude_from_resource_calculation', false)->sum('disk');

        $allocatedMemory += $nodeAllocatedMemory;
        $allocatedDisk += $nodeAllocatedDisk;
    }

    $memoryPercent = $totalMemory > 0 ? ($allocatedMemory / $totalMemory) * 100 : 0;
    $diskPercent = $totalDisk > 0 ? ($allocatedDisk / $totalDisk) * 100 : 0;

    $memoryColor = $memoryPercent < 50 ? '#50af51' : ($memoryPercent < 70 ? '#e0a800' : '#d9534f');
    $diskColor = $diskPercent < 50 ? '#50af51' : ($diskPercent < 70 ? '#e0a800' : '#d9534f');
@endphp
<div class="row">
    <div class="col-sm-6">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.location_details') }}</h3>
            </div>
            <form action="{{ route('admin.locations.view', $location->id) }}" method="POST">
                <div class="box-body">
                    <div class="form-group">
                        <label for="pShort" class="form-label">{{ trans('admin/general.short_code') }}</label>
                        <input type="text" id="pShort" name="short" class="form-control" value="{{ $location->short }}" />
                    </div>
                    <div class="form-group">
                        <label for="pLong" class="form-label">{{ trans('strings.description') }}</label>
                        <textarea id="pLong" name="long" class="form-control" rows="4">{{ $location->long }}</textarea>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <button name="action" value="edit" class="btn btn-sm btn-primary pull-right">{{ trans('strings.save') }}</button>
                    <button name="action" value="delete" class="btn btn-sm btn-danger pull-left muted muted-hover"><i class="fa fa-trash-o"></i></button>
                </div>
            </form>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="box box-default">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.resource_allocation') }}</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-sm-6">
                        <h4>{{ trans('strings.memory') }}</h4>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" style="width: {{ min($memoryPercent, 100) }}%; background-color: {{ $memoryColor }};" aria-valuenow="{{ $memoryPercent }}" aria-valuemin="0" aria-valuemax="100">{{ round($memoryPercent) }}%</div>
                        </div>
                        <p>
                            <strong>{{ trans('admin/general.allocated') }}:</strong> {{ humanizeSize($allocatedMemory * 1024 * 1024) }}<br>
                            <strong>{{ trans('admin/general.total') }}:</strong> {{ humanizeSize($totalMemory * 1024 * 1024) }}
                        </p>
                    </div>
                    <div class="col-sm-6">
                        <h4>{{ trans('strings.disk') }}</h4>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" style="width: {{ min($diskPercent, 100) }}%; background-color: {{ $diskColor }};" aria-valuenow="{{ $diskPercent }}" aria-valuemin="0" aria-valuemax="100">{{ round($diskPercent) }}%</div>
                        </div>
                        <p>
                            <strong>{{ trans('admin/general.allocated') }}:</strong> {{ humanizeSize($allocatedDisk * 1024 * 1024) }}<br>
                            <strong>{{ trans('admin/general.total') }}:</strong> {{ humanizeSize($totalDisk * 1024 * 1024) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.nodes') }}</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>{{ trans('strings.id') }}</th>
                            <th>{{ trans('strings.name') }}</th>
                            <th>{{ trans('admin/general.fqdn') }}</th>
                            <th>{{ trans('strings.memory') }}</th>
                            <th>{{ trans('strings.disk') }}</th>
                            <th>{{ trans('strings.servers') }}</th>
                        </tr>
                    </thead>
                    @foreach($location->nodes as $node)
                        <tr>
                            <td><code>{{ $node->id }}</code></td>
                            <td><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></td>
                            <td><code>{{ $node->fqdn }}</code></td>
                            @php
                                $nodeMemoryLimit = $node->memory * (1 + ($node->memory_overallocate / 100));
                                $nodeAllocatedMemory = $node->servers->where('exclude_from_resource_calculation', false)->sum('memory');
                                $nodeMemoryPercent = $nodeMemoryLimit > 0 ? ($nodeAllocatedMemory / $nodeMemoryLimit) * 100 : 0;

                                $nodeDiskLimit = $node->disk * (1 + ($node->disk_overallocate / 100));
                                $nodeAllocatedDisk = $node->servers->where('exclude_from_resource_calculation', false)->sum('disk');
                                $nodeDiskPercent = $nodeDiskLimit > 0 ? ($nodeAllocatedDisk / $nodeDiskLimit) * 100 : 0;

                                $nodeMemoryColor = $nodeMemoryPercent < 50 ? '#50af51' : ($nodeMemoryPercent < 70 ? '#e0a800' : '#d9534f');
                                $nodeDiskColor = $nodeDiskPercent < 50 ? '#50af51' : ($nodeDiskPercent < 70 ? '#e0a800' : '#d9534f');
                            @endphp
                            <td style="color: {{ $nodeMemoryColor }}">{{ round($nodeMemoryPercent) }}%</td>
                            <td style="color: {{ $nodeDiskColor }}">{{ round($nodeDiskPercent) }}%</td>
                            <td>{{ $node->servers->count() }}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
