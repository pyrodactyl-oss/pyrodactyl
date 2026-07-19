@include('partials/admin.settings.notice')

@section('settings::nav')
    @yield('settings::notice')
    <div class="row">
        <div class="col-xs-12">
            <div class="nav-tabs-custom nav-tabs-floating">
                <ul class="nav nav-tabs">
                    <li @if($activeTab === 'basic')class="active"@endif><a href="{{ route('admin.settings') }}">@lang('admin/general.general')</a></li>
                    <li @if($activeTab === 'mail')class="active"@endif><a href="{{ route('admin.settings.mail') }}">@lang('admin/general.mail')</a></li>
                    <li @if($activeTab === 'captcha')class="active"@endif><a href="{{ route('admin.settings.captcha') }}">@lang('admin/general.captcha')</a></li>
                    <li @if($activeTab === 'domains')class="active"@endif><a href="{{ route('admin.settings.domains.index') }}">@lang('admin/general.domains')</a></li>
                    <li @if($activeTab === 'advanced')class="active"@endif><a href="{{ route('admin.settings.advanced') }}">@lang('admin/general.advanced')</a></li>
                </ul>
            </div>
        </div>
    </div>
@endsection
