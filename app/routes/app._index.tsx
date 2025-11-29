import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Text,
  DropZone,
  TextField,
  Banner,
  Badge,
  Icon,
  Link,
  Popover,
  ActionList,
} from "@shopify/polaris";
import {
  ExportIcon,
  ImportIcon,
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: { request: Request }) => {
  await authenticate.admin(request);
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 5, // Show last 5 jobs on home page
  });
  return { jobs };
};

export default function Index() {
  const { jobs: prismaJobs } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [urlPopoverActive, setUrlPopoverActive] = useState(false);

  const handleDrop = useCallback(
    (_droppedFiles: File[], acceptedFiles: File[], _rejectedFiles: File[]) => {
      setFiles((files) => [...files, ...acceptedFiles]);
    },
    [],
  );

  const handleUrlChange = useCallback((value: string) => setUrl(value), []);

  // Map Prisma jobs to the display format, merging with mock data for missing fields if needed
  const jobs = prismaJobs.map((job: any) => {
    let resultFile = null;
    try {
      const details = JSON.parse(job.details || "{}");
      if (job.status === "Finished" && details.file) {
        resultFile = details.file;
      }
    } catch (e) {
      // ignore
    }

    return {
      id: job.id,
      type: job.type,
      entity: job.entity,
      status: job.status,
      statusTone: job.status === "Finished" ? "success" : job.status === "Queued" ? "info" : "critical",
      date: new Date(job.createdAt).toLocaleString(),
      duration: "0 sec", // Placeholder
      progress: job.status === "Finished" ? 100 : 0,
      processed: 0,
      total: 0,
      new: 0,
      updated: 0,
      failed: 0,
      file: "Export.xlsx", // Placeholder
      resultFile: resultFile,
    };
  });


  return (
    <Page>
      <TitleBar title="Matrixify - Demo" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Export Section */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Export
                </Text>
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      You will be able to select the particular data items to export.
                    </Text>
                    <div style={{ width: "fit-content" }}>
                      <Button variant="primary" onClick={() => navigate("/app/export")}>New Export</Button>
                    </div>
                  </BlockStack>
                  <div style={{ opacity: 0.3 }}>
                    <Icon source={ExportIcon} tone="base" />
                  </div>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Import Section */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Import
                  </Text>
                  <Link url="#">Help</Link>
                </InlineStack>

                <DropZone onDrop={handleDrop} variableHeight>
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon source={ImportIcon} tone="base" />
                    </div>
                    <Button variant="primary">Add files</Button>
                    <div style={{ marginTop: '12px' }}>
                      <Text as="p" variant="bodySm" tone="subdued">
                        or drop a file to upload
                      </Text>
                    </div>
                  </div>
                </DropZone>

                <InlineStack gap="300" wrap={false}>
                  <Popover
                    active={urlPopoverActive}
                    activator={
                      <Button disclosure onClick={() => setUrlPopoverActive(!urlPopoverActive)}>
                        Full URL
                      </Button>
                    }
                    onClose={() => setUrlPopoverActive(false)}
                  >
                    <ActionList
                      items={[
                        { content: 'Full URL', onAction: () => setUrlPopoverActive(false) },
                        { content: 'Add New Server', onAction: () => setUrlPopoverActive(false) },
                      ]}
                    />
                  </Popover>
                  <div style={{ flexGrow: 1 }}>
                    <TextField
                      label="URL"
                      labelHidden
                      value={url}
                      onChange={handleUrlChange}
                      placeholder="URL to a file or directory (can use dynamic placeholders like %Y-%m-%d)"
                      autoComplete="off"
                    />
                  </div>
                  <Button disabled={!url}>Upload from URL</Button>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Scheduled Jobs Banner */}
            <Banner tone="info">
              <p>You have 0 scheduled jobs.</p>
            </Banner>

            {/* Jobs List */}
            <BlockStack gap="400">
              {jobs.map((job: any) => (
                <Card key={job.id}>
                  <InlineStack align="space-between" wrap={false} gap="400">
                    {/* Icon Column */}
                    <div style={{ minWidth: "40px" }}>
                      <div
                        style={{
                          background: "#e3e3e3",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon source={ImportIcon} tone="subdued" />
                      </div>
                      <div style={{ textAlign: "center", marginTop: "4px" }}>
                        <Text as="span" variant="bodyXs" tone="subdued">
                          {job.type}
                        </Text>
                        <br />
                        <Link url="#">#{job.id}</Link>
                      </div>
                    </div>

                    {/* Main Content Column */}
                    <div style={{ flexGrow: 1 }}>
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Text as="h3" variant="headingSm">
                            {job.entity || "Unknown"}
                          </Text>
                          <Badge tone={job.statusTone as any}>{job.status}</Badge>
                        </InlineStack>

                        {job.status !== "Cancelled" && (
                          <InlineStack gap="200">
                            <Badge tone="info">{`${job.processed || 0} of ${job.total || 0}`}</Badge>
                            {job.new && job.new > 0 ? <Badge tone="success">{`New: ${job.new}`}</Badge> : null}
                            {job.updated && job.updated > 0 ? <Badge tone="success">{`Updated: ${job.updated}`}</Badge> : null}
                            {job.warnings ? <Badge tone="warning">{`Warnings: ${job.warnings}`}</Badge> : null}
                          </InlineStack>
                        )}

                        <Text as="p" variant="bodyXs" tone="subdued">
                          {job.date} {job.duration && `Duration: ${job.duration}`}
                        </Text>
                      </BlockStack>
                    </div>

                    {/* Actions/Files Column */}
                    <div style={{ textAlign: "right", minWidth: "150px" }}>
                      <BlockStack gap="100" align="end">
                        <Badge>Matrixify</Badge>
                        {job.status === "Finished" && (
                          <Badge tone="warning">Finished / Limited</Badge>
                        )}
                        {job.status === "Cancelled" && (
                          <Badge tone="critical">Cancelled</Badge>
                        )}

                        <Link url="#" removeUnderline>{job.file}</Link>
                        {job.resultFile && (
                          <a href={job.resultFile} download style={{ color: "#008060", textDecoration: "none", fontSize: "12px" }}>
                            Download Result
                          </a>
                        )}
                      </BlockStack>
                    </div>
                  </InlineStack>
                </Card>
              ))}
            </BlockStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
