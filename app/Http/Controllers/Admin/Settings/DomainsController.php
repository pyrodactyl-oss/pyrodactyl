<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Models\Domain;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;
use Pterodactyl\Exceptions\Dns\DnsProviderException;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Pterodactyl\Http\Requests\Admin\Settings\DomainFormRequest;
use Pterodactyl\Enums\Subdomain\Providers;

class DomainsController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private SubdomainManagementService $subdomainService,
    ) {}

    /**
     * Display the domains management page.
     */
    public function index(): View
    {
        $domains = Domain::withCount('serverSubdomains')->orderBy('created_at', 'desc')->get();
        $availableProviders = $this->getAvailableProviders();

        return $this->view->make('admin.settings.domains.index', [
            'domains' => $domains,
            'providers' => $availableProviders,
        ]);
    }

    /**
     * Show the form for creating a new domain.
     */
    public function create(): View
    {
        $availableProviders = $this->getAvailableProviders();

        return $this->view->make('admin.settings.domains.create', [
            'providers' => $availableProviders,
        ]);
    }

    /**
     * Store a newly created domain.
     */
    public function store(DomainFormRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            // Test the DNS provider connection
            $providerClass = $this->getProviderClass($data['dns_provider']);
            $provider = new $providerClass($data['dns_config']);
            $provider->testConnection();

            // Handle domain creation in a transaction
            \DB::transaction(function () use ($data) {
                // If this domain is being set as default, remove default from other domains
                if (!empty($data['is_default'])) {
                    Domain::where('is_default', true)->update(['is_default' => false]);
                }

                // Create the domain
                Domain::create([
                    'name' => $data['name'],
                    'dns_provider' => $data['dns_provider'],
                    'dns_config' => $data['dns_config'],
                    'is_active' => $data['is_active'] ?? true,
                    'is_default' => $data['is_default'] ?? false,
                ]);
            });

            return redirect()->route('admin.settings.domains.index')
                ->with('success', trans('admin/general.domain_created'));
        } catch (DnsProviderException $e) {
            return back()->withInput()->withErrors(['dns_config' => $e->getMessage()]);
        } catch (\Exception $e) {
            return back()->withInput()->withErrors(['general' => trans('admin/general.domain_create_failed', ['error' => $e->getMessage()])]);
        }
    }

    /**
     * Show the form for editing a domain.
     */
    public function edit(Domain $domain): View
    {
        $domain->load('serverSubdomains');
        $availableProviders = $this->getAvailableProviders();

        return $this->view->make('admin.settings.domains.edit', [
            'domain' => $domain,
            'providers' => $availableProviders,
        ]);
    }

    /**
     * Update the specified domain.
     */
    public function update(DomainFormRequest $request, Domain $domain): RedirectResponse
    {
        $data = $request->validated();

        try {
            // Test the DNS provider connection if config changed
            if ($data['dns_config'] !== $domain->dns_config || $data['dns_provider'] !== $domain->dns_provider) {
                $providerClass = $this->getProviderClass($data['dns_provider']);
                $provider = new $providerClass($data['dns_config']);
                $provider->testConnection();
            }

            // Handle domain update in a transaction
            \DB::transaction(function () use ($data, $domain) {
                // Handle default domain changes
                $newIsDefault = $data['is_default'] ?? false;
                if ($newIsDefault && !$domain->is_default) {
                    // If this domain is being set as default, remove default from other domains
                    Domain::where('is_default', true)->update(['is_default' => false]);
                } elseif (!$newIsDefault && $domain->is_default) {
                    // Don't allow removing default status if this is the only default domain
                    $defaultCount = Domain::where('is_default', true)->count();
                    if ($defaultCount <= 1) {
                        throw new \Exception(trans('admin/general.domain_remove_default'));
                    }
                }

                // Update the domain
                $domain->update([
                    'name' => $data['name'],
                    'dns_provider' => $data['dns_provider'],
                    'dns_config' => $data['dns_config'],
                    'is_active' => $data['is_active'] ?? $domain->is_active,
                    'is_default' => $newIsDefault,
                ]);
            });

            return redirect()->route('admin.settings.domains.index')
                ->with('success', trans('admin/general.domain_updated'));
        } catch (DnsProviderException $e) {
            return back()->withInput()->withErrors(['dns_config' => $e->getMessage()]);
        } catch (\Exception $e) {
            return back()->withInput()->withErrors(['general' => trans('admin/general.domain_update_failed', ['error' => $e->getMessage()])]);
        }
    }

    /**
     * Remove the specified domain.
     */
    public function destroy(Domain $domain): RedirectResponse
    {
        try {
            // Check if domain has active subdomains
            $activeSubdomains = $domain->activeSubdomains()->count();
            if ($activeSubdomains > 0) {
                return back()->withErrors(['general' => trans('admin/general.domain_delete_active_subdomains', ['count' => $activeSubdomains])]);
            }

            // Don't allow deleting the only default domain
            if ($domain->is_default) {
                $defaultCount = Domain::where('is_default', true)->count();
                if ($defaultCount <= 1) {
                    return back()->withErrors(['general' => trans('admin/general.domain_delete_only_default')]);
                }
            }

            $domain->delete();

            return redirect()->route('admin.settings.domains.index')
                ->with('success', trans('admin/general.domain_deleted'));
        } catch (\Exception $e) {
            return back()->withErrors(['general' => trans('admin/general.domain_delete_failed', ['error' => $e->getMessage()])]);
        }
    }

    /**
     * Test the connection to a DNS provider.
     */
    public function testConnection(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'dns_provider' => 'required|string',
            'dns_config' => 'required|array',
        ]);

        try {
            $providerClass = $this->getProviderClass($request->input('dns_provider'));
            $provider = new $providerClass($request->input('dns_config'));
            $provider->testConnection();

            return response()->json(['success' => true, 'message' => trans('admin/general.domain_connection_successful')]);
        } catch (DnsProviderException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => trans('admin/general.domain_connection_failed', ['error' => $e->getMessage()])], 500);
        }
    }

    /**
     * Get configuration schema for a DNS provider.
     */
    public function getProviderSchema(string $provider): \Illuminate\Http\JsonResponse
    {
        try {
            $providerClass = $this->getProviderClass($provider);
            $providerInstance = new $providerClass([]);
            $schema = $providerInstance->getConfigurationSchema();

            return response()->json(['success' => true, 'schema' => $schema]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get available DNS providers.
     */
    private function getAvailableProviders(): array
    {
        return Providers::allWithDescriptions();
    }

    /**
     * Get the provider class for a given provider name.
     */
    private function getProviderClass(string $provider): string
    {
        $providers = Providers::all();

        if (!isset($providers[$provider])) {
            throw new \Exception(trans('admin/general.domain_unsupported_provider', ['provider' => $provider]));
        }

        return $providers[$provider];
    }
}
