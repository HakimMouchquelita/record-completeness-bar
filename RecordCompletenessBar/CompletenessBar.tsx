import * as React from "react";
import {
    ProgressBar,
    Badge,
    Text,
    Tooltip,
    makeStyles,
    tokens,
} from "@fluentui/react-components";
import {
    CheckmarkCircle20Filled,
    DismissCircle20Filled,
    Warning20Filled,
    Info20Regular,
} from "@fluentui/react-icons";

export interface IFieldStatus {
    name: string;
    label: string;
    filled: boolean;
}

export interface ICompletenessBarProps {
    fields: IFieldStatus[];
    warningThreshold: number;
    dangerThreshold: number;
    showMissingList: boolean;
}

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
    missingSection: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        paddingTop: "8px",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: tokens.colorNeutralStroke2,
    },
    missingTitle: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: 600 as unknown as string,
        color: tokens.colorNeutralForeground3,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    fieldList: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
    },
    fieldChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        paddingTop: "2px",
        paddingBottom: "2px",
        paddingLeft: "8px",
        paddingRight: "8px",
        borderRadius: tokens.borderRadiusSmall,
        fontSize: "12px",
        lineHeight: "20px",
    },
    chipFilled: {
        backgroundColor: tokens.colorPaletteGreenBackground1,
        color: tokens.colorPaletteGreenForeground1,
    },
    chipMissing: {
        backgroundColor: tokens.colorPaletteRedBackground1,
        color: tokens.colorPaletteRedForeground1,
    },
    allGood: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: tokens.colorPaletteGreenForeground1,
        fontSize: "13px",
    },
    badgeText: {
        fontSize: "12px",
        fontWeight: 600 as unknown as string,
    },
});

export const CompletenessBarApp: React.FC<ICompletenessBarProps> = (props) => {
    const { fields, warningThreshold, dangerThreshold, showMissingList } = props;
    const classes = useStyles();

    // Empty state — no fields configured
    if (fields.length === 0) {
        return (
            <div className={classes.root}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: tokens.colorNeutralForeground3 }}>
                    <Info20Regular />
                    <Text size={200}>
                        No fields configured. Set the <strong>Fields To Check</strong> property.
                    </Text>
                </div>
            </div>
        );
    }

    const filledCount = fields.filter((f) => f.filled).length;
    const totalCount = fields.length;
    const percentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
    const missingFields = fields.filter((f) => !f.filled);

    // Determine color based on thresholds
    let barColor: "success" | "warning" | "error" = "success";
    let scoreColor = tokens.colorPaletteGreenForeground1;
    if (percentage < dangerThreshold) {
        barColor = "error";
        scoreColor = tokens.colorPaletteRedForeground1;
    } else if (percentage < warningThreshold) {
        barColor = "warning";
        scoreColor = tokens.colorPaletteDarkOrangeForeground1;
    }

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
                        Record Completeness
                    </Text>
                </div>
                <Tooltip
                    content={`${filledCount} of ${totalCount} fields filled`}
                    relationship="description"
                >
                    <Badge
                        size="medium"
                        appearance="filled"
                        color={badgeColor}
                    >
                        <span className={classes.badgeText}>
                            {filledCount}/{totalCount}
                        </span>
                    </Badge>
                </Tooltip>
            </div>

            {/* Progress bar */}
            <div className={classes.progressContainer}>
                <ProgressBar
                    value={percentage / 100}
                    thickness="large"
                    color={barColor}
                />
            </div>

            {/* Missing fields section */}
            {showMissingList && (
                <div className={classes.missingSection}>
                    {missingFields.length === 0 ? (
                        <div className={classes.allGood}>
                            <CheckmarkCircle20Filled />
                            <Text size={200}>All fields are filled — great data quality!</Text>
                        </div>
                    ) : (
                        <>
                            <div className={classes.missingTitle}>
                                <Warning20Filled
                                    style={{ color: tokens.colorPaletteDarkOrangeForeground1 }}
                                />
                                <span>Missing fields ({missingFields.length})</span>
                            </div>
                            <div className={classes.fieldList}>
                                {fields.map((f) => (
                                    <span
                                        key={f.name}
                                        className={`${classes.fieldChip} ${
                                            f.filled ? classes.chipFilled : classes.chipMissing
                                        }`}
                                    >
                                        {f.filled ? (
                                            <CheckmarkCircle20Filled />
                                        ) : (
                                            <DismissCircle20Filled />
                                        )}
                                        {f.label}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
