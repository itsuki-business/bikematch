/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type UserUpdateFormInputValues = {
    email?: string;
    nickname?: string;
    user_type?: string;
    prefecture?: string;
    bike_maker?: string;
    bike_model?: string;
    shooting_genres?: string[];
    price_range_min?: number;
    price_range_max?: number;
    equipment?: string;
    bio?: string;
    profile_image?: string;
    portfolio_website?: string;
    instagram_url?: string;
    twitter_url?: string;
    youtube_url?: string;
    special_conditions?: string[];
    is_accepting_requests?: boolean;
    average_rating?: number;
    review_count?: number;
};
export declare type UserUpdateFormValidationValues = {
    email?: ValidationFunction<string>;
    nickname?: ValidationFunction<string>;
    user_type?: ValidationFunction<string>;
    prefecture?: ValidationFunction<string>;
    bike_maker?: ValidationFunction<string>;
    bike_model?: ValidationFunction<string>;
    shooting_genres?: ValidationFunction<string>;
    price_range_min?: ValidationFunction<number>;
    price_range_max?: ValidationFunction<number>;
    equipment?: ValidationFunction<string>;
    bio?: ValidationFunction<string>;
    profile_image?: ValidationFunction<string>;
    portfolio_website?: ValidationFunction<string>;
    instagram_url?: ValidationFunction<string>;
    twitter_url?: ValidationFunction<string>;
    youtube_url?: ValidationFunction<string>;
    special_conditions?: ValidationFunction<string>;
    is_accepting_requests?: ValidationFunction<boolean>;
    average_rating?: ValidationFunction<number>;
    review_count?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type UserUpdateFormOverridesProps = {
    UserUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    email?: PrimitiveOverrideProps<TextFieldProps>;
    nickname?: PrimitiveOverrideProps<TextFieldProps>;
    user_type?: PrimitiveOverrideProps<SelectFieldProps>;
    prefecture?: PrimitiveOverrideProps<TextFieldProps>;
    bike_maker?: PrimitiveOverrideProps<TextFieldProps>;
    bike_model?: PrimitiveOverrideProps<TextFieldProps>;
    shooting_genres?: PrimitiveOverrideProps<TextFieldProps>;
    price_range_min?: PrimitiveOverrideProps<TextFieldProps>;
    price_range_max?: PrimitiveOverrideProps<TextFieldProps>;
    equipment?: PrimitiveOverrideProps<TextFieldProps>;
    bio?: PrimitiveOverrideProps<TextFieldProps>;
    profile_image?: PrimitiveOverrideProps<TextFieldProps>;
    portfolio_website?: PrimitiveOverrideProps<TextFieldProps>;
    instagram_url?: PrimitiveOverrideProps<TextFieldProps>;
    twitter_url?: PrimitiveOverrideProps<TextFieldProps>;
    youtube_url?: PrimitiveOverrideProps<TextFieldProps>;
    special_conditions?: PrimitiveOverrideProps<TextFieldProps>;
    is_accepting_requests?: PrimitiveOverrideProps<SwitchFieldProps>;
    average_rating?: PrimitiveOverrideProps<TextFieldProps>;
    review_count?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type UserUpdateFormProps = React.PropsWithChildren<{
    overrides?: UserUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    user?: any;
    onSubmit?: (fields: UserUpdateFormInputValues) => UserUpdateFormInputValues;
    onSuccess?: (fields: UserUpdateFormInputValues) => void;
    onError?: (fields: UserUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: UserUpdateFormInputValues) => UserUpdateFormInputValues;
    onValidate?: UserUpdateFormValidationValues;
} & React.CSSProperties>;
export default function UserUpdateForm(props: UserUpdateFormProps): React.ReactElement;
