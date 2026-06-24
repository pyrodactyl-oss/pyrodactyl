import Checkbox from '@/components/elements/inputs/Checkbox';
import InputField from '@/components/elements/inputs/InputField';

const Input: { Text: typeof InputField; Checkbox: typeof Checkbox } = {
    Text: InputField,
    Checkbox,
};

export { default as styles } from './styles.module.css';
export { Input };
