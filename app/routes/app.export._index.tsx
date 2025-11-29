import { useState, useCallback } from "react";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    InlineStack,
    Button,
    Text,
    Select,
    Popover,
    Box,
    Checkbox,
    Scrollable,
    Badge,
    Collapsible,
    Icon,
    TextField,
    Divider,
    ActionList,
    InlineGrid,
    Link,
} from "@shopify/polaris";
import {
    CollectionIcon,
    PersonIcon,
    WorkIcon,
    DiscountIcon,
    NoteIcon,
    OrderIcon,
    CashDollarIcon,
    PageIcon,
    BlogIcon,
    ArrowRightIcon,
    ViewIcon,
    FileIcon,
    DatabaseIcon,
    MenuIcon,
    StoreIcon,
    ProductIcon,
    DeleteIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    FilterIcon,
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate, useSubmit, Form } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { redirect } from "react-router";
import prisma from "../db.server";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const sheets = JSON.parse(formData.get("sheets") as string);
    const columns = JSON.parse(formData.get("columns") as string);
    const format = formData.get("format") as string;

    const sheetName = AVAILABLE_SHEETS.find(s => s.id === sheets[0])?.name || sheets[0];
    const entityName = sheets.length === 1 ? sheetName : `${sheets.length} Sheets`;

    // Create job initially as Queued
    const job = await prisma.job.create({
        data: {
            type: "Export",
            entity: entityName,
            status: "Queued",
            details: JSON.stringify({ sheets, columns, format }),
        }
    });

    // Process Export (Simplified inline processing)
    try {
        const wb = XLSX.utils.book_new();
        let hasData = false;

        if (sheets.includes("products")) {
            const response = await admin.graphql(
                `#graphql
                query {
                    products(first: 50) {
                        edges {
                            node {
                                id
                                title
                                handle
                                vendor
                                productType
                                status
                                totalInventory
                                createdAt
                                updatedAt
                                tags
                                variants(first: 10) {
                                    edges {
                                        node {
                                            id
                                            sku
                                            price
                                            barcode
                                            weight
                                            inventoryQuantity
                                        }
                                    }
                                }
                            }
                        }
                    }
                }`
            );
            const data = await response.json();
            const products = data.data.products.edges.map((edge: any) => {
                const p = edge.node;
                // Flatten data for Excel - simple version taking first variant
                const v = p.variants.edges[0]?.node || {};

                // Map based on selected columns or defaults
                // This is a simplified mapping. In a real app, you'd map dynamically based on `columns`
                return {
                    "ID": p.id,
                    "Handle": p.handle,
                    "Command": "UPDATE", // Default for Matrixify
                    "Title": p.title,
                    "Body HTML": "",
                    "Vendor": p.vendor,
                    "Type": p.productType,
                    "Tags": p.tags.join(", "),
                    "Status": p.status,
                    "Variant SKU": v.sku,
                    "Variant Price": v.price,
                    "Variant Inventory Qty": v.inventoryQuantity,
                    "Variant Weight": v.weight,
                    "Variant Barcode": v.barcode
                };
            });

            const ws = XLSX.utils.json_to_sheet(products);
            XLSX.utils.book_append_sheet(wb, ws, "Products");
            hasData = true;
        }

        if (hasData) {
            const fileName = `Export_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
            const publicDir = path.join(process.cwd(), "public", "exports");

            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            const filePath = path.join(publicDir, fileName);
            XLSX.writeFile(wb, filePath);

            // Update job to Finished
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: "Finished",
                    // Store relative path for download
                    details: JSON.stringify({
                        sheets,
                        columns,
                        format,
                        file: `/exports/${fileName}`,
                        fileName: fileName
                    })
                }
            });
        } else {
            // Update job to Failed if no data processed (or handle empty)
            await prisma.job.update({
                where: { id: job.id },
                data: { status: "Finished" } // Mark finished even if empty for now
            });
        }

    } catch (error) {
        console.error("Export failed:", error);
        await prisma.job.update({
            where: { id: job.id },
            data: { status: "Failed" }
        });
    }

    return redirect("/app");
};

// Mock Data for Sheets
const AVAILABLE_SHEETS = [
    { id: "products", name: "Products", icon: ProductIcon, count: 18, total: 18, columns: "54 of 61 columns", estimate: "11 sec" },
    { id: "smart_collections", name: "Smart Collections", icon: CollectionIcon, count: 1, total: 1, columns: "21 of 26 columns", estimate: "11 sec" },
    { id: "custom_collections", name: "Custom Collections", icon: CollectionIcon, count: 2, total: 2, columns: "21 of 23 columns", estimate: "12 sec" },
    { id: "customers", name: "Customers", icon: PersonIcon, count: 3, total: 3, columns: "43 of 53 columns", estimate: "11 sec" },
    { id: "companies", name: "Companies", icon: WorkIcon, count: 2, total: 2, columns: "0 of 71 columns", estimate: "11 sec", attention: true },
    { id: "discounts", name: "Discounts", icon: DiscountIcon, count: 5, total: 5, columns: "26 of 42 columns", estimate: "14 sec" },
    { id: "draft_orders", name: "Draft Orders", icon: NoteIcon, count: 10, total: 10, columns: "41 of 135 columns", estimate: "11 sec" },
    { id: "orders", name: "Orders", icon: OrderIcon, count: 0, total: 0, columns: "199 of 219 columns", estimate: "10 sec" },
    { id: "payouts", name: "Payouts", icon: CashDollarIcon, count: null, total: null, exportOnly: true, columns: "6 of 20 columns", estimate: "10 sec" },
    { id: "pages", name: "Pages", icon: PageIcon, count: 2, total: 2, columns: "10 of 11 columns", estimate: "11 sec" },
    { id: "blog_posts", name: "Blog Posts", icon: BlogIcon, count: 0, total: 0, columns: "41 of 42 columns", estimate: "10 sec" },
    { id: "redirects", name: "Redirects", icon: ArrowRightIcon, count: 0, total: 0, columns: "4 columns", estimate: "10 sec" },
    { id: "activity", name: "Activity", icon: ViewIcon, count: 141, total: 141, exportOnly: true, columns: "10 columns", estimate: "14 sec" },
    { id: "files", name: "Files", icon: FileIcon, count: null, total: null, columns: "13 of 16 columns", estimate: "10 sec" },
    { id: "metaobjects", name: "Metaobjects", icon: DatabaseIcon, count: 0, total: 0, columns: "0 of 12 columns", estimate: "10 sec", attention: true },
    { id: "menus", name: "Menus", icon: MenuIcon, count: 2, total: 2, columns: "0 of 10 columns", estimate: "11 sec", attention: true },
    { id: "shop", name: "Shop", icon: StoreIcon, count: 1, total: 1, columns: "4 of 33 columns", estimate: "11 sec" },
];

const formatOptions = [
    { label: "Matrixify: Excel", value: "matrixify-excel" },
    { label: "Matrixify: CSV", value: "matrixify-csv" },
    { label: "Google Shopping Data Feed", value: "google-shopping" },
    { label: "eBay: File Exchange - Advanced Template", value: "ebay-file-exchange" },
    { label: "Banggood: Orders CSV", value: "banggood-orders" },
    { label: "TopHatter: Products CSV", value: "tophatter-products" },
    { label: "Würth IT: Orders SAP CSV", value: "wurth-orders" },
    { label: "ITG: Orders SAP CSV", value: "itg-orders" },
    { label: "Swiss Post - Shipping, Sendungsdaten", value: "swiss-post-shipping" },
    { label: "Swiss Post - Custom, Verzollungsfile", value: "swiss-post-custom" },
    { label: "UPS WorldShip XML", value: "ups-worldship" },
    { label: "Soda Studios", value: "soda-studios" },
    { label: "Orders Laser Engraving for CorelDRAW", value: "corel-draw" },
];

const PRODUCTS_COLUMNS = [
    {
        name: "Basic Columns",
        columns: [
            "ID", "Tags", "Published Scope", "Handle", "Tags Command", "Template Suffix", "Command", "Created At", "Gift Card", "Title", "Updated At", "URL", "Body HTML", "Status", "Total Inventory Qty", "Vendor", "Published", "Row #", "Type", "Published At", "Top Row"
        ]
    },
    {
        name: "Category",
        columns: ["Category: ID", "Category: Name", "Category"]
    },
    {
        name: "Collections",
        badge: "Slow",
        columns: ["Custom Collections", "Smart Collections"]
    },
    {
        name: "Media",
        badge: "Slow",
        columns: ["Image Type", "Image Src", "Image Command", "Image Position", "Image Width", "Image Height", "Image Alt Text"]
    },
    {
        name: "Inventory / Variants",
        columns: [
            "Variant Inventory Item ID", "Variant Position", "Variant Tax Code", "Variant ID", "Variant SKU", "Variant Inventory Tracker", "Variant Command", "Variant Barcode", "Variant Inventory Policy", "Option1 Name", "Variant Image", "Variant Fulfillment Service", "Option1 Value", "Variant Weight", "Variant Requires Shipping", "Option2 Name", "Variant Weight Unit", "Variant Shipping Profile", "Option2 Value", "Variant Price", "Variant Inventory Qty", "Option3 Name", "Variant Compare At Price", "Variant Inventory Adjust", "Option3 Value", "Variant Taxable"
        ]
    },
    {
        name: "Variant Cost",
        badge: "Slow",
        columns: ["Variant Cost"]
    },
    {
        name: "Customs Information",
        badge: "Slow",
        columns: ["Variant HS Code", "Variant Country of Origin", "Variant Province of Origin"]
    },
    {
        name: "Multi-Location Inventory Levels",
        badge: "Slow",
        columns: [
            "Inventory Available: ...", "Inventory Damaged Adjust: ...", "Inventory Available Adjust: ...", "Inventory Safety Stock: ...", "Inventory On Hand: ...", "Inventory Safety Stock Adjust: ...", "Inventory On Hand Adjust: ...", "Inventory Quality Control: ...", "Inventory Committed: ...", "Inventory Quality Control Adjust: ...", "Inventory Reserved: ...", "Inventory Incoming: ...", "Inventory Damaged: ..."
        ]
    },
    {
        name: "Pricing by Catalogs",
        badge: "Very Slow",
        columns: ["Included / ...", "Price / ...", "Compare At Price / ..."]
    },
    {
        name: "Metafields",
        badge: "Slow",
        columns: ["Metafield: ..."]
    },
    {
        name: "Variant Metafields",
        badge: "Very Slow",
        columns: ["Variant Metafield: ..."]
    }
];

const TOTAL_PRODUCTS_COLUMNS = PRODUCTS_COLUMNS.reduce((acc, group) => acc + group.columns.length, 0);

export default function NewExport() {
    const navigate = useNavigate();
    const [preset, setPreset] = useState("New Blank Export");
    const [format, setFormat] = useState("matrixify-excel");
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
    const [popoverActive, setPopoverActive] = useState(false);
    const [presetPopoverActive, setPresetPopoverActive] = useState(false);
    const [formatPopoverActive, setFormatPopoverActive] = useState(false);
    const [expandedSheets, setExpandedSheets] = useState<string[]>([]);
    const [optionsOpen, setOptionsOpen] = useState(false);

    // New state for column selection
    const [expandedColumnGroups, setExpandedColumnGroups] = useState<string[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

    const togglePopover = useCallback(
        () => setPopoverActive((popoverActive) => !popoverActive),
        [],
    );

    const handleSheetSelection = useCallback((id: string) => {
        setSelectedSheets((prev) =>
            prev.includes(id) ? prev.filter((sheetId) => sheetId !== id) : [...prev, id]
        );
    }, []);

    const toggleSheetExpansion = useCallback((id: string) => {
        setExpandedSheets((prev) =>
            prev.includes(id) ? prev.filter((sheetId) => sheetId !== id) : [...prev, id]
        );
    }, []);

    const toggleColumnGroup = useCallback((groupName: string) => {
        setExpandedColumnGroups((prev) =>
            prev.includes(groupName) ? prev.filter((name) => name !== groupName) : [...prev, groupName]
        );
    }, []);

    const handleColumnSelection = useCallback((column: string) => {
        setSelectedColumns((prev) =>
            prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
        );
    }, []);

    const handleGroupSelection = useCallback((groupName: string, columns: string[]) => {
        setSelectedColumns((prev) => {
            const allSelected = columns.every((c) => prev.includes(c));
            if (allSelected) {
                return prev.filter((c) => !columns.includes(c));
            } else {
                return [...new Set([...prev, ...columns])];
            }
        });
    }, []);

    const sheetsWithCounts = AVAILABLE_SHEETS.map(sheet => {
        if (sheet.id === 'products') {
            return {
                ...sheet,
                columns: `${selectedColumns.length} of ${TOTAL_PRODUCTS_COLUMNS} columns`
            };
        }
        return sheet;
    });

    const sheetOptions = (
        <div style={{ height: "400px", width: "300px" }}>
            <Box padding="300" borderBlockEndWidth="025" borderColor="border">
                <Checkbox
                    label={`Showing ${AVAILABLE_SHEETS.length} Entities`}
                    checked={selectedSheets.length === AVAILABLE_SHEETS.length}
                    onChange={() => {
                        if (selectedSheets.length === AVAILABLE_SHEETS.length) {
                            setSelectedSheets([]);
                        } else {
                            setSelectedSheets(AVAILABLE_SHEETS.map(s => s.id));
                        }
                    }}
                />
            </Box>
            <Scrollable shadow style={{ height: "calc(100% - 45px)" }}>
                {sheetsWithCounts.map((sheet, index) => (
                    <div
                        key={sheet.id}
                        style={{
                            borderBottom: index < AVAILABLE_SHEETS.length - 1 ? "1px solid #e1e3e5" : "none",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                        className="sheet-option-row"
                        onClick={() => handleSheetSelection(sheet.id)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f2f3"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        <InlineStack align="space-between" blockAlign="center" wrap={false}>
                            <InlineStack gap="300" blockAlign="center" wrap={false}>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        labelHidden
                                        label={sheet.name}
                                        checked={selectedSheets.includes(sheet.id)}
                                        onChange={() => handleSheetSelection(sheet.id)}
                                    />
                                </div>
                                <Icon source={sheet.icon} tone="base" />
                                <Text as="span" variant="bodyMd" fontWeight="semibold">
                                    {sheet.name}
                                </Text>
                            </InlineStack>

                            <InlineStack gap="200" blockAlign="center" wrap={false}>
                                {sheet.exportOnly && (
                                    <div style={{ backgroundColor: "#e3e3e3", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                                        Export Only
                                    </div>
                                )}
                                {sheet.count !== null && (
                                    <div style={{ backgroundColor: "#e3e3e3", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", minWidth: "24px", textAlign: "center" }}>
                                        {sheet.count}
                                    </div>
                                )}
                                {sheet.count === null && !sheet.exportOnly && (
                                    <div style={{ backgroundColor: "#e3e3e3", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", minWidth: "24px", textAlign: "center" }}>
                                        ...
                                    </div>
                                )}
                            </InlineStack>
                        </InlineStack>
                    </div>
                ))}
            </Scrollable>
        </div >
    );

    return (
        <Form method="post">
            <Page>
                <TitleBar title="New Export" />
                <Layout>
                    <Layout.Section>
                        <BlockStack gap="500">
                            {/* Preset Section */}
                            <Card>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingSm">
                                        Preset
                                    </Text>
                                    <InlineStack gap="200" wrap={false}>
                                        <div style={{ flexGrow: 1 }}>
                                            <Popover
                                                active={presetPopoverActive}
                                                activator={
                                                    <Button disclosure fullWidth textAlign="left" onClick={() => setPresetPopoverActive(!presetPopoverActive)}>
                                                        {preset}
                                                    </Button>
                                                }
                                                onClose={() => setPresetPopoverActive(false)}
                                                fullWidth
                                            >
                                                <ActionList
                                                    items={[
                                                        {
                                                            content: 'New Blank Export',
                                                            onAction: () => {
                                                                setPreset('New Blank Export');
                                                                setPresetPopoverActive(false);
                                                            },
                                                            active: preset === 'New Blank Export',
                                                        },
                                                    ]}
                                                />
                                            </Popover>
                                        </div>
                                        <Button>Save As...</Button>
                                    </InlineStack>
                                </BlockStack>
                            </Card>

                            {/* Format Section */}
                            <Card>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingSm">
                                        Format
                                    </Text>
                                    <Popover
                                        active={formatPopoverActive}
                                        activator={
                                            <Button disclosure fullWidth textAlign="left" onClick={() => setFormatPopoverActive(!formatPopoverActive)}>
                                                {formatOptions.find(f => f.value === format)?.label || "Matrixify: Excel"}
                                            </Button>
                                        }
                                        onClose={() => setFormatPopoverActive(false)}
                                        fullWidth
                                    >
                                        <ActionList
                                            items={formatOptions.map(option => ({
                                                content: option.label,
                                                onAction: () => {
                                                    setFormat(option.value);
                                                    setFormatPopoverActive(false);
                                                },
                                                active: format === option.value,
                                            }))}
                                        />
                                    </Popover>
                                </BlockStack>
                            </Card>

                            {/* Sheets Section */}
                            <Card>
                                <BlockStack gap="400">
                                    <InlineStack align="space-between">
                                        <Text as="h2" variant="headingSm">
                                            Sheets
                                        </Text>
                                        <Popover
                                            active={popoverActive}
                                            activator={
                                                <Button onClick={togglePopover} disclosure>
                                                    Select Sheets
                                                </Button>
                                            }
                                            onClose={togglePopover}
                                        >
                                            {sheetOptions}
                                        </Popover>
                                    </InlineStack>

                                    {selectedSheets.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                                            <BlockStack align="center" gap="400">
                                                <div
                                                    style={{
                                                        width: "100px",
                                                        height: "120px",
                                                        backgroundColor: "#e3e3e3",
                                                        borderRadius: "10px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        margin: "0 auto",
                                                    }}
                                                >
                                                    <div style={{ width: "60%", height: "10px", backgroundColor: "white", marginBottom: "10px", borderRadius: "5px" }}></div>
                                                    <div style={{ width: "60%", height: "10px", backgroundColor: "white", marginBottom: "10px", borderRadius: "5px" }}></div>
                                                    <div style={{ width: "60%", height: "10px", backgroundColor: "white", borderRadius: "5px" }}></div>
                                                </div>
                                                <Text as="p" variant="bodyMd" fontWeight="semibold">
                                                    Choose data for your Export file...
                                                </Text>
                                                <div style={{ width: "fit-content", margin: "0 auto" }}>
                                                    <Button variant="primary" onClick={togglePopover}>
                                                        Select Sheets
                                                    </Button>
                                                </div>
                                            </BlockStack>
                                        </div>
                                    ) : (
                                        <BlockStack gap="200">
                                            {sheetsWithCounts.filter((s) => selectedSheets.includes(s.id)).map(
                                                (sheet) => (
                                                    <div
                                                        key={sheet.id}
                                                        style={{
                                                            border: "1px solid #e1e3e5",
                                                            borderRadius: "8px",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding: "12px",
                                                                backgroundColor: "#fff",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => toggleSheetExpansion(sheet.id)}
                                                        >
                                                            <InlineStack align="space-between" blockAlign="center">
                                                                <InlineStack gap="200">
                                                                    <Icon source={sheet.icon} tone="base" />
                                                                    <Text as="span" variant="bodyMd" fontWeight="bold">
                                                                        {sheet.name}
                                                                    </Text>
                                                                    {sheet.attention && (
                                                                        <Badge tone="critical">Attention required!</Badge>
                                                                    )}
                                                                    {sheet.exportOnly && (
                                                                        <Badge>Export Only</Badge>
                                                                    )}
                                                                </InlineStack>

                                                                <InlineStack gap="400">
                                                                    <Badge tone="warning">{sheet.columns}</Badge>
                                                                    <Badge>{`Total: ${sheet.total ?? "..."}`}</Badge>
                                                                    <Badge>{`Estimate: ${sheet.estimate}`}</Badge>
                                                                    <Button
                                                                        icon={expandedSheets.includes(sheet.id) ? ChevronUpIcon : ChevronDownIcon}
                                                                        variant="plain"
                                                                        onClick={() => toggleSheetExpansion(sheet.id)}
                                                                    />
                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                        <Button icon={DeleteIcon} variant="plain" onClick={() => handleSheetSelection(sheet.id)} />
                                                                    </div>
                                                                </InlineStack>
                                                            </InlineStack>
                                                        </div>

                                                        {expandedSheets.includes(sheet.id) && (
                                                            <Box padding="400" background="bg-surface-secondary">
                                                                {sheet.id === 'products' ? (
                                                                    <BlockStack gap="400">
                                                                        <Text as="p" variant="bodySm" tone="subdued">Select Columns</Text>
                                                                        <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                                                                            {PRODUCTS_COLUMNS.map((group, groupIndex) => {
                                                                                const isGroupExpanded = expandedColumnGroups.includes(group.name);
                                                                                const groupColumns = group.columns;
                                                                                const selectedInGroup = groupColumns.filter(c => selectedColumns.includes(c));
                                                                                const isGroupSelected = selectedInGroup.length === groupColumns.length;
                                                                                const isGroupIndeterminate = selectedInGroup.length > 0 && selectedInGroup.length < groupColumns.length;

                                                                                return (
                                                                                    <div key={group.name} style={{ borderBottom: groupIndex < PRODUCTS_COLUMNS.length - 1 ? "1px solid #e1e3e5" : "none" }}>
                                                                                        <div
                                                                                            style={{ padding: "12px 16px", cursor: "pointer", width: "100%" }}
                                                                                            onClick={() => toggleColumnGroup(group.name)}
                                                                                        >
                                                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                                                                                <InlineStack gap="200" blockAlign="center">
                                                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                                                        <Checkbox
                                                                                                            label={group.name}
                                                                                                            checked={isGroupSelected ? true : isGroupIndeterminate ? "indeterminate" : false}
                                                                                                            onChange={() => handleGroupSelection(group.name, groupColumns)}
                                                                                                        />
                                                                                                    </div>
                                                                                                    {group.badge && (
                                                                                                        <Badge tone={group.badge === "Very Slow" ? "critical" : "warning"}>
                                                                                                            {group.badge}
                                                                                                        </Badge>
                                                                                                    )}
                                                                                                </InlineStack>
                                                                                                <Icon source={isGroupExpanded ? ChevronUpIcon : ChevronDownIcon} />
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
                                                                                                            onChange={() => handleColumnSelection(col)}
                                                                                                        />
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>

                                                                        {/* Footer Warning */}
                                                                        {selectedColumns.length === 0 && (
                                                                            <div style={{ backgroundColor: "#fff5ea", padding: "12px", borderRadius: "8px", border: "1px solid #ffe5cc", display: "flex", gap: "8px", alignItems: "center" }}>
                                                                                <div style={{ color: "#b98900" }}>⚠️</div>
                                                                                <Text as="span" tone="warning">Select columns to export</Text>
                                                                            </div>
                                                                        )}

                                                                        <BlockStack gap="200">
                                                                            <Text as="p" variant="bodyMd">Set Filters</Text>
                                                                            <div style={{ width: "fit-content" }}>
                                                                                <Button icon={FilterIcon}>Filter</Button>
                                                                            </div>
                                                                        </BlockStack>

                                                                    </BlockStack>
                                                                ) : (
                                                                    <BlockStack gap="400">
                                                                        <Text as="p" variant="bodySm" tone="subdued">Select Columns</Text>
                                                                        <BlockStack gap="200">
                                                                            <Checkbox label="Basic Columns" checked />
                                                                            <Checkbox label="Category" checked={false} />
                                                                            <Checkbox label="Collections" checked={false} />
                                                                            <Checkbox label="Media" checked />
                                                                            <Checkbox label="Inventory / Variants" checked />
                                                                        </BlockStack>
                                                                        <Divider />
                                                                        <Button icon={FilterIcon}>Filter</Button>
                                                                    </BlockStack>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </BlockStack>
                                    )}
                                </BlockStack>
                            </Card>


                            {/* Options Section */}
                            <Card>
                                <BlockStack gap="200">
                                    <div onClick={() => setOptionsOpen(!optionsOpen)} style={{ cursor: 'pointer' }}>
                                        <InlineStack align="space-between">
                                            <Text as="h2" variant="headingSm">Options</Text>
                                            <Icon source={optionsOpen ? ChevronUpIcon : ChevronDownIcon} />
                                        </InlineStack>
                                    </div>
                                    <Collapsible open={optionsOpen} id="options-collapsible">
                                        <Box paddingBlockStart="400">
                                            <div style={{ backgroundColor: "#f6f6f7", padding: "20px", borderRadius: "8px" }}>
                                                <BlockStack gap="500">
                                                    {/* Scheduling */}
                                                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px", alignItems: "start" }}>
                                                        <Text as="h3" variant="headingSm">Scheduling</Text>
                                                        <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                                                            <BlockStack gap="300">
                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <Checkbox label="Schedule on:" checked={false} onChange={() => { }} />
                                                                    <div style={{ width: "120px" }}>
                                                                        <TextField label="Date" labelHidden value="2025-11-29" onChange={() => { }} autoComplete="off" size="slim" />
                                                                    </div>
                                                                    <Text as="span" variant="bodyMd">, at</Text>
                                                                    <div style={{ width: "60px" }}>
                                                                        <TextField label="Hour" labelHidden value="00" onChange={() => { }} autoComplete="off" size="slim" type="number" />
                                                                    </div>
                                                                    <Text as="span" variant="bodyMd">:</Text>
                                                                    <div style={{ width: "60px" }}>
                                                                        <TextField label="Minute" labelHidden value="00" onChange={() => { }} autoComplete="off" size="slim" type="number" />
                                                                    </div>
                                                                    <Text as="span" variant="bodyMd">America/New_York time</Text>
                                                                </InlineStack>

                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <Checkbox label="Repeat every:" checked={false} onChange={() => { }} />
                                                                    <div style={{ width: "60px" }}>
                                                                        <TextField label="Count" labelHidden value="1" onChange={() => { }} autoComplete="off" size="slim" type="number" />
                                                                    </div>
                                                                    <div style={{ width: "80px" }}>
                                                                        <Select label="Unit" labelHidden options={[{ label: "days", value: "days" }]} value="days" onChange={() => { }} size="slim" />
                                                                    </div>
                                                                    <Text as="span" variant="bodyMd">, run</Text>
                                                                    <div style={{ width: "140px" }}>
                                                                        <Select label="Duration" labelHidden options={[{ label: "until cancelled", value: "until_cancelled" }]} value="until_cancelled" onChange={() => { }} size="slim" />
                                                                    </div>
                                                                    <Text as="span" variant="bodyMd">times</Text>
                                                                </InlineStack>
                                                            </BlockStack>
                                                        </div>
                                                    </div>

                                                    {/* Results File */}
                                                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px", alignItems: "start" }}>
                                                        <Text as="h3" variant="headingSm">Results File</Text>
                                                        <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                                                            <BlockStack gap="300">
                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <div style={{ width: "150px" }}>
                                                                        <Text as="span" variant="bodyMd">Custom file name:</Text>
                                                                    </div>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        <TextField
                                                                            label="Custom file name"
                                                                            labelHidden
                                                                            value="Export_%Y-%m-%d_%H%M%S"
                                                                            onChange={() => { }}
                                                                            autoComplete="off"
                                                                            size="slim"
                                                                        />
                                                                    </div>
                                                                    <Link url="#">Dynamic placeholders</Link>
                                                                </InlineStack>

                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <div style={{ width: "150px" }}>
                                                                        <Text as="span" variant="bodyMd">File name time source:</Text>
                                                                    </div>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        <Select
                                                                            label="File name time source"
                                                                            labelHidden
                                                                            options={[{ label: "Started At (Default)", value: "started_at" }]}
                                                                            value="started_at"
                                                                            onChange={() => { }}
                                                                            size="slim"
                                                                        />
                                                                    </div>
                                                                </InlineStack>

                                                                <Checkbox
                                                                    label="Do not generate Results file if there is no data"
                                                                    checked={false}
                                                                    onChange={() => { }}
                                                                />

                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <div style={{ width: "150px" }}>
                                                                        <Text as="span" variant="bodyMd">Upload to:</Text>
                                                                    </div>
                                                                    <div style={{ width: "120px" }}>
                                                                        <Select
                                                                            label="Upload destination"
                                                                            labelHidden
                                                                            options={[{ label: "Full URL", value: "full_url" }]}
                                                                            value="full_url"
                                                                            onChange={() => { }}
                                                                            size="slim"
                                                                        />
                                                                    </div>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        <TextField
                                                                            label="Upload URL"
                                                                            labelHidden
                                                                            value=""
                                                                            onChange={() => { }}
                                                                            placeholder="scheme://user:password@serverport/path/to/folder/"
                                                                            autoComplete="off"
                                                                            size="slim"
                                                                        />
                                                                    </div>
                                                                </InlineStack>
                                                            </BlockStack>
                                                        </div>
                                                    </div>

                                                    {/* Sorting */}
                                                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px", alignItems: "start" }}>
                                                        <Text as="h3" variant="headingSm">Sorting</Text>
                                                        <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                                                            <Checkbox
                                                                label="Export items sorted in the order as they come from Shopify"
                                                                checked={false}
                                                                onChange={() => { }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Formatting */}
                                                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px", alignItems: "start" }}>
                                                        <Text as="h3" variant="headingSm">Formatting</Text>
                                                        <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                                                            <BlockStack gap="300">
                                                                <Checkbox
                                                                    label="Format date columns as Excel date-time without timezone"
                                                                    checked={false}
                                                                    onChange={() => { }}
                                                                />

                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <div style={{ width: "180px" }}>
                                                                        <Text as="span" variant="bodyMd">Time format:</Text>
                                                                    </div>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        <Select
                                                                            label="Time format"
                                                                            labelHidden
                                                                            options={[{ label: "2025-11-29 07:44:18 -0500 (Default ISO)", value: "default_iso" }]}
                                                                            value="default_iso"
                                                                            onChange={() => { }}
                                                                            size="slim"
                                                                        />
                                                                    </div>
                                                                </InlineStack>

                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <div style={{ width: "180px" }}>
                                                                        <Text as="span" variant="bodyMd">Prefix values with ' (apostrophe):</Text>
                                                                    </div>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        <Select
                                                                            label="Prefix values"
                                                                            labelHidden
                                                                            options={[{ label: "Phone numbers", value: "phone_numbers" }]}
                                                                            value="phone_numbers"
                                                                            onChange={() => { }}
                                                                            size="slim"
                                                                        />
                                                                    </div>
                                                                </InlineStack>
                                                            </BlockStack>
                                                        </div>
                                                    </div>
                                                </BlockStack>
                                            </div>
                                        </Box>
                                    </Collapsible>
                                </BlockStack>
                            </Card>

                            <Box paddingBlockEnd="500">
                                <InlineStack align="end" gap="200">
                                    <Button onClick={() => navigate("/app")}>Back</Button>
                                    <Button variant="primary" submit>Export</Button>
                                </InlineStack>
                            </Box>

                            {/* Hidden inputs for form submission */}
                            <input type="hidden" name="sheets" value={JSON.stringify(selectedSheets)} />
                            <input type="hidden" name="columns" value={JSON.stringify(selectedColumns)} />
                            <input type="hidden" name="format" value={format} />
                        </BlockStack>
                    </Layout.Section>
                </Layout>
            </Page>
        </Form>
    );
}
