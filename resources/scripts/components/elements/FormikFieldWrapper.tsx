import { Field, type FieldProps } from 'formik';

import InputError from '@/components/elements/InputError';
import Label from '@/components/elements/Label';

interface Props {
    children: React.ReactNode;
    className?: string;
    description?: string;
    id?: string;
    label?: string;
    name: string;
    validate?: (value: any) => undefined | string | Promise<any>;
}

const FormikFieldWrapper = ({ id, name, label, className, description, validate, children }: Props) => (
    <Field name={name} validate={validate}>
        {({ field, form: { errors, touched } }: FieldProps) => (
            <div className={`${className} ${touched[field.name] && errors[field.name] ? 'has-error' : undefined}`}>
                {label && (
                    <Label className='text-[#ffffff77] text-sm' htmlFor={id}>
                        {label}
                    </Label>
                )}
                {children}
                <InputError errors={errors} name={field.name} touched={touched}>
                    {description || null}
                </InputError>
            </div>
        )}
    </Field>
);

export default FormikFieldWrapper;
