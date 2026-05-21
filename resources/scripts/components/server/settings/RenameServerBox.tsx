import { Copy, Tag } from '@gravity-ui/icons';
import { Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik, useFormikContext } from 'formik';
import { toast } from 'sonner';
import { object, string } from 'yup';

import ActionButton from '@/components/elements/ActionButton';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Field from '@/components/elements/Field';

import { httpErrorToHuman } from '@/api/http';
import renameServer from '@/api/server/renameServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    name: string;
    description: string;
}

/**
 * Inner form. Reading dirty/submitting from Formik lets us disable Save
 * when there are no pending changes. Layout is a 3-column grid on wide
 * viewports — Name | Description | Save — so the Save button reads as
 * the third edit affordance rather than a footer action floating
 * underneath two text inputs.
 */
const RenameInnerForm = ({ initial }: { initial: Values }) => {
    const { values, isSubmitting } = useFormikContext<Values>();
    const dirty = values.name.trim() !== initial.name || (values.description ?? '') !== (initial.description ?? '');

    return (
        <Form className='grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_1fr_auto]'>
            <Field id='name' name='name' label='Server Name' type='text' />
            <Field id='description' name='description' label='Server Description' type='text' />
            {/* Save lives in the third grid column on md+ viewports so
                the row reads as "Name | Description | Save". `mb-1`
                aligns the button vertically with the input bottoms
                (Field renders its own label above the input, so without
                this nudge Save sits a few pixels too low). */}
            <ActionButton
                variant='primary'
                size='md'
                type='submit'
                disabled={!dirty || isSubmitting}
                className='mb-1 w-full md:w-auto'
            >
                Save
            </ActionButton>
        </Form>
    );
};

/**
 * Server identity card — name + description editor.
 *
 * Replaces the old TitledGreyBox-wrapped form whose Save button dangled
 * underneath two wide inputs in an awkward "what are we even saving?"
 * way. Now the inputs + Save live side-by-side on a single row (stacking
 * on narrow viewports) and the Server UUID rides up in the card header,
 * right-aligned beside the title — same place the Resources card shows
 * its Node id, so identity-style diagnostics consistently live in card
 * headers.
 */
const RenameServerBox = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const initial: Values = {
        name: server.name,
        description: server.description ?? '',
    };

    const submit = ({ name, description }: Values) => {
        clearFlashes('settings');
        const trimmedName = name.trim();
        toast.promise(
            renameServer(server.uuid, trimmedName, description).then(() =>
                setServer({ ...server, name: trimmedName, description }),
            ),
            {
                loading: 'Saving server details…',
                success: 'Server details updated.',
                error: (error) => {
                    addError({ key: 'settings', message: httpErrorToHuman(error) });
                    return httpErrorToHuman(error);
                },
            },
        );
    };

    return (
        <section className='rounded-2xl border border-[#ffffff10] bg-[#ffffff05] transition hover:duration-0 hover:border-[#ffffff20] hover:bg-[#ffffff08]'>
            <header className='flex flex-wrap items-center gap-2 border-b border-[#ffffff10] px-5 py-3.5'>
                <Tag width={16} height={16} className='text-zinc-400' />
                <h2 className='text-sm font-semibold text-zinc-100'>Server Identity</h2>
                {/* Server UUID in the header, right-aligned. Same shape
                    as the Node chip on the Resources card so the two
                    cards' diagnostic chips visually rhyme. */}
                <CopyOnClick text={server.uuid}>
                    <span
                        title={server.uuid}
                        className='group ml-auto inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md bg-[#ffffff08] px-2 py-1 font-mono text-[11px] text-zinc-200 transition hover:bg-[#ffffff14]'
                    >
                        <span className='text-[10px] font-bold uppercase tracking-wide text-zinc-500'>
                            Server UUID
                        </span>
                        <span className='break-all'>{server.uuid}</span>
                        <Copy
                            width={11}
                            height={11}
                            className='shrink-0 text-zinc-500 group-hover:text-zinc-200'
                        />
                    </span>
                </CopyOnClick>
            </header>
            <div className='p-5'>
                <Formik
                    onSubmit={submit}
                    initialValues={initial}
                    enableReinitialize
                    validationSchema={object().shape({
                        name: string().required().min(1),
                        description: string().nullable(),
                    })}
                >
                    <RenameInnerForm initial={initial} />
                </Formik>
            </div>
        </section>
    );
};

export default RenameServerBox;
