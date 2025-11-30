import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Page, Layout, Card, Text, Button, Form } from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    const jobs = await prisma.job.findMany();
    return { jobs };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    const jobs = await prisma.job.findMany();

    let count = 0;
    for (const job of jobs) {
        // Check if ID is already 10 digits
        if (!/^\d{10}$/.test(job.id)) {
            const newId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

            // Create new job with new ID
            await prisma.job.create({
                data: {
                    id: newId,
                    type: job.type,
                    entity: job.entity,
                    status: job.status,
                    createdAt: job.createdAt,
                    updatedAt: job.updatedAt,
                    details: job.details,
                }
            });

            // Delete old job
            await prisma.job.delete({
                where: { id: job.id }
            });
            count++;
        }
    }

    return { count };
};

export default function MigrateIds() {
    const { jobs } = useLoaderData<typeof loader>();

    return (
        <Page title="Migrate Job IDs">
            <Layout>
                <Layout.Section>
                    <Card>
                        <Text as="p" variant="bodyMd">
                            Found {jobs.length} jobs. Click below to migrate non-10-digit IDs.
                        </Text>
                        <br />
                        <Form method="post">
                            <Button submit variant="primary">Migrate IDs</Button>
                        </Form>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
