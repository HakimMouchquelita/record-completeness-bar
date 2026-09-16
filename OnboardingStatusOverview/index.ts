import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { OnboardingStatusOverviewApp, IOnboardingStatusOverviewProps } from "./OnboardingStatusOverview";

export class OnboardingStatusOverview implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;

    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const taskEntityLogicalName = (context.parameters.taskEntityLogicalName?.raw || "task").trim();
        const lookupFieldName = (context.parameters.lookupFieldName?.raw || "itr_onboardingcase").trim();
        const completedFieldName = (context.parameters.completedFieldName?.raw || "itr_completed").trim();
        const dueDateFieldName = (context.parameters.dueDateFieldName?.raw || "scheduledend").trim();

        const props: IOnboardingStatusOverviewProps = {
            webAPI: context.webAPI,
            dataset: context.parameters.records,
            taskEntityLogicalName,
            lookupFieldName,
            completedFieldName,
            dueDateFieldName,
        };

        return React.createElement(OnboardingStatusOverviewApp, props);
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {}
}
