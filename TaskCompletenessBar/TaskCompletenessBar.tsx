import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
    ProgressBar,
    Badge,
    Text,
    Tooltip,
    Spinner,
    makeStyles,
    tokens,
} from "@fluentui/react-components";
import { Info20Regular, ErrorCircle20Filled } from "@fluentui/react-icons";

export interface ITaskCompletenessBarProps {
    webAPI: ComponentFramework.WebApi;
    recordId: string | null;
    taskEntityLogicalName: string;
    lookupFieldName: string;
    completedFieldName: string;
    dueDateFieldName: string;
}

interface ITaskItem {
    id: string;
    completed: boolean;
    dueDate: Date | null;
}

type LoadStatus = "loading" | "error" | "loaded";
type BarColor = "success" | "warning" | "error";

/**
 * Styles using direct CSS properties instead of shorthands helpers.
 * This ensures compatibility with Fluent UI 9.46.2 (PCF platform version).
 * shorthands.borderTop() and some multi-arg shorthands may not exist in 9.46.2.
 */
const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        paddingTop: "12px",
        paddingBottom: "12px",
        paddingLeft: "16px",
        paddingRight: "16px",
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow4,
        fontFamily: tokens.fontFamilyBase,
    },
    statusRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: tokens.colorNeutralForeground3,
    },
    errorRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: tokens.colorPaletteRedForeground1,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    scoreText: {
        fontSize: "24px",
        fontWeight: 700 as unknown as string,
        lineHeight: "28px",
    },
    progressContainer: {
        marginTop: "4px",
        marginBottom: "4px",
    },
    badgeText: {
        fontSize: "12px",
        fontWeight: 600 as unknown as string,
    },
    detailText: {
        color: tokens.colorNeutralForeground3,
    },
});

/** Strips the time portion so date-only comparisons (overdue / due today) are reliable. */
function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const TaskCompletenessBarApp: React.FC<ITaskCompletenessBarProps> = (props) => {
    const { recordId, webAPI, taskEntityLogicalName, lookupFieldName, completedFieldName, dueDateFieldName } =
        props;
    const classes = useStyles();

    const [status, setStatus] = useState<LoadStatus>("loading");
    const [tasks, setTasks] = useState<ITaskItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Guards against setting state after the component has unmounted or after a
    // newer fetch has superseded this one (e.g. rapid record navigation).
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        // No record loaded yet (e.g. unsaved new record) — nothing to fetch.
        if (!recordId) {
            setStatus("loaded");
            setTasks([]);
            return;
        }

        let cancelled = false;
        setStatus("loading");
        setErrorMessage("");

        const options =
            "?$select=" +
            encodeURIComponent(completedFieldName) +
            "," +
            encodeURIComponent(dueDateFieldName) +
            "&$filter=_" +
            lookupFieldName +
            "_value eq " +
            recordId;

        webAPI
            .retrieveMultipleRecords(taskEntityLogicalName, options)
            .then((result) => {
                if (cancelled || !isMountedRef.current) {
                    return;
                }
                const mapped: ITaskItem[] = (result.entities || []).map((entity) => {
                    const rawDueDate = entity[dueDateFieldName] as string | null | undefined;
                    const parsedDueDate = rawDueDate ? new Date(rawDueDate) : null;
                    return {
                        id: (entity as any)[`${taskEntityLogicalName}id`] || (entity as any).activityid || "",
                        completed: entity[completedFieldName] === true,
                        dueDate: parsedDueDate && !isNaN(parsedDueDate.getTime()) ? parsedDueDate : null,
                    };
                });
                setTasks(mapped);
                setStatus("loaded");
            })
            .catch((error: unknown) => {
                if (cancelled || !isMountedRef.current) {
                    return;
                }
                const message =
                    error instanceof Error ? error.message : "Failed to load related tasks.";
                setErrorMessage(message);
                setStatus("error");
            });

        return () => {
            cancelled = true;
        };
    }, [recordId, webAPI, taskEntityLogicalName, lookupFieldName, completedFieldName, dueDateFieldName]);

    // Loading state
    if (status === "loading") {
        return (
            <div className={classes.root}>
                <div className={classes.statusRow}>
                    <Spinner size="tiny" />
                    <Text size={200}>Loading related tasks…</Text>
                </div>
            </div>
        );
    }

    // Error state
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

    // Empty state — no linked tasks (not treated as 0%)
    if (tasks.length === 0) {
        return (
            <div className={classes.root}>
                <div className={classes.statusRow}>
                    <Info20Regular />
                    <Text size={200}>No related tasks found.</Text>
                </div>
            </div>
        );
    }

    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const incompleteTasks = tasks.filter((t) => !t.completed);

    // Color logic:
    // - All tasks completed -> green
    // - Not all completed, and at least one incomplete task's due date has passed -> red
    // - Not all completed, none overdue, but at least one incomplete task is due today -> orange
    // - Otherwise (incomplete tasks exist but none overdue/due today) -> green
    const todayStart = startOfDay(new Date());
    let overdueCount = 0;
    let dueTodayCount = 0;
    for (const task of incompleteTasks) {
        if (!task.dueDate) {
            continue;
        }
        const dueStart = startOfDay(task.dueDate);
        if (dueStart.getTime() < todayStart.getTime()) {
            overdueCount++;
        } else if (dueStart.getTime() === todayStart.getTime()) {
            dueTodayCount++;
        }
    }

    let barColor: BarColor = "success";
    let detailText = "All related tasks are completed.";
    if (incompleteTasks.length > 0) {
        if (overdueCount > 0) {
            barColor = "error";
            detailText = `${overdueCount} incomplete task${overdueCount === 1 ? "" : "s"} overdue.`;
        } else if (dueTodayCount > 0) {
            barColor = "warning";
            detailText = `${dueTodayCount} incomplete task${dueTodayCount === 1 ? "" : "s"} due today.`;
        } else {
            detailText = "No overdue or due-today tasks.";
        }
    }

    const scoreColor =
        barColor === "error"
            ? tokens.colorPaletteRedForeground1
            : barColor === "warning"
              ? tokens.colorPaletteDarkOrangeForeground1
              : tokens.colorPaletteGreenForeground1;

    // Badge color mapping
    const badgeColor: "success" | "warning" | "danger" =
        barColor === "success" ? "success" : barColor === "warning" ? "warning" : "danger";

    return (
        <div className={classes.root}>
            {/* Header row: score + badge */}
            <div className={classes.header}>
                <div className={classes.headerLeft}>
                    <span className={classes.scoreText} style={{ color: scoreColor }}>
                        {percentage}%
                    </span>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Task Completeness
                    </Text>
                </div>
                <Tooltip
                    content={`${completedCount} of ${totalCount} tasks completed`}
                    relationship="description"
                >
                    <Badge size="medium" appearance="filled" color={badgeColor}>
                        <span className={classes.badgeText}>
                            {completedCount}/{totalCount}
                        </span>
                    </Badge>
                </Tooltip>
            </div>

            {/* Progress bar */}
            <div className={classes.progressContainer}>
                <ProgressBar value={percentage / 100} thickness="large" color={barColor} />
            </div>

            <Text size={200} className={classes.detailText}>
                {detailText}
            </Text>
        </div>
    );
};
