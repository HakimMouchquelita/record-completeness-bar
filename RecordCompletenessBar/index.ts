import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { CompletenessBarApp, ICompletenessBarProps } from "./CompletenessBar";

export class RecordCompletenessBar implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private context: ComponentFramework.Context<IInputs>;

    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
        this.context = context;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        this.context = context;

        // Parse fieldsToCheck
        const fieldsRaw = context.parameters.fieldsToCheck?.raw || "";
        const fieldNames = fieldsRaw
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f.length > 0);

        // Parse fieldLabels
        const labelsRaw = context.parameters.fieldLabels?.raw || "";
        const fieldLabels = labelsRaw
            .split(",")
            .map((l) => l.trim());

        // Read thresholds
        const warningThreshold = context.parameters.warningThreshold?.raw ?? 60;
        const dangerThreshold = context.parameters.dangerThreshold?.raw ?? 30;

        // Show missing list
        const showMissingRaw = (context.parameters.showMissingList?.raw || "true").toLowerCase();
        const showMissingList = showMissingRaw !== "false";

        // Evaluate each field using the form context (Xrm)
        const fieldStatuses: { name: string; label: string; filled: boolean }[] = [];

        for (let i = 0; i < fieldNames.length; i++) {
            const logicalName = fieldNames[i];
            const label = fieldLabels[i] || logicalName;

            let filled = false;
            try {
                // Try to read the attribute value from the form context
                const attrValue = (context as any).parameters?.[logicalName]?.raw;
                if (attrValue !== undefined && attrValue !== null) {
                    filled = String(attrValue).trim().length > 0;
                } else {
                    // Fallback: try Xrm.Page if available (Model-Driven App)
                    const xrm = (window as any).Xrm;
                    if (xrm?.Page?.getAttribute) {
                        const attr = xrm.Page.getAttribute(logicalName);
                        if (attr) {
                            const val = attr.getValue();
                            filled = val !== null && val !== undefined && String(val).trim().length > 0;
                        }
                    }
                }
            } catch {
                filled = false;
            }

            fieldStatuses.push({ name: logicalName, label, filled });
        }

        const props: ICompletenessBarProps = {
            fields: fieldStatuses,
            warningThreshold,
            dangerThreshold,
            showMissingList,
        };

        return React.createElement(CompletenessBarApp, props);
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {}
}
