import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { TaskCompletenessBarApp, ITaskCompletenessBarProps } from "./TaskCompletenessBar";

export class TaskCompletenessBar implements ComponentFramework.ReactControl<IInputs, IOutputs> {
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

        // Read schema configuration with sensible defaults
        const taskEntityLogicalName = (context.parameters.taskEntityLogicalName?.raw || "task").trim();
        const lookupFieldName = (context.parameters.lookupFieldName?.raw || "itr_onboardingcase").trim();
        const completedFieldName = (context.parameters.completedFieldName?.raw || "itr_completed").trim();
        const dueDateFieldName = (context.parameters.dueDateFieldName?.raw || "scheduledend").trim();

        // Get formContext — the supported way to read the current record's id in Model-Driven Apps
        const formContext = this.getFormContext();
        const recordId = this.getCleanRecordId(formContext);

        const props: ITaskCompletenessBarProps = {
            webAPI: context.webAPI,
            recordId,
            taskEntityLogicalName,
            lookupFieldName,
            completedFieldName,
            dueDateFieldName,
        };

        return React.createElement(TaskCompletenessBarApp, props);
    }

    /**
     * Gets the Xrm formContext to read the current record's id.
     * Compatible with Model-Driven Apps (Unified Interface).
     */
    private getFormContext(): any {
        try {
            // Primary: Xrm.Page (still available in Unified Interface runtime)
            const xrm = (window as any).Xrm;
            if (xrm?.Page?.data?.entity) {
                return xrm.Page;
            }
            // Fallback: parent window (iframes)
            const parentXrm = (window as any).parent?.Xrm;
            if (parentXrm?.Page?.data?.entity) {
                return parentXrm.Page;
            }
        } catch {
            // Test harness or unsupported environment
        }
        return null;
    }

    /**
     * Reads the current record's id from formContext and strips the surrounding
     * braces that Xrm.Page.data.entity.getId() returns (e.g. "{guid}" -> "guid").
     * Returns null for unsaved (new) records.
     */
    private getCleanRecordId(formContext: any): string | null {
        try {
            const rawId: string | undefined = formContext?.data?.entity?.getId?.();
            if (!rawId) {
                return null;
            }
            const cleaned = rawId.replace(/[{}]/g, "").trim();
            return cleaned.length > 0 ? cleaned : null;
        } catch {
            return null;
        }
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {}
}
