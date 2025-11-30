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
import { JobList } from "../components/JobList";

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
              <JobList jobs={prismaJobs} />
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <Button variant="plain" onClick={() => navigate("/app/all-jobs")}>View all Jobs</Button>
              </div>
            </BlockStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
