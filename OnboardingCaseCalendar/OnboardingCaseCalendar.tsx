import * as React from "react";
import { useMemo, useState } from "react";
import { Text, Badge, Button, makeStyles, tokens } from "@fluentui/react-components";
import { ChevronLeft20Regular, ChevronRight20Regular, Info20Regular } from "@fluentui/react-icons";

export interface IOnboardingCaseCalendarProps {
    dataset: ComponentFramework.PropertyTypes.DataSet;
    dateFieldName: string;
    titleFieldName: string;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    monthLabel: {
        fontSize: "16px",
        fontWeight: 600 as unknown as string,
        color: tokens.colorNeutralForeground1,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        flex: "1 1 auto",
        minHeight: 0,
    },
    weekdayCell: {
        textAlign: "center",
        fontSize: "12px",
        fontWeight: 600 as unknown as string,
        color: tokens.colorNeutralForeground3,
        padding: "4px 0",
    },
    dayCell: {
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: "4px",
        padding: "4px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minHeight: "88px",
        overflow: "hidden",
    },
    dayCellOutside: {
        backgroundColor: tokens.colorNeutralBackground2,
    },
    dayCellToday: {
        border: `2px solid ${tokens.colorBrandStroke1}`,
    },
    dayNumber: {
        fontSize: "12px",
        color: tokens.colorNeutralForeground3,
        alignSelf: "flex-end",
    },
    dayNumberOutside: {
        color: tokens.colorNeutralForeground4,
    },
    chipList: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        overflow: "auto",
    },
    chip: {
        cursor: "pointer",
        textAlign: "left",
        justifyContent: "flex-start",
        width: "100%",
        maxWidth: "100%",
    },
    statusRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: tokens.colorNeutralForeground3,
        padding: "16px",
    },
});

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Builds a 6-week (42 day) grid starting on the Sunday on/before the 1st of the month. */
function buildMonthGrid(monthAnchor: Date): Date[] {
    const firstOfMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + i);
        days.push(day);
    }
    return days;
}

export const OnboardingCaseCalendarApp: React.FC<IOnboardingCaseCalendarProps> = (props) => {
    const { dataset, dateFieldName, titleFieldName } = props;
    const classes = useStyles();

    const [monthAnchor, setMonthAnchor] = useState<Date>(() => startOfDay(new Date()));
    const today = useMemo(() => startOfDay(new Date()), []);

    const recordIds = dataset.loading ? [] : dataset.sortedRecordIds;

    const recordsByDay = useMemo(() => {
        const map = new Map<string, { id: string; label: string }[]>();
        for (const id of recordIds) {
            const record = dataset.records[id];
            const rawDate = record.getValue(dateFieldName) as Date | string | null | undefined;
            if (!rawDate) {
                continue;
            }
            const parsed = rawDate instanceof Date ? rawDate : new Date(rawDate);
            if (isNaN(parsed.getTime())) {
                continue;
            }
            const key = startOfDay(parsed).toDateString();
            const label = record.getFormattedValue(titleFieldName) || record.getValue(titleFieldName)?.toString() || "(untitled)";
            const existing = map.get(key) || [];
            existing.push({ id, label });
            map.set(key, existing);
        }
        return map;
    }, [recordIds, dataset, dateFieldName, titleFieldName]);

    const monthGrid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
    const monthLabel = monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    if (dataset.loading) {
        return (
            <div className={classes.root}>
                <div className={classes.statusRow}>
                    <Text size={200}>Loading calendar…</Text>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <div className={classes.header}>
                <Button
                    icon={<ChevronLeft20Regular />}
                    appearance="subtle"
                    aria-label="Previous month"
                    onClick={() => setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                />
                <Text className={classes.monthLabel}>{monthLabel}</Text>
                <Button
                    icon={<ChevronRight20Regular />}
                    appearance="subtle"
                    aria-label="Next month"
                    onClick={() => setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                />
            </div>

            {recordIds.length === 0 && (
                <div className={classes.statusRow}>
                    <Info20Regular />
                    <Text size={200}>No records in this view.</Text>
                </div>
            )}

            <div className={classes.grid}>
                {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className={classes.weekdayCell}>
                        {label}
                    </div>
                ))}
                {monthGrid.map((day) => {
                    const isOutsideMonth = day.getMonth() !== monthAnchor.getMonth();
                    const isToday = isSameDay(day, today);
                    const dayRecords = recordsByDay.get(day.toDateString()) || [];

                    return (
                        <div
                            key={day.toISOString()}
                            className={`${classes.dayCell} ${isOutsideMonth ? classes.dayCellOutside : ""} ${
                                isToday ? classes.dayCellToday : ""
                            }`}
                        >
                            <Text className={`${classes.dayNumber} ${isOutsideMonth ? classes.dayNumberOutside : ""}`}>
                                {day.getDate()}
                            </Text>
                            <div className={classes.chipList}>
                                {dayRecords.map((item) => (
                                    <Badge
                                        key={item.id}
                                        className={classes.chip}
                                        appearance="tint"
                                        color="brand"
                                        onClick={() => dataset.openDatasetItem(dataset.records[item.id].getNamedReference())}
                                        title={item.label}
                                    >
                                        {item.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
