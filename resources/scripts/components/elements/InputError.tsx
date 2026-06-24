import type { FormikErrors, FormikTouched } from 'formik';

import { capitalize } from '@/lib/strings';

interface Props {
    children?: string | number | null | undefined;
    errors: FormikErrors<any>;
    name: string;
    touched: FormikTouched<any>;
}

const InputError = ({ errors, touched, name, children }: Props) =>
    touched[name] && errors[name] ? (
        <p className={'pt-2 text-red-400 text-xs'}>
            {typeof errors[name] === 'string'
                ? capitalize(errors[name] as string)
                : capitalize((errors[name] as unknown as string[])[0] ?? '')}
        </p>
    ) : (
        <>{children ? <p className={'pt-2 text-xs text-zinc-400'}>{children}</p> : null}</>
    );

export default InputError;
