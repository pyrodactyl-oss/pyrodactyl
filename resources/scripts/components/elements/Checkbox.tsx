import { Field, type FieldProps } from 'formik';

import Input from '@/components/elements/Input';

interface Props {
    className?: string;
    name: string;
    value: string;
}

type OmitFields = 'ref' | 'name' | 'value' | 'type' | 'checked' | 'onClick' | 'onChange';

type InputProps = Omit<JSX.IntrinsicElements['input'], OmitFields>;

const Checkbox = ({ name, value, className, ...props }: Props & InputProps) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => {
            if (!Array.isArray(field.value)) {
                console.error('Attempting to mount a checkbox using a field value that is not an array.');

                return null;
            }

            return (
                <Input
                    {...field}
                    {...props}
                    checked={(field.value || []).includes(value)}
                    className={className}
                    onChange={(e) => {
                        const set = new Set(field.value);
                        if (set.has(value)) {
                            set.delete(value);
                        } else {
                            set.add(value);
                        }

                        field.onChange(e);
                        form.setFieldValue(field.name, Array.from(set));
                    }}
                    onClick={() => form.setFieldTouched(field.name, true)}
                    type={'checkbox'}
                />
            );
        }}
    </Field>
);

export default Checkbox;
