@extends('layouts.admin')

@section('title')
    {{ trans('admin/general.application_api_title') }}
@endsection

@section('content-header')
    <h1>{{ trans('admin/general.application_api_title') }}<small>{{ trans('admin/general.api_manage_desc') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li class="active">{{ trans('admin/general.application_api_title') }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.credentials_list') }}</h3>
                    <div class="box-tools">
                        <a href="{{ route('admin.api.new') }}" class="btn btn-sm btn-primary">{{ trans('admin/general.create_new') }}</a>
                    </div>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tr>
                            <th>{{ trans('admin/general.key') }}</th>
                            <th>{{ trans('strings.memo') }}</th>
                            <th>{{ trans('strings.last_used') }}</th>
                            <th>{{ trans('strings.created') }}</th>
                            <th></th>
                        </tr>
                        @foreach($keys as $key)
                            <tr>
                                <td><code>{{ $key->identifier }}{{ decrypt($key->token) }}</code></td>
                                <td>{{ $key->memo }}</td>
                                <td>
                                    @if(!is_null($key->last_used_at))
                                        {{ $key->last_used_at->locale(app()->getLocale())->isoFormat('LL') }}, {{ $key->last_used_at->locale(app()->getLocale())->isoFormat('LT') }}
                                    @else
                                        &mdash;
                                    @endif
                                </td>
                                    <td>{{ $key->created_at->locale(app()->getLocale())->isoFormat('LL') }}, {{ $key->created_at->locale(app()->getLocale())->isoFormat('LT') }}</td>
                                <td>
                                    <a href="#" data-action="revoke-key" data-attr="{{ $key->identifier }}">
                                        <i class="fa fa-trash-o text-danger"></i>
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
            $('[data-action="revoke-key"]').click(function (event) {
                var self = $(this);
                event.preventDefault();
                swal({
                    type: 'error',
                    title: '{{ trans('admin/general.revoke_api_key') }}',
                    text: '{{ trans('admin/general.revoke_api_key_text') }}',
                    showCancelButton: true,
                    allowOutsideClick: true,
                    closeOnConfirm: false,
                    confirmButtonText: '{{ trans('admin/general.revoke') }}',
                    confirmButtonColor: '#d9534f',
                    showLoaderOnConfirm: true
                }, function () {
                    $.ajax({
                        method: 'DELETE',
                        url: '/admin/api/revoke/' + self.data('attr'),
                        headers: {
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        }
                    }).done(function () {
                        swal({
                            type: 'success',
                            title: '',
                            text: '{{ trans('admin/general.api_key_revoked') }}'
                        });
                        self.parent().parent().slideUp();
                    }).fail(function (jqXHR) {
                        console.error(jqXHR);
                        swal({
                            type: 'error',
                            title: '{{ trans('admin/general.whoops') }}',
                            text: '{{ trans('admin/general.api_revoke_error') }}'
                        });
                    });
                });
            });
        });
    </script>
@endsection
