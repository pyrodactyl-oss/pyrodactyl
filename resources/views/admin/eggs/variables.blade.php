@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.egg') }} &rarr; {{ $egg->name }} &rarr; {{ trans('admin/general.variables') }}
@endsection

@section('content-header')
    <h1>{{ $egg->name }}<small>{{ trans('admin/general.manage_variables') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.nests') }}">{{ trans('admin/general.nests') }}</a></li>
        <li><a href="{{ route('admin.nests.view', $egg->nest->id) }}">{{ $egg->nest->name }}</a></li>
        <li><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ $egg->name }}</a></li>
        <li class="active">{{ trans('admin/general.variables') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nests.egg.view', $egg->id) }}">{{ trans('admin/general.configuration') }}</a></li>
                <li class="active"><a href="{{ route('admin.nests.egg.variables', $egg->id) }}">{{ trans('admin/general.variables') }}</a></li>
                <li><a href="{{ route('admin.nests.egg.scripts', $egg->id) }}">{{ trans('admin/general.install_script') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box no-border">
            <div class="box-body">
                <a href="#" class="btn btn-sm btn-success pull-right" data-toggle="modal" data-target="#newVariableModal">{{ trans('admin/general.create_new_variable') }}</a>
            </div>
        </div>
    </div>
</div>
<div class="row">
    @foreach($egg->variables as $variable)
        <div class="col-sm-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ $variable->name }}</h3>
                </div>
                <form action="{{ route('admin.nests.egg.variables.edit', ['egg' => $egg->id, 'variable' => $variable->id]) }}" method="POST">
                    <div class="box-body">
                        <div class="form-group">
                            <label class="form-label">{{ trans('strings.name') }}</label>
                            <input type="text" name="name" value="{{ $variable->name }}" class="form-control" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">{{ trans('strings.description') }}</label>
                            <textarea name="description" class="form-control" rows="3">{{ $variable->description }}</textarea>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="form-label">{{ trans('admin/general.environment_variable') }}</label>
                                <input type="text" name="env_variable" value="{{ $variable->env_variable }}" class="form-control" />
                            </div>
                            <div class="form-group col-md-6">
                                <label class="form-label">{{ trans('admin/general.default_value') }}</label>
                                <input type="text" name="default_value" value="{{ $variable->default_value }}" class="form-control" />
                            </div>
                            <div class="col-xs-12">
                                <p class="text-muted small">{!! trans('admin/general.variable_access_desc', ['var' => $variable->env_variable]) !!}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">{{ trans('admin/general.permissions') }}</label>
                            <select name="options[]" class="pOptions form-control" multiple>
                                <option value="user_viewable" {{ (! $variable->user_viewable) ?: 'selected' }}>{{ trans('admin/general.users_can_view') }}</option>
                                <option value="user_editable" {{ (! $variable->user_editable) ?: 'selected' }}>{{ trans('admin/general.users_can_edit') }}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">{{ trans('admin/general.input_rules') }}</label>
                            <input type="text" name="rules" class="form-control" value="{{ $variable->rules }}" />
                            <p class="text-muted small">{!! trans('admin/general.input_rules_desc') !!}</p>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button class="btn btn-sm btn-primary pull-right" name="_method" value="PATCH" type="submit">{{ trans('strings.save') }}</button>
                        <button class="btn btn-sm btn-danger pull-left muted muted-hover" data-action="delete" name="_method" value="DELETE" type="submit"><i class="fa fa-trash-o"></i></button>
                    </div>
                </form>
            </div>
        </div>
    @endforeach
</div>
<div class="modal fade" id="newVariableModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="{{ trans('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{ trans('admin/general.create_new_egg_variable') }}</h4>
            </div>
            <form action="{{ route('admin.nests.egg.variables', $egg->id) }}" method="POST">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="control-label">{{ trans('strings.name') }} <span class="field-required"></span></label>
                        <input type="text" name="name" class="form-control" value="{{ old('name') }}"/>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ trans('strings.description') }}</label>
                        <textarea name="description" class="form-control" rows="3">{{ old('description') }}</textarea>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label class="control-label">{{ trans('admin/general.environment_variable') }} <span class="field-required"></span></label>
                            <input type="text" name="env_variable" class="form-control" value="{{ old('env_variable') }}" />
                        </div>
                        <div class="form-group col-md-6">
                            <label class="control-label">{{ trans('admin/general.default_value') }}</label>
                            <input type="text" name="default_value" class="form-control" value="{{ old('default_value') }}" />
                        </div>
                        <div class="col-xs-12">
                            <p class="text-muted small">{!! trans('admin/general.variable_access_hint') !!}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ trans('admin/general.permissions') }}</label>
                        <select name="options[]" class="pOptions form-control" multiple>
                            <option value="user_viewable">{{ trans('admin/general.users_can_view') }}</option>
                            <option value="user_editable">{{ trans('admin/general.users_can_edit') }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ trans('admin/general.input_rules') }} <span class="field-required"></span></label>
                        <input type="text" name="rules" class="form-control" value="{{ old('rules', 'required|string|max:20') }}" placeholder="required|string|max:20" />
                        <p class="text-muted small">{!! trans('admin/general.input_rules_desc') !!}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default pull-left" data-dismiss="modal">{{ trans('strings.close') }}</button>
                    <button type="submit" class="btn btn-primary">{{ trans('admin/general.create_variable') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('.pOptions').select2();
        $('[data-action="delete"]').on('mouseenter', function (event) {
            $(this).find('i').html('{{ trans('admin/general.delete_variable_hover') }}');
        }).on('mouseleave', function (event) {
            $(this).find('i').html('');
        });
    </script>
@endsection
