import { Field, type FieldProps } from 'formik';

import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import SwitchV2Container, { type SwitchProps } from '@/components/elements/SwitchV2Container';

const FormikSwitch = ({ name, label, ...props }: SwitchProps) => (
    <FormikFieldWrapper name={name}>
        <Field name={name}>
            {({ field, form }: FieldProps) => (
                <SwitchV2Container
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
