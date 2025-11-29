import { Page, Card, Text, IndexTable, Badge, useIndexResourceState } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: { request: Request }) => {
    await authenticate.admin(request);
    const jobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" },
    });
    return { jobs };
};

export default function AllJobsPage() {
    const { jobs } = useLoaderData<typeof loader>();

    const resourceName = {
        singular: 'job',
        plural: 'jobs',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(jobs as any);

    const rowMarkup = jobs.map(
        (job: any, index: number) => (
            <IndexTable.Row
                id={job.id}
                key={job.id}
                selected={selectedResources.includes(job.id)}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {job.id.substring(0, 8)}...
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{job.type}</IndexTable.Cell>
                <IndexTable.Cell>{job.entity}</IndexTable.Cell>
                <IndexTable.Cell>
                    <Badge tone={job.status === "Finished" ? "success" : job.status === "Queued" ? "info" : "critical"}>
                        {job.status}
                    </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    {new Date(job.createdAt).toLocaleString()}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    {(() => {
                        try {
                            const details = JSON.parse(job.details || "{}");
                            if (job.status === "Finished" && details.file) {
                                return (
                                    <a href={details.file} download target="_blank" rel="noreferrer" style={{ color: "#008060", textDecoration: "none", fontWeight: "bold" }}>
                                        Download
                                    </a>
                                );
                            }
                        } catch (e) {
                            return null;
                        }
                        return null;
                    })()}
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Page>
            <TitleBar title="All Jobs" />
            <Card padding="0">
                <IndexTable
                    resourceName={resourceName}
                    itemCount={jobs.length}
                    selectedItemsCount={
                        allResourcesSelected ? 'All' : selectedResources.length
                    }
                    onSelectionChange={handleSelectionChange}
                    headings={[
                        { title: 'ID' },
                        { title: 'Type' },
                        { title: 'Entity' },
                        { title: 'Status' },
                        { title: 'Created At' },
                        { title: 'Download' },
                    ]}
                >
                    {rowMarkup}
                </IndexTable>
            </Card>
        </Page>
    );
}
