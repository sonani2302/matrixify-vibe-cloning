import {
    Card,
    Text,
    Badge,
    Icon,
} from "@shopify/polaris";
import { ExportIcon, ImportIcon } from "@shopify/polaris-icons";
import { useNavigate } from "react-router";
import { useState } from "react";

const CustomLink = ({ url, children, download, target }: any) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <a
            href={url}
            download={download}
            target={target}
            rel={target === "_blank" ? "noopener noreferrer" : undefined}
            style={{
                textDecoration: isHovered ? "underline" : "none",
                color: "#005bd3",
                cursor: "pointer",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
        </a>
    );
};

export function JobList({ jobs }: { jobs: any[] }) {
    const navigate = useNavigate();

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

    const parseJobDetails = (job: any) => {
        try {
            const details = JSON.parse(job.details || "{}");
            return {
                file: details.file,
                fileName: details.fileName,
                format: details.format || "matrixify-excel",
                sheets: details.sheets || [],
                columns: details.columns || [],
                error: details.error,
            };
        } catch {
            return {
                file: null,
                fileName: null,
                format: "matrixify-excel",
                sheets: [],
                columns: [],
                error: null,
            };
        }
    };

    const formatDuration = (createdAt: string) => {
        // Placeholder logic
        return "7 sec";
    };

    return (
        <Card padding="0">
            {jobs.map((job: any, index: number) => {
                const details = parseJobDetails(job);
                const exportedCount = 10; // Placeholder
                const totalCount = 17; // Placeholder
                const limitedCount = 0; // Placeholder

                return (
                    <div
                        key={job.id}
                        style={{
                            padding: "16px",
                            borderBottom: index < jobs.length - 1 ? "1px solid #E1E3E5" : "none",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                        }}
                        onClick={() => navigate(`/app/job/${job.id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f6f6f7"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

                            {/* Left Column: Icon, Type, ID */}
                            <div style={{ width: "100px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: "#E3E3E3",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "4px"
                                }}>
                                    <Icon source={job.type === "Export" ? ExportIcon : ImportIcon} tone="base" />
                                </div>
                                <Text as="span" variant="bodySm" tone="subdued">
                                    {job.type}
                                </Text>
                                <CustomLink url="#">
                                    <Text as="span" variant="bodySm">#{job.id}</Text>
                                </CustomLink>
                            </div>

                            {/* Middle Column: Details */}
                            <div style={{ flexGrow: 1, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <Text as="h3" variant="headingMd" fontWeight="bold">
                                    {job.entity}
                                </Text>

                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <Badge>{totalCount.toString()}</Badge>
                                    {job.status === "Finished" && (
                                        <Badge tone="success">
                                            {`Exported: ${exportedCount}`}
                                        </Badge>
                                    )}
                                    {limitedCount > 0 && (
                                        <Badge tone="warning">
                                            {`Limited: ${limitedCount}`}
                                        </Badge>
                                    )}
                                </div>

                                <Text as="p" variant="bodySm" tone="subdued">
                                    {formatDate(job.createdAt)} Duration: {formatDuration(job.createdAt)}
                                </Text>
                            </div>

                            {/* Right Column: Status and Download */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                                <Badge>Matrixify: Excel</Badge>

                                <Badge tone={getStatusTone(job.status) as any}>
                                    {job.status === "Finished" && limitedCount > 0
                                        ? "Finished / Limited"
                                        : job.status}
                                </Badge>

                                {job.status === "Failed" && details.error && (
                                    <div style={{ maxWidth: "200px", textAlign: "right" }}>
                                        <Text as="span" tone="critical" variant="bodySm">
                                            {details.error}
                                        </Text>
                                    </div>
                                )}

                                {job.status === "Finished" && details.file && (
                                    <CustomLink
                                        url={details.file}
                                        target="_blank"
                                        download={details.fileName || "Export.xlsx"}
                                    >
                                        <Text as="span" variant="bodySm">
                                            {details.fileName || "Export.xlsx"}
                                        </Text>
                                    </CustomLink>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </Card>
    );
}
