import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    TextField,
    Select,
    Checkbox,
    Button,
    InlineStack,
    Divider,
    Box
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";

export default function SettingsPage() {
    const [email, setEmail] = useState("user@example.com");
    const [notifyOnFinish, setNotifyOnFinish] = useState(true);
    const [defaultFormat, setDefaultFormat] = useState("matrixify-excel");
    const [autoDeleteFiles, setAutoDeleteFiles] = useState(false);

    const handleSave = useCallback(() => {
        shopify.toast.show("Settings saved");
    }, []);

    const formatOptions = [
        { label: "Matrixify: Excel", value: "matrixify-excel" },
        { label: "Matrixify: CSV", value: "matrixify-csv" },
    ];

    return (
        <Page>
            <TitleBar title="Settings" />
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">General Settings</Text>
                                <TextField
                                    label="Notification Email"
                                    value={email}
                                    onChange={setEmail}
                                    autoComplete="email"
                                    helpText="We will send job completion notifications to this email."
                                />
                                <Checkbox
                                    label="Notify when job finishes"
                                    checked={notifyOnFinish}
                                    onChange={setNotifyOnFinish}
                                />
                            </BlockStack>
                        </Card>

                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">Export Defaults</Text>
                                <Select
                                    label="Default Export Format"
                                    options={formatOptions}
                                    value={defaultFormat}
                                    onChange={setDefaultFormat}
                                />
                                <Checkbox
                                    label="Auto-delete export files after 30 days"
                                    checked={autoDeleteFiles}
                                    onChange={setAutoDeleteFiles}
                                    helpText="Automatically remove old export files to save storage space."
                                />
                            </BlockStack>
                        </Card>

                        <Box paddingBlockEnd="500">
                            <InlineStack align="end">
                                <Button variant="primary" onClick={handleSave}>Save Settings</Button>
                            </InlineStack>
                        </Box>
                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
