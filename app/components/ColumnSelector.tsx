import { BlockStack, Checkbox, Badge, Icon, Text } from "@shopify/polaris";
import { ChevronUpIcon, ChevronDownIcon } from "@shopify/polaris-icons";
import { PRODUCTS_COLUMNS } from "../constants/exportData";

interface ColumnSelectorProps {
    selectedColumns: string[];
    onColumnToggle?: (column: string) => void;
    expandedGroups: string[];
    onGroupToggle?: (group: string) => void;
    onGroupSelection?: (groupName: string, columns: string[]) => void;
    readOnly?: boolean;
}

export function ColumnSelector({
    selectedColumns,
    onColumnToggle,
    expandedGroups,
    onGroupToggle,
    onGroupSelection,
    readOnly = false
}: ColumnSelectorProps) {
    return (
        <BlockStack gap="400">
            <Text as="p" variant="bodySm" tone="subdued">
                {readOnly ? "Selected Columns" : "Select Columns"}
            </Text>
            <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                {PRODUCTS_COLUMNS.map((group, groupIndex) => {
                    const isGroupExpanded = expandedGroups.includes(group.name);
                    const groupColumns = group.columns;
                    const selectedInGroup = groupColumns.filter(c => selectedColumns.includes(c));
                    const isGroupSelected = selectedInGroup.length === groupColumns.length;
                    const isGroupIndeterminate = selectedInGroup.length > 0 && selectedInGroup.length < groupColumns.length;

                    return (
                        <div key={group.name} style={{ borderBottom: groupIndex < PRODUCTS_COLUMNS.length - 1 ? "1px solid #e1e3e5" : "none" }}>
                            <div
                                style={{
                                    padding: "12px 16px",
                                    cursor: readOnly ? "default" : "pointer",
                                    width: "100%"
                                }}
                                onClick={() => !readOnly && onGroupToggle?.(group.name)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        {!readOnly && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    label={group.name}
                                                    checked={isGroupSelected ? true : isGroupIndeterminate ? "indeterminate" : false}
                                                    onChange={() => onGroupSelection?.(group.name, groupColumns)}
                                                />
                                            </div>
                                        )}
                                        {readOnly && (
                                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                                                {group.name}
                                            </Text>
                                        )}
                                        {group.badge && (
                                            <Badge tone={group.badge === "Very Slow" ? "critical" : "warning"}>
                                                {group.badge}
                                            </Badge>
                                        )}
                                        {readOnly && selectedInGroup.length > 0 && (
                                            <Badge tone="info">
                                                {selectedInGroup.length} of {groupColumns.length}
                                            </Badge>
                                        )}
                                    </div>
                                    {!readOnly && <Icon source={isGroupExpanded ? ChevronUpIcon : ChevronDownIcon} />}
                                </div>
                            </div>
                            {isGroupExpanded && (
                                <div style={{ padding: "0 16px 16px 44px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                                        {groupColumns.map((col) => (
                                            <Checkbox
                                                key={col}
                                                label={col}
                                                checked={selectedColumns.includes(col)}
                                                onChange={() => onColumnToggle?.(col)}
                                                disabled={readOnly}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {readOnly && selectedInGroup.length > 0 && (
                                <div style={{ padding: "0 16px 16px 16px" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {selectedInGroup.map((col) => (
                                            <Badge key={col}>{col}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </BlockStack>
    );
}
