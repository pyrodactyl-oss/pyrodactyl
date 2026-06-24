'use client';

import type * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import {
    Controller,
    type ControllerProps,
    type FieldPath,
    type FieldValues,
    FormProvider,
    useFormContext,
} from 'react-hook-form';

import { cn } from '../../lib/utils';
import { Label } from './label';

const Form = FormProvider;

interface FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
    name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    ...props
}: ControllerProps<TFieldValues, TName>) => (
    <FormFieldContext.Provider value={{ name: props.name }}>
        <Controller {...props} />
    </FormFieldContext.Provider>
);

const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    const { getFieldState, formState } = useFormContext();

    const fieldState = getFieldState(fieldContext.name, formState);

    if (!fieldContext) {
        throw new Error('useFormField should be used within <FormField>');
    }

    const { id } = itemContext;

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    };
};

interface FormItemContextValue {
    id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = ({
    className,
    ref,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => {
    const id = React.useId();

    return (
        <FormItemContext.Provider value={{ id }}>
            <div className={cn('flex flex-col gap-2', className)} ref={ref} {...props} />
        </FormItemContext.Provider>
    );
};
FormItem.displayName = 'FormItem';

const FormLabel = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    ref?: React.RefObject<React.ComponentRef<typeof LabelPrimitive.Root> | null>;
}) => {
    const { error, formItemId } = useFormField();

    return <Label className={cn(error && 'text-destructive', className)} htmlFor={formItemId} ref={ref} {...props} />;
};
FormLabel.displayName = 'FormLabel';

const FormControl = ({
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof Slot> & { ref?: React.RefObject<React.ComponentRef<typeof Slot> | null> }) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
        <Slot
            aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`}
            aria-invalid={!!error}
            id={formItemId}
            ref={ref}
            {...props}
        />
    );
};
FormControl.displayName = 'FormControl';

const FormDescription = ({
    className,
    ref,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) => {
    const { formDescriptionId } = useFormField();

    return (
        <p
            className={cn('text-[0.8rem] text-muted-foreground', className)}
            id={formDescriptionId}
            ref={ref}
            {...props}
        />
    );
};
FormDescription.displayName = 'FormDescription';

const FormMessage = ({
    className,
    children,
    ref,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;

    if (!body) {
        return null;
    }

    return (
        <p className={cn('font-medium text-[0.8rem] text-red-400', className)} id={formMessageId} ref={ref} {...props}>
            {body}
        </p>
    );
};
FormMessage.displayName = 'FormMessage';

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };
