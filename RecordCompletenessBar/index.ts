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

        // Read thresholds with validation
        let warningThreshold = context.parameters.warningThreshold?.raw ?? 60;
        let dangerThreshold = context.parameters.dangerThreshold?.raw ?? 30;

        // Clamp thresholds to 0-100 range
        warningThreshold = Math.max(0, Math.min(100, warningThreshold));
        dangerThreshold = Math.max(0, Math.min(100, dangerThreshold));

        // Ensure danger < warning for logical consistency
        if (dangerThreshold >= warningThreshold) {
            dangerThreshold = Math.max(0, warningThreshold - 10);
        }

        // Show missing list toggle
        const showMissingRaw = (context.parameters.showMissingList?.raw || "true").toLowerCase();
        const showMissingList = showMissingRaw !== "false";

        // Get formContext — the supported way to read field values in Model-Driven Apps
        const formContext = this.getFormContext();

        // Evaluate each field
        const fieldStatuses: { name: string; label: string; filled: boolean }[] = [];

        for (let i = 0; i < fieldNames.length; i++) {
            const logicalName = fieldNames[i];
            const label = fieldLabels[i] || logicalName;
            let filled = false;

            if (formContext) {
                try {
                    const attr = formContext.getAttribute(logicalName);
                    if (attr) {
                        const val = attr.getValue();
                        if (val !== null && val !== undefined) {
                            if (typeof val === "string") {
                                filled = val.trim().length > 0;
                            } else if (Array.isArray(val)) {
                                // Lookup fields return an array of EntityReference
                                filled = val.length > 0;
                            } else if (typeof val === "boolean") {
                                // Boolean/Two Options — always considered "filled" if set
                                filled = true;
                            } else if (typeof val === "number") {
                                // Whole number, decimal, currency, optionset
                                filled = true;
                            } else if (val instanceof Date) {
                                // Date/DateTime fields
                                filled = true;
                            } else {
                                // Fallback for other types
                                filled = true;
                            }
                        }
                    }
                } catch {
                    filled = false;
                }
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

    /**
     * Gets the Xrm formContext to read field values.
     * Compatible with Model-Driven Apps (Unified Interface).
     */
    private getFormContext(): any {
        try {
            // Primary: Xrm.Page (still available in Unified Interface runtime)
            const xrm = (window as any).Xrm;
            if (xrm?.Page?.getAttribute) {
                return xrm.Page;
            }
            // Fallback: parent window (iframes)
            const parentXrm = (window as any).parent?.Xrm;
            if (parentXrm?.Page?.getAttribute) {
                return parentXrm.Page;
            }
        } catch {
            // Test harness or unsupported environment
        }
        return null;
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {}
}
