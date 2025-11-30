import { useLoaderData, useNavigate, useFetcher } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    InlineStack,
    Button,
    Text,
    Badge,
    Banner,
    Icon,
    Divider,
} from "@shopify/polaris";
import {
    ProductIcon,
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
    ChevronUpIcon,
    ChevronDownIcon,
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect } from "react";
import { ColumnSelector } from "../components/ColumnSelector";
import { AVAILABLE_SHEETS } from "../constants/exportData";

const ICON_MAP: any = {
    ProductIcon,
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
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    const { id } = params;

    const job = await prisma.job.findUnique({
        where: { id: id as string },
        select: {
            id: true,
            type: true,
            entity: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            details: true,
            progress: true,
            totalItems: true,
            processedItems: true
        }
    });

    if (!job) {
        throw new Response("Job not found", { status: 404 });
    }

    let details;
    try {
        details = JSON.parse(job.details || "{}");
    } catch {
        details = {};
    }

    return { job, details };
};

export default function JobDetails() {
    const { job: initialJob, details } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const [expandedSheets, setExpandedSheets] = useState<string[]>([]);
    const [expandedColumnGroups, setExpandedColumnGroups] = useState<string[]>([]);

    // Use fetcher data if available, otherwise use initial job data
    const job = fetcher.data?.job || initialJob;

    // Poll for progress updates when job is processing
    useEffect(() => {
        if (job.status === "Processing") {
            const interval = setInterval(() => {
                fetcher.load(`/api/job/${job.id}/progress`);
            }, 2000); // Poll every 2 seconds

            return () => clearInterval(interval);
        }
    }, [job.status, job.id, fetcher]);

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

    const getStatusTone = (status: string) => {
        switch (status) {
            case "Finished":
                return "success";
            case "Queued":
                return "info";
            case "Failed":
                return "critical";
            case "Cancelled":
                return "attention";
            default:
                return undefined;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const getBannerMessage = () => {
        if (job.status === "Cancelled") {
            return "Export Cancelled";
        }
        if (job.status === "Failed") {
            return `Export Failed${details.error ? `: ${details.error}` : ""}`;
        }
        if (job.status === "Finished") {
            return "Export Completed Successfully";
        }
        return null;
    };

    const handleExportAgain = () => {
        const params = new URLSearchParams({
            sheets: JSON.stringify(details.sheets || []),
            columns: JSON.stringify(details.columns || []),
            format: details.format || "matrixify-excel"
        });
        navigate(`/app/export?${params.toString()}`);
    };

    const bannerMessage = getBannerMessage();

    return (
        <Page>
            <TitleBar title={`Export: #${job.id}`} />
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                        {/* Action Buttons */}
                        <InlineStack align="space-between">
                            <Button onClick={() => navigate("/app/all-jobs")}>Back</Button>
                            <InlineStack gap="200">
                                <Button onClick={handleExportAgain}>Export Again</Button>
                                {job.status === "Finished" && details.file && (
                                    <a
                                        href={details.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={details.fileName || "Export.xlsx"}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Button variant="primary">Download Exported File</Button>
                                    </a>
                                )}
                            </InlineStack>
                        </InlineStack>

                        {/* Status Banner */}
                        {bannerMessage && (
                            <Banner
                                tone={job.status === "Cancelled" ? "warning" : job.status === "Failed" ? "critical" : "success"}
                            >
                                {bannerMessage}
                            </Banner>
                        )}

                        {/* Progress Bar - Show when Processing */}
                        {job.status === "Processing" && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">
                                        Export Progress
                                    </Text>

                                    {/* Progress Bar */}
                                    <div style={{
                                        width: "100%",
                                        height: "24px",
                                        backgroundColor: "#e1e3e5",
                                        borderRadius: "12px",
                                        overflow: "hidden"
                                    }}>
                                        <div style={{
                                            width: `${job.progress || 0}%`,
                                            height: "100%",
                                            backgroundColor: "#008060",
                                            transition: "width 0.3s ease"
                                        }} />
                                    </div>

                                    {/* Progress Text */}
                                    <InlineStack align="space-between">
                                        <Text as="p" variant="bodyMd">
                                            {job.processedItems || 0} of {job.totalItems || 0} products processed
                                        </Text>
                                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                                            {job.progress || 0}%
                                        </Text>
                                    </InlineStack>
                                </BlockStack>
                            </Card>
                        )}

                        {/* Metadata Card */}
                        <Card>
                            <BlockStack gap="400">
                                <InlineStack align="space-between" blockAlign="center">
                                    <Text as="h2" variant="headingMd">Job Details</Text>
                                    <Badge tone={getStatusTone(job.status) as any}>{job.status}</Badge>
                                </InlineStack>
                                <Divider />
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                                    <div>
                                        <Text as="p" variant="bodySm" tone="subdued">ID</Text>
                                        <Text as="p" variant="bodyMd">#{job.id}</Text>
                                    </div>
                                    <div>
                                        <Text as="p" variant="bodySm" tone="subdued">Format</Text>
                                        <Text as="p" variant="bodyMd">{details.format || "Matrixify: Excel"}</Text>
                                    </div>
                                    <div>
                                        <Text as="p" variant="bodySm" tone="subdued">Started At</Text>
                                        <Text as="p" variant="bodyMd">{formatDate(job.createdAt)}</Text>
                                    </div>
                                    <div>
                                        <Text as="p" variant="bodySm" tone="subdued">Entity</Text>
                                        <Text as="p" variant="bodyMd">{job.entity}</Text>
                                    </div>
                                    {details.fileName && (
                                        <div>
                                            <Text as="p" variant="bodySm" tone="subdued">File Name</Text>
                                            <Text as="p" variant="bodyMd">{details.fileName}</Text>
                                        </div>
                                    )}
                                </div>
                            </BlockStack>
                        </Card>

                        {/* Sheets Section */}
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">Sheets</Text>
                                <BlockStack gap="200">
                                    {AVAILABLE_SHEETS.filter((s) => details.sheets?.includes(s.id)).map((sheet) => {
                                        const IconComponent = ICON_MAP[sheet.icon];
                                        return (
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
                                                            <Icon source={IconComponent} tone="base" />
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
                                                        <Button
                                                            icon={expandedSheets.includes(sheet.id) ? ChevronUpIcon : ChevronDownIcon}
                                                            variant="plain"
                                                            onClick={() => toggleSheetExpansion(sheet.id)}
                                                        />
                                                    </InlineStack>
                                                </div>

                                                {expandedSheets.includes(sheet.id) && sheet.id === 'products' && details.columns && (
                                                    <div style={{ padding: "16px", backgroundColor: "#f6f6f7" }}>
                                                        <ColumnSelector
                                                            selectedColumns={details.columns || []}
                                                            expandedGroups={expandedColumnGroups}
                                                            onGroupToggle={toggleColumnGroup}
                                                            readOnly={true}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </BlockStack>
                            </BlockStack>
                        </Card>
                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
