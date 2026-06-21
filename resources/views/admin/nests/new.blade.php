@extends('layouts.admin')

@section('title', trans('admin/general.new_nest'))

@section('content-header')
    <h1>{{ trans('admin/general.new_nest') }}<small>{{ trans('admin/general.new_nest_desc') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
        <li><a href="{{ route('admin.nests') }}">{{ trans('admin/general.nests') }}</a></li>
        <li class="active">{{ trans('strings.new') }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.nests.new') }}" method="POST">
    <div class="row">
        <div class="col-md-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ trans('admin/general.new_nest') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label class="control-label">{{ trans('strings.name') }}</label>
                        <div>
                            <input type="text" name="name" class="form-control" value="{{ old('name') }}" />
                            <p class="text-muted"><small>{{ trans('admin/general.nest_name_desc') }}</small></p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ trans('strings.description') }}</label>
                        <div>
                            <textarea name="description" class="form-control" rows="6">{{ old('description') }}</textarea>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary pull-right">{{ trans('strings.save') }}</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection
