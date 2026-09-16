import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { OnboardingCaseCalendarApp, IOnboardingCaseCalendarProps } from "./OnboardingCaseCalendar";

export class OnboardingCaseCalendar implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {}

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const dateFieldName = (context.parameters.dateFieldName?.raw || "itr_expectedstartdate").trim();
        const titleFieldName = (context.parameters.titleFieldName?.raw || "itr_employeename").trim();

        const props: IOnboardingCaseCalendarProps = {
            dataset: context.parameters.records,
            dateFieldName,
            titleFieldName,
        };

        return React.createElement(OnboardingCaseCalendarApp, props);
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {}
}
