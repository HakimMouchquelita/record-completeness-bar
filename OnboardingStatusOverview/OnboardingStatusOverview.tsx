import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Text, Spinner, Button, makeStyles, tokens } from "@fluentui/react-components";
import { Info20Regular, ErrorCircle20Filled, ChevronLeft20Regular, ChevronRight20Regular } from "@fluentui/react-icons";

export interface IOnboardingStatusOverviewProps {
    webAPI: ComponentFramework.WebApi;
    dataset: ComponentFramework.PropertyTypes.DataSet;
    taskEntityLogicalName: string;
    lookupFieldName: string;
    completedFieldName: string;
    dueDateFieldName: string;
}

interface ITaskAggregate {
    total: number;
    completed: number;
    overdueIncomplete: number;
    dueTodayIncomplete: number;
}

type LoadStatus = "loading" | "error" | "loaded";
type BarColor = "success" | "warning" | "error";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "8px",
        fontFamily: tokens.fontFamilyBase,
        width: "100%",
        height: "100%",
        minWidth: "100%",
        boxSizing: "border-box",
        overflow: "auto",
    },
    table: {
        width: "100%",
        tableLayout: "auto",
        borderCollapse: "collapse",
    },
    th: {
        textAlign: "left",
        padding: "8px",
        borderBottom: `2px solid ${tokens.colorNeutralStroke2}`,
        fontWeight: 600 as unknown as string,
        fontSize: "13px",
        color: tokens.colorNeutralForeground2,
    },
    td: {
        padding: "8px",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        fontSize: "13px",
    },
    row: {
        cursor: "pointer",
    },
    statusRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: tokens.colorNeutralForeground3,
        padding: "16px",
    },
    errorRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: tokens.colorPaletteRedForeground1,
        padding: "16px",
    },
    pagingRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        paddingTop: "8px",
    },
    countText: {
        color: tokens.colorNeutralForeground3,
        marginRight: "auto",
    },
});

/** Strips the time portion so date-only comparisons (overdue / due today) are reliable. */
function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function escapeXml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function isColumnHidden(column: ComponentFramework.PropertyHelper.DataSetApi.Column): boolean {
    const hidden = (column as unknown as { isHidden?: boolean | (() => boolean) }).isHidden;
    return typeof hidden === "function" ? hidden() : !!hidden;
}

// View-specific column label overrides (e.g. shortening "Case Name" to "Case" in this overview grid).
const COLUMN_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
    itr_employeename: "Case",
};

function getColumnDisplayName(column: ComponentFramework.PropertyHelper.DataSetApi.Column): string {
    return COLUMN_DISPLAY_NAME_OVERRIDES[column.name] ?? column.displayName;
}

function renderTaskCompletionCell(agg: ITaskAggregate | undefined): React.ReactElement {
    if (!agg || agg.total === 0) {
        return (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                No tasks
            </Text>
        );
    }

    const percentage = Math.round((agg.completed / agg.total) * 100);
    const allCompleted = agg.completed === agg.total;

    // Color logic (same as TaskCompletenessBar):
    // - All tasks completed -> green
    // - Not all completed, at least one incomplete task overdue -> red
    // - Not all completed, none overdue, at least one incomplete task due today -> orange
    // - Otherwise -> green
    let color: BarColor = "success";
    if (!allCompleted) {
        if (agg.overdueIncomplete > 0) {
            color = "error";
        } else if (agg.dueTodayIncomplete > 0) {
            color = "warning";
        }
    }

    const badgeColor: "success" | "warning" | "danger" =
        color === "success" ? "success" : color === "warning" ? "warning" : "danger";

    return (
        <Badge size="medium" appearance="filled" color={badgeColor}>
            {percentage}% ({agg.completed}/{agg.total})
        </Badge>
    );
}

export const OnboardingStatusOverviewApp: React.FC<IOnboardingStatusOverviewProps> = (props) => {
    const { dataset, webAPI, taskEntityLogicalName, lookupFieldName, completedFieldName, dueDateFieldName } = props;
    const classes = useStyles();

    const [status, setStatus] = useState<LoadStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [aggregatesByCaseId, setAggregatesByCaseId] = useState<Record<string, ITaskAggregate>>({});

    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const recordIds = dataset.loading ? [] : dataset.sortedRecordIds;
    // Stable key so the fetch effect only re-fires when the actual set of ids on the current page changes.
    const recordIdsKey = recordIds.join(",");

    useEffect(() => {
        if (dataset.loading) {
            return;
        }
        if (recordIds.length === 0) {
            setAggregatesByCaseId({});
            setStatus("loaded");
            return;
        }

        let cancelled = false;
        setStatus("loading");
        setErrorMessage("");

        const idConditions = recordIds.map((id) => `<value>${escapeXml(id.replace(/[{}]/g, ""))}</value>`).join("");

        // Single batched query for every record on the current page, instead of one call per row.
        const fetchXml =
            `<fetch>` +
            `<entity name="${escapeXml(taskEntityLogicalName)}">` +
            `<attribute name="${escapeXml(lookupFieldName)}" />` +
            `<attribute name="${escapeXml(completedFieldName)}" />` +
            `<attribute name="${escapeXml(dueDateFieldName)}" />` +
            `<filter>` +
            `<condition attribute="${escapeXml(lookupFieldName)}" operator="in">${idConditions}</condition>` +
            `</filter>` +
            `</entity>` +
            `</fetch>`;

        webAPI
            .retrieveMultipleRecords(taskEntityLogicalName, `?fetchXml=${encodeURIComponent(fetchXml)}`)
            .then((result) => {
                if (cancelled || !isMountedRef.current) {
                    return;
                }
                const todayStart = startOfDay(new Date());
                const map: Record<string, ITaskAggregate> = {};
                for (const entity of result.entities || []) {
                    const lookupValue = entity[`_${lookupFieldName}_value`] as string | undefined;
                    if (!lookupValue) {
                        continue;
                    }
                    const caseId = lookupValue.toLowerCase();
                    if (!map[caseId]) {
                        map[caseId] = { total: 0, completed: 0, overdueIncomplete: 0, dueTodayIncomplete: 0 };
                    }
                    const agg = map[caseId];
                    agg.total += 1;
                    const isCompleted = entity[completedFieldName] === true;
                    if (isCompleted) {
                        agg.completed += 1;
                    } else {
                        const rawDueDate = entity[dueDateFieldName] as string | null | undefined;
                        const parsedDueDate = rawDueDate ? new Date(rawDueDate) : null;
                        if (parsedDueDate && !isNaN(parsedDueDate.getTime())) {
                            const dueStart = startOfDay(parsedDueDate);
                            if (dueStart.getTime() < todayStart.getTime()) {
                                agg.overdueIncomplete += 1;
                            } else if (dueStart.getTime() === todayStart.getTime()) {
                                agg.dueTodayIncomplete += 1;
                            }
                        }
                    }
                }
                setAggregatesByCaseId(map);
                setStatus("loaded");
            })
            .catch((error: unknown) => {
                if (cancelled || !isMountedRef.current) {
                    return;
                }
                const message = error instanceof Error ? error.message : "Failed to load related tasks.";
                setErrorMessage(message);
                setStatus("error");
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recordIdsKey, dataset.loading, webAPI, taskEntityLogicalName, lookupFieldName, completedFieldName, dueDateFieldName]);

    const columns = useMemo(
        () =>
            (dataset.columns || [])
                .filter((c) => !isColumnHidden(c) && c.order >= 0)
                .sort((a, b) => a.order - b.order),
        [dataset.columns]
    );

    if (dataset.loading || status === "loading") {
        return (
            <div className={classes.root}>
                <div className={classes.statusRow}>
                    <Spinner size="tiny" />
                    <Text size={200}>Loading onboarding status overview…</Text>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className={classes.root}>
                <div className={classes.errorRow}>
                    <ErrorCircle20Filled />
                    <Text size={200}>Couldn&apos;t load related tasks: {errorMessage}</Text>
                </div>
            </div>
        );
    }

    if (recordIds.length === 0) {
        return (
            <div className={classes.root}>
                <div className={classes.statusRow}>
                    <Info20Regular />
                    <Text size={200}>No records in this view.</Text>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <table className={classes.table}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.name} className={classes.th}>
                                {getColumnDisplayName(col)}
                            </th>
                        ))}
                        <th className={classes.th}>Task Completion</th>
                    </tr>
                </thead>
                <tbody>
                    {recordIds.map((id) => {
                        const record = dataset.records[id];
                        const agg = aggregatesByCaseId[id.toLowerCase()];
                        return (
                            <tr key={id} className={classes.row} onClick={() => dataset.openDatasetItem(record.getNamedReference())}>
                                {columns.map((col) => (
                                    <td key={col.name} className={classes.td}>
                                        {record.getFormattedValue(col.name)}
                                    </td>
                                ))}
                                <td className={classes.td}>{renderTaskCompletionCell(agg)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className={classes.pagingRow}>
                <Text size={200} className={classes.countText}>
                    {dataset.paging.totalResultCount >= 0
                        ? `${recordIds.length} of ${dataset.paging.totalResultCount}`
                        : `${recordIds.length} records`}
                </Text>
                <Button
                    icon={<ChevronLeft20Regular />}
                    appearance="subtle"
                    disabled={!dataset.paging.hasPreviousPage}
                    onClick={() => dataset.paging.loadPreviousPage()}
                    aria-label="Previous page"
                />
                <Button
                    icon={<ChevronRight20Regular />}
                    appearance="subtle"
                    disabled={!dataset.paging.hasNextPage}
                    onClick={() => dataset.paging.loadNextPage()}
                    aria-label="Next page"
                />
            </div>
        </div>
    );
};
