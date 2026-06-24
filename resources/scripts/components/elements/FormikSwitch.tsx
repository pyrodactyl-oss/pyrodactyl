import { Field, type FieldProps } from 'formik';

import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Switch, { type SwitchProps } from '@/components/elements/Switch';

const FormikSwitch = ({ name, label, ...props }: SwitchProps) => (
    <FormikFieldWrapper name={name}>
        <Field name={name}>
            {({ field, form }: FieldProps) => (
                <Switch
                    defaultChecked={field.value}
                    label={label}
                    name={name}
                    onChange={() => {
                        form.setFieldTouched(name);
                        form.setFieldValue(field.name, !field.value);
                    }}
                    {...props}
                />
            )}
        </Field>
    </FormikFieldWrapper>
);

export default FormikSwitch;
