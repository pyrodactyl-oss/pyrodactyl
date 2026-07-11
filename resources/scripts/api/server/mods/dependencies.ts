import { ModDependency, ModVersion } from './types';

export interface ResolutionInput {
    /** The version the user is about to install. */
    target: ModVersion;
    /** IDs of already-installed mods, namespaced (e.g. "modrinth:AANobbMI"). */
    installedModIds: Set<string>;
}

export interface DependencyResolution {
    /** Required deps that aren't installed yet. UI should offer to install these too. */
    missingRequired: ModDependency[];
    /** Optional deps not installed — surfaced but not blocking. */
    missingOptional: ModDependency[];
    /** Incompatible deps that ARE installed — blocking. */
    incompatibleInstalled: ModDependency[];
    /** Whether the action can proceed (modulo the user accepting `missingRequired`). */
    canProceed: boolean;
    /** Whether the user must be prompted to install required deps. */
    requiresPrompt: boolean;
}

/**
 * Inspects a version's dependencies and classifies them based on what's
 * already installed.
 *
 * Rules (from spec):
 *   - required + not installed     → prompt to install all (one confirm)
 *   - optional + not installed     → surface but don't block
 *   - incompatible + installed     → block with clear warning
 *   - incompatible + not installed → ignore
 *   - embedded                     → ignore (mod bundles the dep itself)
 *   - dep with null modId          → ignore (unresolvable reference)
 */
export const resolveDependencies = ({ target, installedModIds }: ResolutionInput): DependencyResolution => {
    const missingRequired: ModDependency[] = [];
    const missingOptional: ModDependency[] = [];
    const incompatibleInstalled: ModDependency[] = [];

    for (const dep of target.dependencies) {
        if (!dep.modId) continue;

        const installed = installedModIds.has(dep.modId);
        switch (dep.type) {
            case 'required':
                if (!installed) missingRequired.push(dep);
                break;
            case 'optional':
                if (!installed) missingOptional.push(dep);
                break;
            case 'incompatible':
                if (installed) incompatibleInstalled.push(dep);
                break;
            case 'embedded':
                break;
        }
    }

    return {
        missingRequired,
        missingOptional,
        incompatibleInstalled,
        canProceed: incompatibleInstalled.length === 0,
        requiresPrompt: missingRequired.length > 0,
    };
};
