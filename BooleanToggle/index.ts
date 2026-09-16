import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { BooleanToggleApp, IBooleanToggleProps } from "./BooleanToggle";

export class BooleanToggle implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private context: ComponentFramework.Context<IInputs>;
    private currentValue: boolean;

    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
        this.context = context;
        this.currentValue = !!context.parameters.value.raw;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        this.context = context;
        this.currentValue = !!context.parameters.value.raw;

        const onLabel = (context.parameters.onLabel?.raw || "Yes").trim();
        const offLabel = (context.parameters.offLabel?.raw || "No").trim();
        const disabled = context.mode.isControlDisabled || context.parameters.value.security?.editable === false;

        const props: IBooleanToggleProps = {
            checked: this.currentValue,
            disabled,
            onLabel,
            offLabel,
            onChange: (newValue: boolean) => {
                this.currentValue = newValue;
                this.notifyOutputChanged();
            },
        };

        return React.createElement(BooleanToggleApp, props);
    }

    public getOutputs(): IOutputs {
        return { value: this.currentValue };
    }

    public destroy(): void {}
}
