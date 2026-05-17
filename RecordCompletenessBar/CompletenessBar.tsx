import * as React from "react";
import {
    ProgressBar,
    Badge,
    Text,
    Tooltip,
    makeStyles,
    tokens,
    shorthands,
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

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap("8px"),
        ...shorthands.padding("12px", "16px"),
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.borderRadius("8px"),
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
        ...shorthands.gap("8px"),
    },
    scoreText: {
        fontSize: "24px",
        fontWeight: "700" as any,
        lineHeight: "28px",
    },
    progressContainer: {
        ...shorthands.margin("4px", "0"),
    },
    missingSection: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap("4px"),
        ...shorthands.padding("8px", "0", "0", "0"),
        ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
    },
    missingTitle: {
        display: "flex",
        alignItems: "center",
        ...shorthands.gap("4px"),
        fontSize: "12px",
        fontWeight: "600" as any,
        color: tokens.colorNeutralForeground3,
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
    },
    fieldList: {
        display: "flex",
        flexWrap: "wrap" as const,
        ...shorthands.gap("6px"),
    },
    fieldChip: {
        display: "inline-flex",
        alignItems: "center",
        ...shorthands.gap("4px"),
        ...shorthands.padding("2px", "8px"),
        ...shorthands.borderRadius("4px"),
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
        ...shorthands.gap("6px"),
        color: tokens.colorPaletteGreenForeground1,
        fontSize: "13px",
    },
});

export const CompletenessBarApp: React.FC<ICompletenessBarProps> = (props) => {
    const { fields, warningThreshold, dangerThreshold, showMissingList } = props;
    const classes = useStyles();

    if (fields.length === 0) {
        return (
            <div className={classes.root}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    <Info20Regular style={{ verticalAlign: "middle", marginRight: 4 }} />
                    No fields configured. Set the <strong>Fields To Check</strong> property.
                </Text>
            </div>
        );
    }

    const filledCount = fields.filter((f) => f.filled).length;
    const totalCount = fields.length;
    const percentage = Math.round((filledCount / totalCount) * 100);
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
                    relationship="label"
                >
                    <Badge
                        size="medium"
                        appearance="filled"
                        color={barColor === "success" ? "success" : barColor === "warning" ? "warning" : "danger"}
                    >
                        {filledCount}/{totalCount}
                    </Badge>
                </Tooltip>
            </div>

            {/* Progress bar */}
            <div className={classes.progressContainer}>
                <ProgressBar
                    value={percentage / 100}
                    thickness="large"
                    color={barColor}
                    shape="rounded"
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
                                Missing fields ({missingFields.length})
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
