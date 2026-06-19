@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.nests') }}
@endsection

@section('content-header')
    <h1>{{ trans('admin/general.nests') }}<small>{{ trans('admin/general.all_nests_available') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li class="active">{{ trans('admin/general.nests') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="alert alert-danger">
            {!! trans('admin/general.eggs_warning') !!}
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.configured_nests') }}</h3>
                <div class="box-tools">
                    <a href="#" class="btn btn-sm btn-success" data-toggle="modal" data-target="#importServiceOptionModal" role="button"><i class="fa fa-upload"></i> {{ trans('admin/general.import_egg') }}</a>
                    <a href="#" class="btn btn-sm btn-success" data-toggle="modal" data-target="#importServiceOptionFromUrlModal" role="button"><i class="fa fa-upload"></i> {{ trans('admin/general.import_egg_from_url') }}</a>
                    <a href="{{ route('admin.nests.new') }}" class="btn btn-primary btn-sm">{{ trans('admin/general.create_new') }}</a>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>{{ trans('strings.id') }}</th>
                        <th>{{ trans('strings.name') }}</th>
                        <th>{{ trans('strings.description') }}</th>
                        <th class="text-center">{{ trans('admin/general.eggs') }}</th>
                        <th class="text-center">{{ trans('strings.servers') }}</th>
                    </tr>
                    @foreach($nests as $nest)
                        <tr>
                            <td class="middle"><code>{{ $nest->id }}</code></td>
                            <td class="middle"><a href="{{ route('admin.nests.view', $nest->id) }}" data-toggle="tooltip" data-placement="right" title="{{ $nest->author }}">{{ $nest->name }}</a></td>
                            <td class="col-xs-6 middle">{{ $nest->description }}</td>
                            <td class="text-center middle">{{ $nest->eggs_count }}</td>
                            <td class="text-center middle">{{ $nest->servers_count }}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" tabindex="-1" role="dialog" id="importServiceOptionModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="{{ trans('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{ trans('admin/general.import_an_egg') }}</h4>
            </div>
            <form action="{{ route('admin.nests.egg.import') }}" enctype="multipart/form-data" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="control-label" for="pImportFile">{{ trans('admin/general.egg_file') }} <span class="field-required"></span></label>
                        <div>
                            <input id="pImportFile" type="file" name="import_file" class="form-control" accept="application/json" />
                            <p class="small text-muted">{!! trans('admin/general.egg_import_file_desc') !!}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="pImportToNest">{{ trans('admin/general.associated_nest') }} <span class="field-required"></span></label>
                        <div>
                            <select id="pImportToNest" name="import_to_nest">
                                @foreach($nests as $nest)
                                   <option value="{{ $nest->id }}">{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                @endforeach
                            </select>
                            <p class="small text-muted">{{ trans('admin/general.egg_import_nest_desc') }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {{ csrf_field() }}
                    <button type="button" class="btn btn-default" data-dismiss="modal">{{ trans('strings.cancel') }}</button>
                    <button type="submit" class="btn btn-primary">{{ trans('admin/general.import') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
<div class="modal fade" tabindex="-1" role="dialog" id="importServiceOptionFromUrlModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="{{ trans('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{ trans('admin/general.import_an_egg') }}</h4>
            </div>
            <form action="{{ route('admin.nests.egg.import_url') }}" enctype="multipart/form-data" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="control-label" for="pImportFileUrl">{{ trans('admin/general.egg_url') }} <span class="field-required"></span></label>
                        <div>
                            <input id="pImportFileUrl" type="url" name="import_file_url" class="form-control" accept="application/json" />
                            <p class="small text-muted">{{ trans('admin/general.egg_import_url_desc') }}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label" for="pImportToNestUrl">{{ trans('admin/general.associated_nest') }} <span class="field-required"></span></label>
                        <div>
                            <select id="pImportToNestUrl" name="import_to_nest">
                                @foreach($nests as $nest)
                                   <option value="{{ $nest->id }}">{{ $nest->name }} &lt;{{ $nest->author }}&gt;</option>
                                @endforeach
                            </select>
                            <p class="small text-muted">{{ trans('admin/general.egg_import_nest_desc') }}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {{ csrf_field() }}
                    <button type="button" class="btn btn-default" data-dismiss="modal">{{ trans('strings.cancel') }}</button>
                    <button type="submit" class="btn btn-primary">{{ trans('admin/general.import') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            $('#pImportToNest').select2();
            $('#pImportToNestUrl').select2();
        });
    </script>
@endsection
