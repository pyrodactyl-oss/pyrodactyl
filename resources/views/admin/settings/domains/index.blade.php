@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'domains'])

@section('title')
  {{ trans('admin/general.domain_management') }}
@endsection

@section('content-header')
  <h1>{{ trans('admin/general.domain_management') }}<small>{{ trans('admin/general.domain_management_desc') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
    <li><a href="{{ route('admin.settings') }}">{{ trans('strings.settings') }}</a></li>
    <li class="active">{{ trans('admin/general.domains') }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">{{ trans('admin/general.configured_domains') }}</h3>
          <div class="box-tools">
            <a href="{{ route('admin.settings.domains.create') }}" class="btn btn-sm btn-primary">{{ trans('admin/general.create_new_domain') }}</a>
          </div>
        </div>
        <div class="box-body table-responsive no-padding">
          @if(count($domains) > 0)
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>{{ trans('admin/general.domain_name') }}</th>
                  <th>{{ trans('admin/general.dns_provider') }}</th>
                  <th>{{ trans('strings.status') }}</th>
                  <th>{{ trans('admin/general.default_label') }}</th>
                  <th>{{ trans('admin/general.subdomains') }}</th>
                  <th>{{ trans('strings.created') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @foreach($domains as $domain)
                  <tr>
                    <td><code>{{ $domain->name }}</code></td>
                    <td>
                      <span class="label label-primary">{{ ucfirst($domain->dns_provider) }}</span>
                    </td>
                    <td>
                      @if($domain->is_active)
                        <span class="label label-success">{{ trans('admin/general.active_label') }}</span>
                      @else
                        <span class="label label-danger">{{ trans('admin/general.inactive_label') }}</span>
                      @endif
                    </td>
                    <td>
                      @if($domain->is_default)
                        <span class="label label-info">{{ trans('admin/general.default_label') }}</span>
                      @endif
                    </td>
                    <td>
                      <span class="label label-default">{{ $domain->server_subdomains_count ?? 0 }}</span>
                    </td>
                    <td>{{ $domain->created_at->diffForHumans() }}</td>
                    <td class="text-center">
                      <a href="{{ route('admin.settings.domains.edit', $domain) }}" class="btn btn-xs btn-primary">{{ trans('strings.edit') }}</a>
                      @if($domain->server_subdomains_count == 0)
                        <form action="{{ route('admin.settings.domains.destroy', $domain) }}" method="POST" style="display: inline;" onsubmit="return confirm('{{ trans('admin/general.delete_domain_confirm') }}')">
                          @csrf
                          @method('DELETE')
                          <button type="submit" class="btn btn-xs btn-danger">{{ trans('strings.delete') }}</button>
                        </form>
                      @endif
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @else
            <div class="text-center" style="padding: 50px;">
              <h4 class="text-muted">{{ trans('admin/general.no_domains_configured') }}</h4>
              <p class="text-muted">
                {{ trans('admin/general.no_domains_desc') }}<br>
                <a href="{{ route('admin.settings.domains.create') }}" class="btn btn-primary btn-sm" style="margin-top: 10px;">{{ trans('admin/general.create_first_domain') }}</a>
              </p>
            </div>
          @endif
        </div>
      </div>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    $(document).ready(function() {
      $('.btn-danger').click(function(e) {
        if (!confirm('{{ trans('admin/general.delete_domain_confirm') }}')) {
          e.preventDefault();
          return false;
        }
      });
    });
  </script>
@endsection
