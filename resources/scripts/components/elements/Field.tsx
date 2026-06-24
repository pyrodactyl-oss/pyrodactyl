import { type FieldProps, Field as FormikField } from 'formik';
import { forwardRef } from 'react';

interface OwnProps {
    description?: string;
    label?: string;
    name: string;
    validate?: (value: any) => undefined | string | Promise<any>;
}

type Props = OwnProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>;

const Field = forwardRef<HTMLInputElement, Props>(
    ({ id, name = false, label, description, validate, ...props }, ref) => (
        <FormikField innerRef={ref} name={name} validate={validate}>
            {({ field, form: { errors, touched } }: FieldProps) => (
                <div className='flex flex-col gap-2'>
                    {label && (
                        <label className='text-[#ffffff77] text-sm' htmlFor={id}>
                            {label}
                        </label>
                    )}
                    <input
                        className='rounded-lg bg-[#ffffff17] px-4 py-2 text-sm outline-hidden'
                        id={id}
                        {...field}
                        {...props}
                    />
                    {touched[field.name] && errors[field.name] ? (
                        <p className={'font-bold text-[#d36666] text-sm'}>
                            {(errors[field.name] as string).charAt(0).toUpperCase() +
                                (errors[field.name] as string).slice(1)}
                        </p>
                    ) : description ? (
                        <p className={'font-bold text-sm'}>{description}</p>
                    ) : null}
                </div>
            )}
        </FormikField>
    ),
);
Field.displayName = 'Field';

export default Field;
