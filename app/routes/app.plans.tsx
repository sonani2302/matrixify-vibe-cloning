import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    Button,
    InlineStack,
    Box,
    Badge,
    Grid,
    List
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CheckIcon } from "@shopify/polaris-icons";

export default function PlansPage() {
    return (
        <Page>
            <TitleBar title="Plans & Subscription" />
            <Layout>
                <Layout.Section>
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <Text as="h1" variant="headingXl">Choose the right plan for your business</Text>
                        <Text as="p" variant="bodyLg" tone="subdued">Upgrade or downgrade at any time.</Text>
                    </div>
                </Layout.Section>

                <Layout.Section>
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="400">
                                    <BlockStack gap="200">
                                        <Text as="h2" variant="headingLg">Demo</Text>
                                        <Text as="h3" variant="heading2xl">$0<Text as="span" variant="bodySm" tone="subdued">/month</Text></Text>
                                        <Badge tone="success">Current Plan</Badge>
                                    </BlockStack>
                                    <Box minHeight="200px">
                                        <BlockStack gap="300">
                                            <Text as="p" variant="bodyMd">For testing and small stores.</Text>
                                            <List type="bullet">
                                                <List.Item>10 items per file</List.Item>
                                                <List.Item>1 GB storage</List.Item>
                                                <List.Item>Standard support</List.Item>
                                            </List>
                                        </BlockStack>
                                    </Box>
                                    <Button disabled fullWidth>Current Plan</Button>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="400">
                                    <BlockStack gap="200">
                                        <Text as="h2" variant="headingLg">Basic</Text>
                                        <Text as="h3" variant="heading2xl">$20<Text as="span" variant="bodySm" tone="subdued">/month</Text></Text>
                                    </BlockStack>
                                    <Box minHeight="200px">
                                        <BlockStack gap="300">
                                            <Text as="p" variant="bodyMd">For growing businesses.</Text>
                                            <List type="bullet">
                                                <List.Item>5,000 items per file</List.Item>
                                                <List.Item>10 GB storage</List.Item>
                                                <List.Item>Priority support</List.Item>
                                                <List.Item>FTP/SFTP integration</List.Item>
                                            </List>
                                        </BlockStack>
                                    </Box>
                                    <Button variant="primary" fullWidth>Upgrade</Button>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="400">
                                    <BlockStack gap="200">
                                        <Text as="h2" variant="headingLg">Big</Text>
                                        <Text as="h3" variant="heading2xl">$50<Text as="span" variant="bodySm" tone="subdued">/month</Text></Text>
                                    </BlockStack>
                                    <Box minHeight="200px">
                                        <BlockStack gap="300">
                                            <Text as="p" variant="bodyMd">For high volume stores.</Text>
                                            <List type="bullet">
                                                <List.Item>Unlimited items</List.Item>
                                                <List.Item>100 GB storage</List.Item>
                                                <List.Item>Dedicated support</List.Item>
                                                <List.Item>Google Sheets integration</List.Item>
                                                <List.Item>Scheduled tasks</List.Item>
                                            </List>
                                        </BlockStack>
                                    </Box>
                                    <Button variant="primary" fullWidth>Upgrade</Button>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
