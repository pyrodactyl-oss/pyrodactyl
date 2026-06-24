import { Box, TriangleExclamation } from '@gravity-ui/icons';
import { useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import getNests from '@/api/nests/getNests';
import applyEggChange from '@/api/server/applyEggChange';
import applyEggChangeSync from '@/api/server/applyEggChangeSync';
import { getGlobalDaemonType } from '@/api/server/getServer';
import previewEggChange, { type EggPreview } from '@/api/server/previewEggChange';
import type { ServerOperation } from '@/api/server/serverOperations';
import getServerBackups from '@/api/swr/getServerBackups';
import getServerStartup from '@/api/swr/getServerStartup';
import ActionButton from '@/components/elements/ActionButton';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Switch } from '@/components/elements/SwitchV2';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import OperationProgressModal from '@/components/server/operations/OperationProgressModal';
import WingsOperationProgressModal from '@/components/server/operations/WingsOperationProgressModal';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { ServerContext } from '@/state/server';

interface Egg {
    attributes: {
        id: number;
        uuid: string;
        name: string;
        description: string;
    };
    object: string;
}

interface Nest {
    attributes: {
        id: number;
        uuid: string;
        author: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        relationships: {
            eggs: {
                object: string;
                data: Egg[];
            };
        };
    };
    object: string;
}

const MAX_DESCRIPTION_LENGTH = 150;
const hidden_nest_prefix = '!';
const blank_egg_prefix = '@';

type FlowStep = 'overview' | 'select-game' | 'select-software' | 'configure' | 'review';

// Laravel-style validation function
const validateEnvironmentVariables = (variables: any[], pendingVariables: Record<string, string>): string[] => {
    const errors: string[] = [];

    variables.forEach((variable) => {
        if (!variable.user_editable) return; // Skip non-editable variables

        const value = pendingVariables[variable.env_variable] || '';
        const rules = variable.rules || '';
        const ruleArray = rules
            .split('|')
            .map((rule) => rule.trim())
            .filter((rule) => rule.length > 0);

        // Check if variable is required (backend automatically adds nullable if not present)
        const isRequired = ruleArray.includes('required');
        const isNullable = ruleArray.includes('nullable') || !isRequired;

        // If required and empty/null
        if (isRequired && (!value || value.trim() === '')) {
            errors.push(`${variable.name} is required.`);
            return;
        }

        // If nullable and empty, skip other validations
        if (isNullable && (!value || value.trim() === '')) {
            return;
        }

        // Validate each rule
        ruleArray.forEach((rule) => {
            const [ruleName, ruleValue] = rule.split(':');

            switch (ruleName) {
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(`${variable.name} must be a string.`);
                    }
                    break;

                case 'integer':
                case 'numeric':
                    if (value && Number.isNaN(Number(value))) {
                        errors.push(`${variable.name} must be a number.`);
                    }
                    break;

                case 'boolean': {
                    const boolValues = ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'];
                    if (value && !boolValues.includes(value.toLowerCase())) {
                        errors.push(`${variable.name} must be true or false.`);
                    }
                    break;
                }

                case 'min': {
                    if (ruleValue && value) {
                        const minValue = Number.parseInt(ruleValue, 10);
                        if (value.length < minValue) {
                            errors.push(`${variable.name} must be at least ${minValue} characters.`);
                        }
                    }
                    break;
                }

                case 'max': {
                    if (ruleValue && value) {
                        const maxValue = Number.parseInt(ruleValue, 10);
                        if (value.length > maxValue) {
                            errors.push(`${variable.name} may not be greater than ${maxValue} characters.`);
                        }
                    }
                    break;
                }

                case 'between': {
                    if (ruleValue && value) {
                        const [min, max] = ruleValue.split(',').map((v) => Number.parseInt(v.trim(), 10));
                        if (value.length < min || value.length > max) {
                            errors.push(`${variable.name} must be between ${min} and ${max} characters.`);
                        }
                    }
                    break;
                }

                case 'in': {
                    if (ruleValue && value) {
                        const allowedValues = ruleValue.split(',').map((v) => v.trim());
                        if (!allowedValues.includes(value)) {
                            errors.push(`${variable.name} must be one of: ${allowedValues.join(', ')}.`);
                        }
                    }
                    break;
                }

                case 'regex': {
                    if (ruleValue && value) {
                        try {
                            // Handle Laravel regex format: regex:/pattern/flags
                            const regexMatch = ruleValue.match(/^\/(.+)\/([gimuy]*)$/);
                            if (regexMatch) {
                                const regex = new RegExp(regexMatch[1], regexMatch[2]);
                                if (!regex.test(value)) {
                                    errors.push(`${variable.name} format is invalid.`);
                                }
                            }
                        } catch {
                            // Invalid regex - skip validation
                        }
                    }
                    break;
                }

                case 'alpha':
                    if (value && !/^[a-zA-Z]+$/.test(value)) {
                        errors.push(`${variable.name} may only contain letters.`);
                    }
                    break;

                case 'alpha_num':
                    if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
                        errors.push(`${variable.name} may only contain letters and numbers.`);
                    }
                    break;

                case 'alpha_dash':
                    if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
                        errors.push(`${variable.name} may only contain letters, numbers, dashes and underscores.`);
                    }
                    break;

                case 'url':
                    if (value) {
                        try {
                            new URL(value);
                        } catch {
                            errors.push(`${variable.name} must be a valid URL.`);
                        }
                    }
                    break;

                case 'email':
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push(`${variable.name} must be a valid email address.`);
                    }
                    break;

                case 'ip': {
                    if (value) {
                        const ipRegex =
                            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                        if (!ipRegex.test(value)) {
                            errors.push(`${variable.name} must be a valid IP address.`);
                        }
                    }
                    break;
                }

                // Skip validation rules that don't apply to frontend
                case 'required':
                case 'nullable':
                case 'sometimes':
                    break;

                default:
                    // Unknown rule - log for debugging but don't error
                    if (
                        process.env.NODE_ENV === 'development' &&
                        !['string', 'array', 'file', 'image'].includes(ruleName)
                    ) {
                        console.warn(`Unknown validation rule: ${ruleName} for variable ${variable.name}`);
                    }
                    break;
            }
        });
    });

    return errors;
};

