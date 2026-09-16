import * as React from "react";
import { Switch, Text, tokens, makeStyles } from "@fluentui/react-components";

export interface IBooleanToggleProps {
    checked: boolean;
    disabled: boolean;
    onLabel: string;
    offLabel: string;
    onChange: (newValue: boolean) => void;
}

const useStyles = makeStyles({
    root: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: tokens.fontFamilyBase,
    },
});

export const BooleanToggleApp: React.FC<IBooleanToggleProps> = (props) => {
    const classes = useStyles();
    const { checked, disabled, onLabel, offLabel, onChange } = props;

    return (
        <div className={classes.root}>
            <Switch
                checked={checked}
                disabled={disabled}
                onChange={(_ev, data) => onChange(!!data.checked)}
            />
            <Text size={200}>{checked ? onLabel : offLabel}</Text>
        </div>
    );
};
