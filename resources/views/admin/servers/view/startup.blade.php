{{-- Translated: server startup configuration (titles, breadcrumbs, labels, buttons, warnings) --}}
@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.server_title_prefix') }} — {{ $server->name }}: {{ trans('admin/general.startup') }}
@endsection

@section('content-header')
    <h1>{{ $server->name }}<small>{{ trans('admin/general.control_startup_desc') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.servers') }}">{{ trans('strings.servers') }}</a></li>
        <li><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></li>
        <li class="active">{{ trans('admin/general.startup') }}</li>
    </ol>
@endsection

@section('content')
@include('admin.servers.partials.navigation')
<form action="{{ route('admin.servers.view.startup', $server->id) }}" method="POST">
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.startup_command_modification') }}</h3>
                </div>
                <div class="box-body">
                    <label for="pStartup" class="form-label">{{ trans('admin/general.startup_command') }}</label>
                    <input id="pStartup" name="startup" class="form-control" type="text" value="{{ old('startup', $server->startup) }}" />
                    <p class="small text-muted">{!! trans('admin/general.startup_command_desc') !!}</p>
                </div>
                <div class="box-body">
                    <label for="pDefaultStartupCommand" class="form-label">{{ trans('admin/general.default_service_startup_command') }}</label>
                    <input id="pDefaultStartupCommand" class="form-control" type="text" readonly />
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary btn-sm pull-right">{{ trans('admin/general.save_modifications') }}</button>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.service_configuration') }}</h3>
                </div>
                <div class="box-body row">
                    <div class="col-xs-12">
                        <p class="small text-danger">
                            {{ trans('admin/general.reinstall_warning') }}
                        </p>
                        <p class="small text-danger">
                            <strong>{{ trans('admin/general.reinstall_warning_destructive') }}</strong>
                        </p>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="pNestId">{{ trans('admin/general.nests') }}</label>
                        <select name="nest_id" id="pNestId" class="form-control">
                            @foreach($nests as $nest)
                                <option value="{{ $nest->id }}"
                                    @if($nest->id === $server->nest_id)
                                        selected
                                    @endif
                                >{{ $nest->name }}</option>
                            @endforeach
                        </select>
                        <p class="small text-muted no-margin">{{ trans('admin/general.service_configuration_desc') }}</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <label for="pEggId">{{ trans('admin/general.egg') }}</label>
                        <select name="egg_id" id="pEggId" class="form-control"></select>
                        <p class="small text-muted no-margin">{{ trans('admin/general.egg_configuration_desc') }}</p>
                    </div>
                    <div class="form-group col-xs-12">
                        <div class="checkbox checkbox-primary no-margin-bottom">
                            <input id="pSkipScripting" name="skip_scripts" type="checkbox" value="1" @if($server->skip_scripts) checked @endif />
                            <label for="pSkipScripting" class="strong">{{ trans('admin/general.skip_egg_install_script') }}</label>
                        </div>
                        <p class="small text-muted no-margin">{{ trans('admin/general.skip_egg_install_script_desc') }}</p>
                    </div>
                </div>
            </div>
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.docker_image_configuration') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pDockerImage">{{ trans('admin/general.image') }}</label>
                        <select id="pDockerImage" name="docker_image" class="form-control"></select>
                        <input id="pDockerImageCustom" name="custom_docker_image" value="{{ old('custom_docker_image') }}" class="form-control" placeholder="{{ trans('admin/general.custom_image_placeholder') }}" style="margin-top:1rem"/>
                        <p class="small text-muted no-margin">{{ trans('admin/general.docker_image_configuration_desc') }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="row" id="appendVariablesTo"></div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/lodash/lodash.js') !!}
    <script>
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    $(document).ready(function () {
        $('#pEggId').select2({placeholder: '{{ trans('admin/general.select_nest_egg_placeholder') }}'}).on('change', function () {
            var selectedEgg = _.isNull($(this).val()) ? $(this).find('option').first().val() : $(this).val();
            var parentChain = _.get(Pyrodactyl.nests, $("#pNestId").val());
            var objectChain = _.get(parentChain, 'eggs.' + selectedEgg);

            const images = _.get(objectChain, 'docker_images', [])
            $('#pDockerImage').html('');
            const keys = Object.keys(images);
            for (let i = 0; i < keys.length; i++) {
                let opt = document.createElement('option');
                opt.value = images[keys[i]];
                opt.innerText = keys[i] + " (" + images[keys[i]] + ")";
                if (objectChain.id === parseInt(Pyrodactyl.server.egg_id) && Pyrodactyl.server.image == opt.value) {
                    opt.selected = true
                }
                $('#pDockerImage').append(opt);
            }
            $('#pDockerImage').on('change', function () {
                $('#pDockerImageCustom').val('');
            })

            if (objectChain.id === parseInt(Pyrodactyl.server.egg_id)) {
                if ($('#pDockerImage').val() != Pyrodactyl.server.image) {
                    $('#pDockerImageCustom').val(Pyrodactyl.server.image);
                }
            }

            if (!_.get(objectChain, 'startup', false)) {
                $('#pDefaultStartupCommand').val(_.get(parentChain, 'startup', 'ERROR: Startup Not Defined!'));
            } else {
                $('#pDefaultStartupCommand').val(_.get(objectChain, 'startup'));
            }

            $('#appendVariablesTo').html('');
            $.each(_.get(objectChain, 'variables', []), function (i, item) {
                var setValue = _.get(Pyrodactyl.server_variables, item.env_variable, item.default_value);
                var isRequired = (item.required === 1) ? '<span class="label label-danger">{{ trans('strings.required') }}</span> ' : '';
                var dataAppend = ' \
                    <div class="col-xs-12"> \
                        <div class="box"> \
                            <div class="box-header with-border"> \
                                <h3 class="box-title">' + isRequired + escapeHtml(item.name) + '</h3> \
                            </div> \
                            <div class="box-body"> \
                                <input name="environment[' + escapeHtml(item.env_variable) + ']" class="form-control" type="text" id="egg_variable_' + escapeHtml(item.env_variable) + '" /> \
                                <p class="no-margin small text-muted">' + escapeHtml(item.description) + '</p> \
                            </div> \
                            <div class="box-footer"> \
                                <p class="no-margin text-muted small"><strong>{{ trans('admin/general.startup_variable_label') }}</strong> <code>' + escapeHtml(item.env_variable) + '</code></p> \
                                <p class="no-margin text-muted small"><strong>{{ trans('admin/general.input_rules_label') }}</strong> <code>' + escapeHtml(item.rules) + '</code></p> \
                            </div> \
                        </div> \
                    </div>';
                $('#appendVariablesTo').append(dataAppend).find('#egg_variable_' + item.env_variable).val(setValue);
            });
        });

        $('#pNestId').select2({placeholder: '{{ trans('admin/general.select_nest_placeholder') }}'}).on('change', function () {
            $('#pEggId').html('').select2({
                data: $.map(_.get(Pyrodactyl.nests, $(this).val() + '.eggs', []), function (item) {
                    return {
                        id: item.id,
                        text: item.name,
                    };
                }),
            });

            if (_.isObject(_.get(Pyrodactyl.nests, $(this).val() + '.eggs.' + Pyrodactyl.server.egg_id))) {
                $('#pEggId').val(Pyrodactyl.server.egg_id);
            }

            $('#pEggId').change();
        }).change();
    });
    </script>
@endsection
