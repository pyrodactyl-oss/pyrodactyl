// Provides necessary information for components to function properly
// million-ignore
const PyrodactylProvider = ({ children }) => (
    <div
        data-pyro-commit-hash={import.meta.env.VITE_COMMIT_HASH}
        data-pyro-pyrodactyl-build={import.meta.env.VITE_PYRODACTYL_BUILD_NUMBER}
        data-pyro-pyrodactyl-version={import.meta.env.VITE_PYRODACTYL_VERSION}
        data-pyro-pyrodactylprovider=''
        style={{
            display: 'contents',
        }}
    >
        {children}
    </div>
);

export default PyrodactylProvider;
