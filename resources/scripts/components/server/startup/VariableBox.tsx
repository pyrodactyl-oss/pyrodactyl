import { ChevronDown, ChevronUp, Lock } from '@gravity-ui/icons';
import debounce from 'debounce';
import { memo, useState } from 'react';
import isEqual from 'react-fast-compare';
import type { ServerEggVariable } from '@/api/server/types';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import getServerStartup from '@/api/swr/getServerStartup';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import InputSpinner from '@/components/elements/InputSpinner';
import { Switch } from '@/components/elements/SwitchV2';
import { Input } from '@/components/elements/TextInput';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import { usePermissions } from '@/plugins/usePermissions';
import { ServerContext } from '@/state/server';

interface Props {
    variable: ServerEggVariable;
}

const VariableBox = ({ variable }: Props) => {
    const FLASH_KEY = `server:startup:${variable.envVariable}`;

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(false);
    const [canEdit] = usePermissions(['startup.update']);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerStartup(uuid);
    const [dropDownOpen, setDropDownOpen] = useState(false);

    const setVariableValue = debounce((value: string) => {
        setLoading(true);
        clearFlashes(FLASH_KEY);

        updateStartupVariable(uuid, variable.envVariable, value)
            .then(([response, invocation]) =>
                mutate(
                    (data) => ({
                        ...data!,
                        invocation,
                        variables: (data!.variables || []).map((v) =>
                            v.envVariable === response.envVariable ? response : v,
                        ),
                    }),
                    false,
                ),
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: FLASH_KEY, error });
            })
            .then(() => setLoading(false));
    }, 500);

    const useSwitch = variable.rules.some(
        (v) => v === 'boolean' || v === 'in:0,1' || v === 'in:1,0' || v === 'in:true,false' || v === 'in:false,true',
    );
    const isStringSwitch = variable.rules.some((v) => v === 'string');
    const selectValues = variable.rules.find((v) => v.startsWith('in:'))?.split(',') || [];

    return (
        <div className='flex flex-col justify-between gap-4 rounded-xl border-[#ffffff15] border-[1px] bg-linear-to-b from-[#ffffff08] to-[#ffffff05] p-4 transition-all hover:border-[#ffffff20] sm:p-5'>
            <FlashMessageRender byKey={FLASH_KEY} />
            <div className='space-y-3'>
                <div className='flex flex-col items-baseline gap-2 sm:flex-row sm:justify-between sm:gap-3'>
                    <div className='flex min-w-0 items-center gap-2'>
                        {!variable.isEditable && (
                            <Lock
                                className='h-4 w-4 flex-shrink-0 text-neutral-500'
                                fill={'currentColor'}
                                height={22}
                                width={22}
                            />
                        )}
                        <span className='break-words font-medium text-neutral-200 text-sm'>{variable.name}</span>
                    </div>
                    <div className='w-fit rounded font-mono text-neutral-500 text-xs leading-5'>
                        {variable.envVariable}
                    </div>
                </div>
                <p className='break-words text-neutral-400 text-xs leading-relaxed sm:text-sm'>
                    {variable.description}
                </p>
            </div>
            <InputSpinner visible={loading}>
                {useSwitch ? (
                    <div className='flex items-center justify-between rounded-xl border border-[#ffffff10] bg-linear-to-b from-[#ffffff06] to-[#ffffff03] p-3 sm:p-4'>
                        <span className='font-medium text-neutral-300 text-sm'>
                            {isStringSwitch
                                ? variable.serverValue === 'true'
                                    ? 'Enabled'
                                    : 'Disabled'
                                : variable.serverValue === '1'
                                  ? 'On'
                                  : 'Off'}
                        </span>
                        <Switch
                            defaultChecked={
                                isStringSwitch ? variable.serverValue === 'true' : variable.serverValue === '1'
                            }
                            disabled={!(canEdit && variable.isEditable)}
                            name={variable.envVariable}
                            onCheckedChange={() => {
                                if (canEdit && variable.isEditable) {
                                    if (isStringSwitch) {
                                        setVariableValue(variable.serverValue === 'true' ? 'false' : 'true');
                                    } else {
                                        setVariableValue(variable.serverValue === '1' ? '0' : '1');
                                    }
                                }
                            }}
                        />
                    </div>
                ) : (
                    <>
                        {selectValues.length > 0 && (variable.serverValue ?? variable.defaultValue) ? (
                            <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className='flex h-11 w-full cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-[#ffffff15] bg-linear-to-b from-[#ffffff10] to-[#ffffff09] px-3 font-medium text-sm text-white transition-all duration-200 hover:border-[#ffffff25] hover:from-[#ffffff15] hover:to-[#ffffff10] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:px-4'
                                        disabled={!(canEdit && variable.isEditable)}
                                    >
                                        <span className='truncate text-left font-mono text-neutral-200'>
                                            {variable.serverValue}
                                        </span>
                                        {dropDownOpen ? (
                                            <ChevronUp
                                                className='h-[14px] w-[14px] flex-shrink-0 opacity-60'
                                                fill={'currentColor'}
                                                height={22}
                                                width={22}
                                            />
                                        ) : (
                                            <ChevronDown
                                                className='h-[14px] w-[14px] flex-shrink-0 opacity-60'
                                                fill={'currentColor'}
                                                height={22}
                                                width={22}
                                            />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='z-99999' sideOffset={8}>
                                    <DropdownMenuRadioGroup
                                        onValueChange={setVariableValue}
                                        value={variable.serverValue ?? ''}
                                    >
                                        {selectValues.map((selectValue) => (
                                            <DropdownMenuRadioItem
                                                key={selectValue.replace('in:', '')}
                                                value={selectValue.replace('in:', '')}
                                            >
                                                {selectValue.replace('in:', '')}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Input
                                className='h-11 w-full text-sm sm:h-12 sm:text-base'
                                defaultValue={variable.serverValue ?? ''}
                                disabled={!(canEdit && variable.isEditable)}
                                name={variable.envVariable}
                                onKeyUp={(e) => {
                                    if (canEdit && variable.isEditable) {
                                        setVariableValue(e.currentTarget.value);
                                    }
                                }}
                                placeholder={variable.defaultValue || 'Enter value...'}
                                readOnly={!(canEdit && variable.isEditable)}
                            />
                        )}
                    </>
                )}
            </InputSpinner>
        </div>
    );
};

export default memo(VariableBox, isEqual);
