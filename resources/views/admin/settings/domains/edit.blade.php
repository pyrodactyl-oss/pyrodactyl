@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'domains'])

@section('title')
  {{ trans('admin/general.edit_domain') }}
@endsection

@section('content-header')
  <h1>{{ trans('admin/general.edit_domain') }}<small>{{ trans('admin/general.update_domain_config') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ trans('strings.admin') }}</a></li>
    <li><a href="{{ route('admin.settings') }}">{{ trans('strings.settings') }}</a></li>
    <li><a href="{{ route('admin.settings.domains.index') }}">{{ trans('admin/general.domains') }}</a></li>
    <li class="active">{{ $domain->name }}</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <form action="{{ route('admin.settings.domains.update', $domain) }}" method="POST" id="domain-form">
        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">{{ trans('admin/general.domain_information') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label for="name" class="control-label">{{ trans('admin/general.domain_name') }} <span class="field-required">{{ __('strings.required') }}</span></label>
                <div>
                  <input type="text" name="name" id="name" class="form-control"
                         value="{{ old('name', $domain->name) }}" placeholder="example.com" required />
                  <p class="text-muted small">{{ trans('admin/general.domain_name_desc') }}</p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label for="dns_provider" class="control-label">{{ trans('admin/general.dns_provider') }} <span class="field-required">{{ __('strings.required') }}</span></label>
                <div>
                  <select name="dns_provider" id="dns_provider" class="form-control" required>
                    <option value="">{{ trans('admin/general.select_dns_provider') }}</option>
                    @foreach($providers as $key => $provider)
                      <option value="{{ $key }}"
                              @if(old('dns_provider', $domain->dns_provider) === $key) selected @endif>
                        {{ $provider['name'] }}
                      </option>
                    @endforeach
                  </select>
                  <p class="text-muted small">{{ trans('admin/general.dns_provider_desc') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="dns-config-box" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">{{ trans('admin/general.dns_provider_config') }}</h3>
          </div>
          <div class="box-body" id="dns-config-content">
            <!-- Dynamic content will be loaded here -->
          </div>
        </div>

        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">{{ trans('admin/general.additional_settings') }}</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-4">
                <label class="control-label">{{ trans('strings.status') }}</label>
                <div>
                  <div class="btn-group" data-toggle="buttons">
                    <label class="btn btn-primary @if(old('is_active', $domain->is_active)) active @endif">
                      <input type="radio" name="is_active" value="1"
                             @if(old('is_active', $domain->is_active)) checked @endif> {{ trans('admin/general.active_label') }}
                    </label>
                    <label class="btn btn-primary @if(!old('is_active', $domain->is_active)) active @endif">
                      <input type="radio" name="is_active" value="0"
                             @if(!old('is_active', $domain->is_active)) checked @endif> {{ trans('admin/general.inactive_label') }}
                    </label>
                  </div>
                  <p class="text-muted small">{{ trans('admin/general.domain_status_desc') }}</p>
                </div>
              </div>
              <div class="form-group col-md-4">
                <label class="control-label">{{ trans('admin/general.default_domain') }}</label>
                <div>
                  <div class="btn-group" data-toggle="buttons">
                    <label class="btn btn-primary @if(old('is_default', $domain->is_default)) active @endif">
                      <input type="radio" name="is_default" value="1"
                             @if(old('is_default', $domain->is_default)) checked @endif> {{ trans('strings.yes') }}
                    </label>
                    <label class="btn btn-primary @if(!old('is_default', $domain->is_default)) active @endif">
                      <input type="radio" name="is_default" value="0"
                             @if(!old('is_default', $domain->is_default)) checked @endif> {{ trans('strings.no') }}
                    </label>
                  </div>
                  <p class="text-muted small">{{ trans('admin/general.default_domain_desc') }}</p>
                </div>
              </div>
              <div class="form-group col-md-4">
                <label class="control-label">{{ trans('admin/general.active_subdomains') }}</label>
                <div>
                  <p class="form-control-static">
                    <span class="label label-default">{{ $domain->serverSubdomains->where('is_active', true)->count() }}</span>
                    {{ trans('admin/general.subdomains_using') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box box-primary">
          <div class="box-footer">
            {{ csrf_field() }}
            @method('PATCH')
            <button type="button" id="test-connection" class="btn btn-sm btn-info" disabled>
              <i class="fa fa-refresh fa-spin" style="display: none;"></i> {{ trans('admin/general.test_connection') }}
            </button>
            <a href="{{ route('admin.settings.domains.index') }}" class="btn btn-sm btn-default">{{ trans('strings.cancel') }}</a>
            <button type="submit" class="btn btn-sm btn-success pull-right">{{ trans('admin/general.update_domain') }}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    $(document).ready(function() {
      const $providerSelect = $('#dns_provider');
      const $configBox = $('#dns-config-box');
      const $configContent = $('#dns-config-content');
      const $testButton = $('#test-connection');
      const $form = $('#domain-form');
      const existingConfig = @json(old('dns_config', $domain->dns_config));

      // Handle provider selection
      $providerSelect.change(function() {
        const provider = $(this).val();

        if (provider) {
          loadProviderConfig(provider);
          $testButton.prop('disabled', false);
        } else {
          $configBox.hide();
          $testButton.prop('disabled', true);
        }
      });

      // Test connection
      $testButton.click(function() {
        const $button = $(this);
        const $spinner = $button.find('.fa-spin');

        // Gather form data
        const formData = {
          dns_provider: $providerSelect.val(),
          dns_config: {}
        };

        // Collect DNS config fields
        $configContent.find('input').each(function() {
          const name = $(this).attr('name');
          if (name && name.startsWith('dns_config[')) {
            const key = name.replace('dns_config[', '').replace(']', '');
            formData.dns_config[key] = $(this).val();
          }
        });

        $button.prop('disabled', true);
        $spinner.show();

        $.post('{{ route('admin.settings.domains.test-connection') }}', {
          _token: '{{ csrf_token() }}',
          ...formData
        })
        .done(function(response) {
          if (response.success) {
            swal({
              type: 'success',
              title: '{{ trans('admin/general.connection_successful') }}',
              text: response.message
            });
          } else {
            swal({
              type: 'error',
              title: '{{ trans('admin/general.connection_failed') }}',
              text: response.message
            });
          }
        })
        .fail(function(xhr) {
          const response = xhr.responseJSON || {};
          swal({
            type: 'error',
            title: '{{ trans('admin/general.connection_failed') }}',
            text: response.message || '{{ trans('admin/general.unexpected_error') }}'
          });
        })
        .always(function() {
          $button.prop('disabled', false);
          $spinner.hide();
        });
      });

      // Load provider configuration
      function loadProviderConfig(provider) {
        $.get(`{{ route('admin.settings.domains.provider-schema', ':provider') }}`.replace(':provider', provider))
          .done(function(response) {
            if (response.success) {
              renderConfigForm(response.schema);
              $configBox.show();
            }
          })
          .fail(function() {
            $configBox.hide();
          });
      }

      // Render configuration form
      function renderConfigForm(schema) {
        let html = '<div class="row">';

        Object.keys(schema).forEach(function(key) {
          const field = schema[key];
          const oldValue = existingConfig[key] || '';

          html += `
            <div class="form-group col-md-6">
              <label for="dns_config_${key}" class="control-label">
                ${field.description || key}
                ${field.required ? '<span class="field-required">{{ __('strings.required') }}</span>' : ''}
              </label>
              <div>
                <input type="${field.sensitive ? 'password' : 'text'}"
                       name="dns_config[${key}]"
                       id="dns_config_${key}"
                       class="form-control"
                       value="${oldValue}"
                       ${field.required ? 'required' : ''} />
              </div>
            </div>
          `;
        });

        html += '</div>';
        $configContent.html(html);
      }

      // Trigger change if provider is pre-selected
      if ($providerSelect.val()) {
        $providerSelect.trigger('change');
      }
    });
  </script>
@endsection