const SoftwareContainer = () => {
    const serverData = ServerContext.useStoreState((state) => state.server.data);
    const daemonType = getGlobalDaemonType();
    const uuid = serverData?.uuid;
    const [nests, setNests] = useState<Nest[]>();
    //const eggs = nests?.reduce(
    //    (eggArray, nest) => [...eggArray, ...nest.attributes.relationships.eggs.data],
    //    [] as Egg[],
    //);
    const currentEgg = serverData?.egg;
    //const originalEgg = currentEgg;
    const currentEggName = useMemo(() => {
        // Don't attempt calculation until both nests data and currentEgg are available
        if (!(nests && currentEgg)) {
            return;
        }

        const foundNest = nests.find((nest) =>
            nest?.attributes?.relationships?.eggs?.data?.find((egg) => egg?.attributes?.uuid === currentEgg),
        );

        return foundNest?.attributes?.relationships?.eggs?.data?.find((egg) => egg?.attributes?.uuid === currentEgg)
            ?.attributes?.name;
    }, [nests, currentEgg]);
    const backupLimit = serverData?.featureLimits.backups;

    const { data: backups } = getServerBackups();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    // Flow state
    const [currentStep, setCurrentStep] = useState<FlowStep>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [eggPreview, setEggPreview] = useState<EggPreview | null>(null);
    const [pendingVariables, setPendingVariables] = useState<Record<string, string>>({});
    const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});
    const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);
    const [showOperationModal, setShowOperationModal] = useState(false);
    const [showWipeConfirmation, setShowWipeConfirmation] = useState(false);
    const [wipeCountdown, setWipeCountdown] = useState(5);
    const [wipeLoading, setWipeLoading] = useState(false);
    const [shiftPressed, setShiftPressed] = useState(false);

    // Configuration options
    const [shouldBackup, setShouldBackup] = useState(false);
    const [shouldWipe, setShouldWipe] = useState(false);
    const [showFullDescriptions, setShowFullDescriptions] = useState<Record<string, boolean>>({});

    // Startup and Docker configuration
    const [customStartup, setCustomStartup] = useState('');
    const [selectedDockerImage, setSelectedDockerImage] = useState('');

    // Data loading
    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };
        fetchData();
    }, []);

    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data?.variables || [],
            invocation: server.data?.invocation || '',
            dockerImage: server.data?.dockerImage || '',
        }),
        isEqual,
    );

    const { data, mutate } = getServerStartup(uuid || '', {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
        rawStartupCommand: variables.invocation,
    });

    useDeepCompareEffect(() => {
        if (!data) return;
        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    // Initialize backup setting based on limits
    useEffect(() => {
        if (backups) {
            // null = unlimited, 0 = disabled, positive number = cap
            setShouldBackup(backupLimit !== 0 && (backupLimit === null || backups.backupCount < backupLimit));
        }
    }, [backups, backupLimit]);

    // Countdown effect for wipe confirmation modal
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showWipeConfirmation && wipeCountdown > 0) {
            interval = setInterval(() => {
                setWipeCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showWipeConfirmation, wipeCountdown]);

    // Reset countdown when wipe confirmation modal opens
    useEffect(() => {
        if (showWipeConfirmation) {
            setWipeCountdown(5);
        }
    }, [showWipeConfirmation]);

    const handleKeyDown = (event) => {
        if (event.shiftKey) setShiftPressed(true);
    };

    const handleKeyUp = (event) => {
        if (!event.shiftKey) setShiftPressed(false);
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    });

    // Flow control functions
    const resetFlow = () => {
        setCurrentStep('overview');
        setSelectedNest(null);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setShouldBackup(backupLimit !== 0 && (backupLimit === null || (backups?.backupCount || 0) < backupLimit));
        setShouldWipe(false);
        setCustomStartup('');
        setSelectedDockerImage('');
    };

    const handleNestSelection = (nest: Nest) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setCustomStartup('');
        setSelectedDockerImage('');
        setCurrentStep('select-software');
    };

    const handleEggSelection = async (egg: Egg) => {
        if (!(selectedNest && uuid)) return;

        setIsLoading(true);
        setSelectedEgg(egg);

        try {
            const preview = await previewEggChange(uuid, egg.attributes.id, selectedNest.attributes.id);
            setEggPreview(preview);

            // Check for subdomain compatibility warnings
            if (preview.warnings && preview.warnings.length > 0) {
                const subdomainWarning = preview.warnings.find((w) => w.type === 'subdomain_incompatible');
                if (subdomainWarning) {
                    toast.error(subdomainWarning.message, {
                        duration: 8000,
                        dismissible: true,
                    });
                }
            }

            // Initialize variables with current values or defaults
            const initialVariables: Record<string, string> = {};
            preview.variables.forEach((variable) => {
                const existingVar = data?.variables.find((v) => v.envVariable === variable.env_variable);
                initialVariables[variable.env_variable] = existingVar?.serverValue || variable.default_value || '';
            });
            setPendingVariables(initialVariables);

            // Set default startup command and docker image
            setCustomStartup(preview.egg.startup);

            // Automatically select the default docker image if available
            // Backend returns: {"Display Name": "actual/image:tag"}
            const availableDisplayNames = Object.keys(preview.docker_images || {});
            if (preview.default_docker_image && availableDisplayNames.includes(preview.default_docker_image)) {
                setSelectedDockerImage(preview.default_docker_image);
            } else if (availableDisplayNames.length > 0 && availableDisplayNames[0]) {
                setSelectedDockerImage(availableDisplayNames[0]);
            }

            setCurrentStep('configure');
        } catch (error) {
            console.error(error);
            toast.error(httpErrorToHuman(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVariableChange = (envVariable: string, value: string) => {
        setPendingVariables((prev) => ({ ...prev, [envVariable]: value }));

        // Validate this specific variable in real-time and update errors
        if (eggPreview) {
            const variable = eggPreview.variables.find((v) => v.env_variable === envVariable);
            if (variable) {
                const errors = validateEnvironmentVariables([variable], {
                    [envVariable]: value,
                });
                setVariableErrors((prev) => {
                    const newErrors = { ...prev };
                    if (errors.length > 0 && errors[0]) {
                        newErrors[envVariable] = errors[0];
                    } else {
                        delete newErrors[envVariable];
                    }
                    return newErrors;
                });
            }
        }
    };

    const proceedToReview = () => {
        setCurrentStep('review');
    };

    const applyChanges = async () => {
        if (!(selectedEgg && selectedNest && eggPreview)) return;

        // Show final confirmation if wipe files is selected without backup
        if (shouldWipe && !shouldBackup) {
            setShowWipeConfirmation(true);
            return;
        }

        // Proceed with the operation
        executeApplyChanges();
    };

    const executeApplyChanges = async () => {
        if (!(selectedEgg && selectedNest && eggPreview && uuid)) return;

        setIsLoading(true);

        try {
            // Validate all variables using Laravel-style validation rules
            const validationErrors = validateEnvironmentVariables(eggPreview.variables, pendingVariables);

            if (validationErrors.length > 0) {
                throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
            }

            // Convert display name back to actual image for backend
            const actualDockerImage =
                selectedDockerImage && eggPreview.docker_images
                    ? eggPreview.docker_images[selectedDockerImage]
                    : eggPreview.default_docker_image && eggPreview.docker_images
                      ? eggPreview.docker_images[eggPreview.default_docker_image]
                      : '';

            // Filter out empty environment variables to prevent validation issues
            const filteredEnvironment: Record<string, string> = {};
            Object.entries(pendingVariables).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    filteredEnvironment[key] = value;
                }
            });

            if (daemonType?.toLowerCase() === 'elytra') {
                const response = await applyEggChange(uuid, {
                    egg_id: selectedEgg.attributes.id,
                    nest_id: selectedNest.attributes.id,
                    docker_image: actualDockerImage,
                    startup_command: customStartup,
                    environment: filteredEnvironment,
                    should_backup: shouldBackup,
                    should_wipe: shouldWipe,
                });

                setCurrentOperationId(response.operation_id);

                setShowOperationModal(true);
            } else if (daemonType?.toLowerCase() === 'wings') {
                await applyEggChangeSync(uuid, {
                    egg_id: selectedEgg.attributes.id,
                    nest_id: selectedNest.attributes.id,
                    docker_image: actualDockerImage,
                    startup_command: customStartup,
                    environment: filteredEnvironment,
                    should_backup: shouldBackup,
                    should_wipe: shouldWipe,
                });
            }

            toast.success('Software change operation started successfully');

            resetFlow();
        } catch (error) {
            console.error('Failed to start egg change operation:', error);
            toast.error(httpErrorToHuman(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleWipeConfirm = () => {
        setShowWipeConfirmation(false);
        setWipeLoading(true);
        executeApplyChanges().finally(() => setWipeLoading(false));
    };

    const handleOperationComplete = (operation: ServerOperation) => {
        if (operation.is_completed) {
            toast.success('Your software configuration has been applied successfully');

            // Refresh server data to reflect changes
            mutate();
        } else if (operation.has_failed) {
            toast.error(operation.message || 'The software configuration change failed');
        }
    };

    const handleOperationError = (error: Error) => {
        toast.error(error.message || 'An error occurred while monitoring the operation');
    };

    const closeOperationModal = () => {
        setShowOperationModal(false);
        setCurrentOperationId(null);
    };

    const toggleDescription = (id: string) => {
        setShowFullDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderDescription = (description: string, id: string) => {
        const isLong = description.length > MAX_DESCRIPTION_LENGTH;
        const showFull = showFullDescriptions[id];

        return (
            <p className='text-neutral-400 text-sm leading-relaxed'>
                {isLong && !showFull ? (
                    <>
                        {description.slice(0, MAX_DESCRIPTION_LENGTH)}...{' '}
                        <button
                            className='font-medium text-brand hover:underline'
                            onClick={() => toggleDescription(id)}
                        >
                            Show more
                        </button>
                    </>
                ) : (
                    <>
                        {description}
                        {isLong && (
                            <>
                                {' '}
                                <button
                                    className='font-medium text-brand hover:underline'
                                    onClick={() => toggleDescription(id)}
                                >
                                    Show less
                                </button>
                            </>
                        )}
                    </>
                )}
            </p>
        );
    };

    const renderOverview = () => (
        <TitledGreyBox title='Current Software'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex min-w-0 flex-1 items-center gap-3 sm:gap-4'>
                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#ffffff11] sm:h-12 sm:w-12'>
                        <Box
                            className='h-5 w-5 text-neutral-300 sm:h-6 sm:w-6'
                            fill='currentColor'
                            height={22}
                            width={22}
                        />
                    </div>
                    <div className='min-w-0 flex-1'>
                        {currentEggName ? (
                            currentEggName.includes(blank_egg_prefix) ? (
                                <p className='font-medium text-amber-400 text-sm sm:text-base'>No software selected</p>
                            ) : (
                                <p className='truncate font-medium text-neutral-200 text-sm sm:text-base'>
                                    {currentEggName}
                                </p>
                            )
                        ) : (
                            <div className='flex items-center gap-2'>
                                <Spinner size='small' />
                                <span className='text-neutral-400 text-sm'>Loading...</span>
                            </div>
                        )}
                        <p className='text-neutral-400 text-xs leading-relaxed sm:text-sm'>
                            Manage your server&apos;s game or software configuration
                        </p>
                    </div>
                </div>
                <div className='w-full flex-shrink-0 sm:w-auto'>
                    <ActionButton
                        className='w-full sm:w-auto'
                        disabled={isLoading}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                setCurrentStep('select-game');
                            } catch (error) {
                                console.error('Error in change software click:', error);
                            }
                        }}
                        variant='primary'
                    >
                        {isLoading && <Spinner size='small' />}
                        Change Software
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderGameSelection = () => (
        <TitledGreyBox title='Select Category'>
            <div className='space-y-4'>
                <p className='text-neutral-400 text-sm'>Choose the type of game or software you want to run</p>

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3'>
                    {nests?.map((nest) =>
                        nest?.attributes?.name?.includes(hidden_nest_prefix) ? null : (
                            <button
                                className='touch-manipulation rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4 text-left transition-all hover:border-[#ffffff20] active:bg-[#ffffff12] sm:p-5'
                                key={nest?.attributes?.uuid}
                                onClick={() => handleNestSelection(nest)}
                            >
                                <h3 className='mb-2 font-semibold text-base text-neutral-200 sm:text-lg'>
                                    {nest?.attributes?.name}
                                </h3>
                                {renderDescription(
                                    nest?.attributes?.description || '',
                                    `nest-${nest?.attributes?.uuid}`,
                                )}
                            </button>
                        ),
                    )}
                </div>

                <div className='flex justify-center pt-4'>
                    <ActionButton
                        className='w-full sm:w-auto'
                        onClick={() => setCurrentStep('overview')}
                        variant='secondary'
                    >
                        Back to Overview
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderSoftwareSelection = () => (
        <TitledGreyBox title={`Select Software - ${selectedNest?.attributes.name}`}>
            <div className='space-y-4'>
                <p className='text-neutral-400 text-sm'>Choose the specific software version for your server</p>

                {isLoading ? (
                    <div className='flex items-center justify-center py-16'>
                        <div className='flex flex-col items-center text-center'>
                            <Spinner size='large' />
                            <p className='mt-4 text-neutral-400'>Loading software options...</p>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
                        {selectedNest?.attributes?.relationships?.eggs?.data?.map((egg) => (
                            <button
                                className='touch-manipulation rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4 text-left transition-all hover:border-[#ffffff20] disabled:cursor-not-allowed disabled:opacity-50'
                                disabled={isLoading}
                                key={egg.attributes.uuid}
                                onClick={() => handleEggSelection(egg)}
                            >
                                <div className='mb-2 flex items-center gap-2'>
                                    {isLoading && selectedEgg?.attributes?.uuid === egg?.attributes?.uuid && (
                                        <Spinner size='small' />
                                    )}
                                    <h3 className='font-semibold text-neutral-200 text-sm sm:text-base'>
                                        {egg?.attributes?.name}
                                    </h3>
                                </div>
                                {renderDescription(egg?.attributes?.description || '', `egg-${egg?.attributes?.uuid}`)}
                            </button>
                        ))}
                    </div>
                )}

                <div className='flex flex-col justify-center gap-3 pt-4 sm:flex-row'>
                    <ActionButton
                        className='w-full sm:w-auto'
                        onClick={() => setCurrentStep('select-game')}
                        variant='secondary'
                    >
                        Back to Games
                    </ActionButton>
                    <ActionButton
                        className='w-full sm:w-auto'
                        onClick={() => setCurrentStep('overview')}
                        variant='secondary'
                    >
                        Cancel
                    </ActionButton>
                </div>
            </div>
        </TitledGreyBox>
    );

    const renderConfiguration = () => (
        <div className='space-y-6'>
            <TitledGreyBox title={`Configure ${selectedEgg?.attributes.name}`}>
                {eggPreview && (
                    <div className='space-y-6'>
                        {/* Software Configuration */}
                        <div className='space-y-4'>
                            <h3 className='font-semibold text-lg text-neutral-200'>Software Configuration</h3>
                            <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
                                <div>
                                    <label className='mb-2 block font-medium text-neutral-300 text-sm'>
                                        Startup Command
                                    </label>
                                    <textarea
                                        className='w-full resize-none rounded-lg border border-[#ffffff12] bg-[#ffffff08] px-3 py-2 font-mono text-neutral-200 text-sm transition-colors placeholder:text-neutral-500 focus:border-brand focus:outline-none'
                                        onChange={(e) => setCustomStartup(e.target.value)}
                                        placeholder='Enter custom startup command...'
                                        rows={3}
                                        value={customStartup}
                                    />
                                    <p className='mt-1 text-neutral-400 text-xs'>
                                        Use variables like{' '}
                                        {eggPreview.variables
                                            .map((v) => `{{${v.env_variable}}}`)
                                            .slice(0, 3)
                                            .join(', ')}
                                        {eggPreview.variables.length > 3 && ', etc.'}
                                    </p>
                                </div>
                                <div>
                                    <label className='mb-2 block font-medium text-neutral-300 text-sm'>
                                        Docker Image
                                    </label>
                                    {eggPreview.docker_images && Object.keys(eggPreview.docker_images).length > 1 ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className='flex w-full items-center justify-between rounded-lg border border-[#ffffff12] bg-[#ffffff08] px-3 py-2 text-left text-neutral-200 text-sm transition-colors hover:border-[#ffffff20] focus:border-brand focus:outline-none'>
                                                    <span className='truncate'>
                                                        {selectedDockerImage || 'Select image...'}
                                                    </span>
                                                    <svg
                                                        className='h-4 w-4 flex-shrink-0 text-neutral-400'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            d='M19 9l-7 7-7-7'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                        />
                                                    </svg>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className='w-full min-w-[300px]'>
                                                <DropdownMenuRadioGroup
                                                    onValueChange={setSelectedDockerImage}
                                                    value={selectedDockerImage}
                                                >
                                                    {Object.entries(eggPreview.docker_images).map(
                                                        ([displayName, _]) => (
                                                            <DropdownMenuRadioItem
                                                                className='font-mono text-sm'
                                                                key={displayName}
                                                                value={displayName}
                                                            >
                                                                <span>{displayName}</span>
                                                            </DropdownMenuRadioItem>
                                                        ),
                                                    )}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <div className='w-full rounded-lg border border-[#ffffff12] bg-[#ffffff08] px-3 py-2 text-neutral-200 text-sm'>
                                            {(eggPreview.docker_images && Object.keys(eggPreview.docker_images)[0]) ||
                                                'Default Image'}
                                        </div>
                                    )}
                                    <p className='mt-1 text-neutral-400 text-xs'>
                                        Container runtime environment for your server
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Environment Variables */}
                        {eggPreview.variables.length > 0 && (
                            <div className='space-y-4'>
                                <h3 className='font-semibold text-lg text-neutral-200'>Environment Variables</h3>
                                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                                    {eggPreview.variables.map((variable) => (
                                        <div className='space-y-3' key={variable.env_variable}>
                                            <div>
                                                <label className='mb-1 block font-medium text-neutral-200 text-sm'>
                                                    {variable.name}
                                                    {!variable.user_editable && (
                                                        <span className='ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-amber-400 text-xs'>
                                                            Read-only
                                                        </span>
                                                    )}
                                                    {variable.user_editable && variable.rules.includes('required') && (
                                                        <span className='ml-2 rounded bg-red-500/20 px-2 py-0.5 text-red-400 text-xs'>
                                                            Required
                                                        </span>
                                                    )}
                                                    {variable.user_editable && !variable.rules.includes('required') && (
                                                        <span className='ml-2 rounded bg-neutral-500/20 px-2 py-0.5 text-neutral-400 text-xs'>
                                                            Optional
                                                        </span>
                                                    )}
                                                </label>
                                                {variable.description && (
                                                    <p className='mb-2 text-neutral-400 text-xs'>
                                                        {variable.description}
                                                    </p>
                                                )}
                                            </div>

                                            {variable.user_editable ? (
                                                <div>
                                                    <input
                                                        className={`w-full rounded-lg border bg-[#ffffff08] px-3 py-2 text-neutral-200 text-sm transition-colors placeholder:text-neutral-500 focus:outline-none ${
                                                            variableErrors[variable.env_variable]
                                                                ? 'border-red-500 focus:border-red-500'
                                                                : 'border-[#ffffff12] focus:border-brand'
                                                        }`}
                                                        onChange={(e) =>
                                                            handleVariableChange(variable.env_variable, e.target.value)
                                                        }
                                                        placeholder={variable.default_value || 'Enter value...'}
                                                        type='text'
                                                        value={pendingVariables[variable.env_variable] || ''}
                                                    />
                                                    {variableErrors[variable.env_variable] && (
                                                        <p className='mt-1 text-red-400 text-xs'>
                                                            {variableErrors[variable.env_variable]}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='w-full rounded-lg border border-[#ffffff08] bg-[#ffffff04] px-3 py-2 font-mono text-neutral-300 text-sm'>
                                                    {pendingVariables[variable.env_variable] ||
                                                        variable.default_value ||
                                                        'Not set'}
                                                </div>
                                            )}

                                            <div className='flex justify-between text-xs'>
                                                <span className='font-mono text-neutral-500'>
                                                    {variable.env_variable}
                                                </span>
                                                {variable.rules && (
                                                    <span className='text-neutral-500'>Rules: {variable.rules}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options */}
                        <div className='space-y-4'>
                            <h3 className='font-semibold text-lg text-neutral-200'>Safety Options</h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4 transition-colors hover:border-[#ffffff20]'>
                                    <div className='min-w-0 flex-1 pr-4'>
                                        <label className='mb-1 block font-medium text-neutral-200 text-sm'>
                                            Create Backup
                                        </label>
                                        <p className='text-neutral-400 text-xs leading-relaxed'>
                                            {backupLimit !== 0 &&
                                            (backupLimit === null || (backups?.backupCount || 0) < backupLimit)
                                                ? 'Automatically create a backup before applying changes'
                                                : backupLimit === 0
                                                  ? 'Backups are disabled for this server'
                                                  : 'Backup limit reached'}
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch
                                            checked={shouldBackup}
                                            disabled={
                                                backupLimit === 0 ||
                                                (backupLimit !== null && (backups?.backupCount || 0) >= backupLimit)
                                            }
                                            onCheckedChange={setShouldBackup}
                                        />
                                    </div>
                                </div>

                                <div className='flex items-center justify-between rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4 transition-colors hover:border-[#ffffff20]'>
                                    <div className='min-w-0 flex-1 pr-4'>
                                        <label className='mb-1 block font-medium text-neutral-200 text-sm'>
                                            Wipe Files
                                        </label>
                                        <p className='text-neutral-400 text-xs leading-relaxed'>
                                            Delete all files before installing new software
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch checked={shouldWipe} onCheckedChange={setShouldWipe} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='flex flex-col justify-center gap-3 pt-4 sm:flex-row'>
                    <ActionButton
                        className='w-full sm:w-auto'
                        onClick={() => setCurrentStep('select-software')}
                        variant='secondary'
                    >
                        Back to Software
                    </ActionButton>
                    <ActionButton
                        className='w-full sm:w-auto'
                        disabled={!eggPreview || isLoading}
                        onClick={proceedToReview}
                        variant='primary'
                    >
                        {isLoading && <Spinner size='small' />}
                        Review Changes
                    </ActionButton>
                </div>
            </TitledGreyBox>
        </div>
    );

    const renderReview = () => (
        <div className='space-y-6'>
            <TitledGreyBox title='Review Changes'>
                {selectedEgg && eggPreview && (
                    <div className='space-y-6'>
                        {/* Summary */}
                        <div className='rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4'>
                            <h3 className='mb-4 font-semibold text-lg text-neutral-200'>Change Summary</h3>
                            <div className='grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
                                <div>
                                    <span className='text-neutral-400'>From:</span>
                                    <div className='font-medium text-neutral-200'>
                                        {currentEggName || 'No software'}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>To:</span>
                                    <div className='font-medium text-brand'>{selectedEgg.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>Category:</span>
                                    <div className='font-medium text-neutral-200'>{selectedNest?.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>Docker Image:</span>
                                    <div className='font-medium text-neutral-200'>
                                        {selectedDockerImage || 'Default'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Startup Command Review */}
                        <div className='rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4'>
                            <h3 className='mb-4 font-semibold text-lg text-neutral-200'>Startup Configuration</h3>
                            <div className='space-y-3'>
                                <div>
                                    <span className='text-neutral-400 text-sm'>Startup Command:</span>
                                    <div className='mt-1 whitespace-pre-wrap rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-3 font-mono text-neutral-200 text-sm'>
                                        {customStartup || eggPreview.egg.startup}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400 text-sm'>Docker Image:</span>
                                    <div className='mt-1 rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-3 text-neutral-200 text-sm'>
                                        {selectedDockerImage || 'Default Image'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Review */}
                        {eggPreview.variables.length > 0 && (
                            <div className='rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4'>
                                <h3 className='mb-4 font-semibold text-lg text-neutral-200'>Variable Configuration</h3>
                                <div className='space-y-2'>
                                    {eggPreview.variables.map((variable) => (
                                        <div
                                            className='flex items-center justify-between rounded-lg bg-[#ffffff08] px-3 py-2'
                                            key={variable.env_variable}
                                        >
                                            <div>
                                                <span className='font-medium text-neutral-200'>{variable.name}</span>
                                                <span className='ml-2 font-mono text-neutral-500 text-sm'>
                                                    ({variable.env_variable})
                                                </span>
                                            </div>
                                            <div className='font-mono text-brand text-sm'>
                                                {pendingVariables[variable.env_variable] ||
                                                    variable.default_value ||
                                                    'Not set'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Safety Options Review */}
                        <div className='rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4'>
                            <h3 className='mb-4 font-semibold text-lg text-neutral-200'>Safety Options</h3>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between rounded-lg bg-[#ffffff08] px-3 py-2'>
                                    <span className='text-neutral-200'>Create Backup</span>
                                    <span className={shouldBackup ? 'text-green-400' : 'text-neutral-400'}>
                                        {shouldBackup ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between rounded-lg bg-[#ffffff08] px-3 py-2'>
                                    <span className='text-neutral-200'>Wipe Files</span>
                                    <span className={shouldWipe ? 'text-amber-400' : 'text-neutral-400'}>
                                        {shouldWipe ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Subdomain Warnings */}
                        {eggPreview.warnings && eggPreview.warnings.length > 0 && (
                            <div className='space-y-3'>
                                {eggPreview.warnings.map((warning, index) => (
                                    <div
                                        className={`rounded-lg border p-4 ${
                                            warning.severity === 'error'
                                                ? 'border-red-500/20 bg-red-500/10'
                                                : 'border-amber-500/20 bg-amber-500/10'
                                        }`}
                                        key={index}
                                    >
                                        <div className='flex items-start gap-3'>
                                            <TriangleExclamation
                                                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                                                    warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                }`}
                                                fill='currentColor'
                                                height={22}
                                                width={22}
                                            />
                                            <div>
                                                <h4
                                                    className={`mb-2 font-semibold ${
                                                        warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                    }`}
                                                >
                                                    {warning.type === 'subdomain_incompatible'
                                                        ? 'Subdomain Will Be Deleted'
                                                        : 'Warning'}
                                                </h4>
                                                <p className='text-neutral-300 text-sm'>{warning.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* General Warning */}
                        <div className='rounded-lg border border-amber-500/20 bg-amber-500/10 p-4'>
                            <div className='flex items-start gap-3'>
                                <TriangleExclamation
                                    className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400'
                                    fill='currentColor'
                                    height={22}
                                    width={22}
                                />
                                <div>
                                    <h4 className='mb-2 font-semibold text-amber-400'>This will:</h4>
                                    <ul className='text-neutral-300 text-sm'>
                                        <li>• Stop and reinstall your server</li>
                                        <li>• Take several minutes to complete</li>
                                        <li>• Modify and remove some files</li>
                                    </ul>
                                    <span className='mt-4 font-bold text-sm'>
                                        Please ensure you have backups of important data before proceeding.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='flex flex-col justify-center gap-3 pt-4 sm:flex-row'>
                    <ActionButton
                        className='w-full sm:w-auto'
                        onClick={() => setCurrentStep('configure')}
                        variant='secondary'
                    >
                        Back to Configure
                    </ActionButton>
                    <ActionButton
                        className='w-full sm:w-auto'
                        disabled={isLoading}
                        onClick={applyChanges}
                        variant='primary'
                    >
                        {isLoading && <Spinner size='small' />}
                        Apply Changes
                    </ActionButton>
                </div>
            </TitledGreyBox>
        </div>
    );

    // Show loading state if server data is not available
    if (!serverData) {
        return (
            <ServerContentBlock title='Software Management'>
                <div className='flex h-64 items-center justify-center'>
                    <div className='flex flex-col items-center text-center'>
                        <Spinner size='large' />
                        <p className='mt-4 text-neutral-400'>Loading server information...</p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }
    function RenderOperationModal() {
        if (daemonType === 'elytra') {
            return (
                <OperationProgressModal
                    onClose={closeOperationModal}
                    onComplete={handleOperationComplete}
                    onError={handleOperationError}
                    operationId={currentOperationId}
                    operationType='Software Change'
                    visible={showOperationModal}
                />
            );
        }
        if (daemonType === 'wings') {
            return (
                <WingsOperationProgressModal
                    onClose={closeOperationModal}
                    onComplete={handleOperationComplete}
                    onError={handleOperationError}
                    operationId={currentOperationId}
                    operationType='Software Change'
                    visible={showOperationModal}
                />
            );
        }
        return <div>Could not find Operation Modal for this daemon: Using ${daemonType}</div>;
    }
    return (
        <ServerContentBlock title='Software Management'>
            <div className='space-y-6'>
                <MainPageHeader direction='column' title='Software Management'>
                    <p className='text-neutral-400 leading-relaxed'>
                        Change your server&apos;s game or software with our guided configuration wizard
                    </p>
                </MainPageHeader>

                {/* Progress indicator */}
                {currentStep !== 'overview' && (
                    <div className='rounded-lg border border-[#ffffff12] bg-[#ffffff08] p-4'>
                        <div className='mb-2 flex items-center justify-between'>
                            <span className='font-medium text-neutral-200 text-sm capitalize'>
                                {currentStep.replace('-', ' ')}
                            </span>
                            <span className='text-neutral-400 text-sm'>
                                Step{' '}
                                {['overview', 'select-game', 'select-software', 'configure', 'review'].indexOf(
                                    currentStep,
                                )}{' '}
                                of 4
                            </span>
                        </div>
                        <div className='h-2 w-full rounded-full bg-[#ffffff12]'>
                            <div
                                className='h-2 rounded-full bg-brand transition-all duration-300'
                                style={{
                                    width: `${(['overview', 'select-game', 'select-software', 'configure', 'review'].indexOf(currentStep) / 4) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Step Content */}
                {currentStep === 'overview' && renderOverview()}
                {currentStep === 'select-game' && renderGameSelection()}
                {currentStep === 'select-software' && renderSoftwareSelection()}
                {currentStep === 'configure' && renderConfiguration()}
                {currentStep === 'review' && renderReview()}
            </div>

            {/* Wipe Files Confirmation Modal */}
            <ConfirmationModal
                buttonText={wipeCountdown > 0 ? `Yes, Wipe Files (${wipeCountdown}s)` : 'Yes, Wipe Files'}
                disabled={wipeCountdown > 0 && !shiftPressed}
                loading={wipeLoading}
                onConfirmed={handleWipeConfirm}
                onModalDismissed={() => setShowWipeConfirmation(false)}
                title='Wipe All Files Without Backup?'
                visible={showWipeConfirmation}
            >
                <div className='space-y-4'>
                    <div className='flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
                        <TriangleExclamation
                            className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-400'
                            fill='currentColor'
                            height={22}
                            width={22}
                        />
                        <div>
                            <h4 className='mb-2 font-semibold text-red-400'>DANGER: No Backup Selected</h4>
                            <p className='text-neutral-300 text-sm'>
                                You have chosen to wipe all files <strong>without creating a backup</strong>. This
                                action will <strong>permanently delete ALL files</strong> on your server and cannot be
                                undone.
                            </p>
                        </div>
                    </div>
                    <div className='space-y-2 text-neutral-300 text-sm'>
                        <p>
                            <strong>What will happen:</strong>
                        </p>
                        <ul className='ml-4 list-inside list-disc space-y-1'>
                            <li>All server files will be permanently deleted</li>
                            <li>Your server will be stopped and reinstalled</li>
                            <li>Any custom configurations or data will be lost</li>
                            <li>This action cannot be reversed</li>
                        </ul>
                    </div>
                    <p className='text-neutral-300 text-sm'>
                        Are you absolutely sure you want to proceed without a backup?
                    </p>
                </div>
            </ConfirmationModal>

            {/* Operation Progress Modal */}
            {RenderOperationModal()}
        </ServerContentBlock>
    );
};

export default SoftwareContainer;
