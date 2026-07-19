
@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.mounts') }}
@endsection

@section('content-header')
    <h1>{{ trans('admin/general.mounts') }}<small>{{ trans('admin/general.mounts_desc') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li class="active">{{ trans('admin/general.mounts') }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.mount_list') }}</h3>

                    <div class="box-tools">
                        <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newMountModal">{{ trans('admin/general.create_new') }}</button>
                    </div>
                </div>

                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>{{ trans('strings.id') }}</th>
                                <th>{{ trans('strings.name') }}</th>
                                <th>{{ trans('admin/general.source') }}</th>
                                <th>{{ trans('admin/general.target') }}</th>
                                <th class="text-center">{{ trans('admin/general.eggs') }}</th>
                                <th class="text-center">{{ trans('admin/general.nodes') }}</th>
                                <th class="text-center">{{ trans('strings.servers') }}</th>
                            </tr>

                            @foreach ($mounts as $mount)
                                <tr>
                                    <td><code>{{ $mount->id }}</code></td>
                                    <td><a href="{{ route('admin.mounts.view', $mount->id) }}">{{ $mount->name }}</a></td>
                                    <td><code>{{ $mount->source }}</code></td>
                                    <td><code>{{ $mount->target }}</code></td>
                                    <td class="text-center">{{ $mount->eggs_count }}</td>
                                    <td class="text-center">{{ $mount->nodes_count }}</td>
                                    <td class="text-center">{{ $mount->servers_count }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="newMountModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <form action="{{ route('admin.mounts') }}" method="POST">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="{{ trans('strings.close') }}">
                            <span aria-hidden="true" style="color: #FFFFFF">&times;</span>
                        </button>

                        <h4 class="modal-title">{{ trans('admin/general.create_mount') }}</h4>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-12">
                                <label for="pName" class="form-label">{{ trans('strings.name') }}</label>
                                <input type="text" id="pName" name="name" class="form-control" />
                                <p class="text-muted small">{{ trans('admin/general.mount_name_desc') }}</p>
                            </div>

                            <div class="col-md-12">
                                <label for="pDescription" class="form-label">{{ trans('strings.description') }}</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="4"></textarea>
                                <p class="text-muted small">{{ trans('admin/general.mount_description_desc') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label for="pSource" class="form-label">{{ trans('admin/general.source') }}</label>
                                <input type="text" id="pSource" name="source" class="form-control" />
                                <p class="text-muted small">{{ trans('admin/general.mount_source_desc') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label for="pTarget" class="form-label">{{ trans('admin/general.target') }}</label>
                                <input type="text" id="pTarget" name="target" class="form-control" />
                                <p class="text-muted small">{{ trans('admin/general.mount_target_desc') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ trans('admin/general.read_only') }}</label>

                                <div>
                                    <div class="radio radio-success radio-inline">
                                        <input type="radio" id="pReadOnlyFalse" name="read_only" value="0" checked>
                                        <label for="pReadOnlyFalse">{{ trans('admin/general.false_label') }}</label>
                                    </div>

                                    <div class="radio radio-warning radio-inline">
                                        <input type="radio" id="pReadOnly" name="read_only" value="1">
                                        <label for="pReadOnly">{{ trans('admin/general.true_label') }}</label>
                                    </div>
                                </div>

                                <p class="text-muted small">{{ trans('admin/general.mount_readonly_desc') }}</p>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ trans('admin/general.user_mountable') }}</label>

                                <div>
                                    <div class="radio radio-success radio-inline">
                                        <input type="radio" id="pUserMountableFalse" name="user_mountable" value="0" checked>
                                        <label for="pUserMountableFalse">{{ trans('admin/general.false_label') }}</label>
                                    </div>

                                    <div class="radio radio-warning radio-inline">
                                        <input type="radio" id="pUserMountable" name="user_mountable" value="1">
                                        <label for="pUserMountable">{{ trans('admin/general.true_label') }}</label>
                                    </div>
                                </div>

                                <p class="text-muted small">{{ trans('admin/general.mount_user_desc') }}</p>
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
