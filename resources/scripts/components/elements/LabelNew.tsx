import type * as React from 'react';
import styled from 'styled-components';

interface CheckboxProps {
    checked: boolean;
    label?: string;
    onChange: () => void;
}

const CheckboxWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
`;

const StyledInput = styled.input`
    margin-right: 8px;
`;

const StyledLabel = styled.label`
    display: flex;
    align-items: center;
    cursor: pointer;
`;

const Checkbox = ({
    label,
    checked,
    onChange,
    ref,
}: CheckboxProps & { ref?: React.RefObject<HTMLInputElement | null> }) => (
    <CheckboxWrapper>
        {label && (
            <StyledLabel>
                <StyledInput checked={checked} onChange={onChange} ref={ref} type='checkbox' />
                <span>{label}</span>
            </StyledLabel>
        )}
    </CheckboxWrapper>
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
