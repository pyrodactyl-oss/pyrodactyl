@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.database_hosts') }}
@endsection

@section('content-header')
    <h1>{{ trans('admin/general.database_hosts') }}<small>{{ trans('admin/general.database_hosts_desc') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li class="active">{{ trans('admin/general.database_hosts') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ trans('admin/general.host_list') }}</h3>
                <div class="box-tools">
                    <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newHostModal">{{ trans('admin/general.create_new') }}</button>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <th>{{ trans('strings.id') }}</th>
                            <th>{{ trans('strings.name') }}</th>
                            <th>{{ trans('admin/general.host') }}</th>
                            <th>{{ trans('strings.port') }}</th>
                            <th>{{ trans('strings.username') }}</th>
                            <th class="text-center">{{ trans('admin/general.databases') }}</th>
                            <th class="text-center">{{ trans('strings.node') }}</th>
                        </tr>
                        @foreach ($hosts as $host)
                            <tr>
                                <td><code>{{ $host->id }}</code></td>
                                <td><a href="{{ route('admin.databases.view', $host->id) }}">{{ $host->name }}</a></td>
                                <td><code>{{ $host->host }}</code></td>
                                <td><code>{{ $host->port }}</code></td>
                                <td>{{ $host->username }}</td>
                                <td class="text-center">{{ $host->databases_count }}</td>
                                <td class="text-center">
                                    @if(! is_null($host->node))
                                        <a href="{{ route('admin.nodes.view', $host->node->id) }}">{{ $host->node->name }}</a>
                                    @else
                                        <span class="label label-default">{{ trans('strings.none') }}</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="newHostModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <form action="{{ route('admin.databases') }}" method="POST" id="databaseHostForm">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="{{ trans('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">{{ trans('admin/general.create_new_database_host') }}</h4>
                </div>
                <div class="modal-body">
                    <div id="testResult" style="display: none;"></div>

                    <div class="form-group">
                        <label for="pName" class="form-label">{{ trans('strings.name') }}</label>
                        <input type="text" name="name" id="pName" class="form-control" value="{{ old('name') }}" />
                        <p class="text-muted small">{{ trans('admin/general.database_host_name_desc') }}</p>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label for="pHost" class="form-label">{{ trans('admin/general.host') }}</label>
                            <input type="text" name="host" id="pHost" class="form-control" value="{{ old('host') }}" />
                            <p class="text-muted small">{!! trans('admin/general.mysql_connect_desc') !!}</p>
                        </div>
                        <div class="col-md-6">
                            <label for="pPort" class="form-label">{{ trans('strings.port') }}</label>
                            <input type="text" name="port" id="pPort" class="form-control" value="{{ old('port', '3306') }}"/>
                            <p class="text-muted small">{{ trans('admin/general.mysql_port_desc') }}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label for="pUsername" class="form-label">{{ trans('strings.username') }}</label>
                            <input type="text" name="username" id="pUsername" class="form-control" value="{{ old('username') }}" />
                            <p class="text-muted small">{{ trans('admin/general.mysql_username_desc') }}</p>
                        </div>
                        <div class="col-md-6">
                            <label for="pPassword" class="form-label">{{ trans('strings.password') }}</label>
                            <input type="password" name="password" id="pPassword" class="form-control" />
                            <p class="text-muted small">{{ trans('admin/general.mysql_password_desc') }}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="pNodeId" class="form-label">{{ trans('admin/general.linked_node') }}</label>
                        <select name="node_id" id="pNodeId" class="form-control">
                            <option value="">{{ trans('strings.none') }}</option>
                            @foreach($locations as $location)
                                <optgroup label="{{ $location->short }}">
                                    @foreach($location->nodes as $node)
                                        <option value="{{ $node->id }}" {{ old('node_id') == $node->id ? 'selected' : '' }}>{{ $node->name }}</option>
                                    @endforeach
                                </optgroup>
                            @endforeach
                        </select>
                        <p class="text-muted small">{{ trans('admin/general.linked_node_desc') }}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <p class="text-danger small text-left">{!! trans('admin/general.mysql_grant_warning') !!}</p>
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">{{ trans('strings.cancel') }}</button>
                    <button type="button" id="testDatabaseBtn" class="btn btn-primary btn-sm">{{ trans('admin/general.test_database') }}</button>
                    <button type="submit" class="btn btn-success btn-sm">{{ trans('strings.create') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#pNodeId').select2();

        // Test database connection
        $('#testDatabaseBtn').on('click', function() {
            const button = $(this);
            const originalText = button.text();
            const resultDiv = $('#testResult');

            // Show loading state
            button.prop('disabled', true).text('{{ trans('admin/general.testing') }}');
            resultDiv.hide().removeClass('alert alert-danger alert-success').html('');

            // Get form data
            const formData = {
                host: $('#pHost').val(),
                port: $('#pPort').val(),
                username: $('#pUsername').val(),
                password: $('#pPassword').val(),
                _token: '{{ csrf_token() }}'
            };

            // Validate required fields
            if (!formData.host || !formData.port || !formData.username || !formData.password) {
                resultDiv.html('<strong>' + '{{ trans('strings.error') }}' + ':</strong> {{ trans('admin/general.fill_required_db_fields') }}').addClass('alert alert-danger').show();
                button.prop('disabled', false).text(originalText);
                return;
            }

            // Simple AJAX request
            $.ajax({
                url: '{{ route('admin.databases.test') }}',
                method: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        resultDiv.html('<strong>' + '{{ trans('strings.success') }}' + ':</strong> ' + response.message).addClass('alert alert-success').show();
                    } else {
                        resultDiv.html('<strong>' + '{{ trans('strings.error') }}' + ':</strong> ' + response.message).addClass('alert alert-danger').show();
                    }
                },
                error: function(xhr) {
                    let message = 'An unexpected error occurred.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    } else if (xhr.statusText) {
                        message = xhr.statusText;
                    }
                    resultDiv.html('<strong>' + '{{ trans('strings.error') }}' + ':</strong> ' + message).addClass('alert alert-danger').show();
                },
                complete: function() {
                    button.prop('disabled', false).text(originalText);
                }
            });
        });

        // Clear test results when modal is opened
        $('#newHostModal').on('show.bs.modal', function() {
            $('#testResult').hide().empty();
        });

        // Re-open modal if there are old inputs (form was submitted but had errors)
        @if($errors->any())
            $(document).ready(function() {
                $('#newHostModal').modal('show');
            });
        @endif
    </script>
@endsection
