import ItemContainer from '@/components/elements/ItemContainer';
import { Switch } from '@/components/elements/SwitchV2';

export interface SwitchProps {
    defaultChecked?: boolean;
    description: string;
    label: string;
    name: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
}

const SwitchV2Container = ({ name, label, description, defaultChecked, readOnly, onChange }: SwitchProps) => (
    <ItemContainer description={description} title={label}>
        <Switch
            defaultChecked={defaultChecked}
            disabled={readOnly}
            name={name}
            onCheckedChange={(checked) => {
                if (onChange) {
                    onChange({
                        target: { checked } as HTMLInputElement,
                    } as React.ChangeEvent<HTMLInputElement>);
                }
            }}
        />
    </ItemContainer>
);
SwitchV2Container.displayName = 'SwitchV2Container';

export default SwitchV2Container;
