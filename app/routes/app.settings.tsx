import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    Button,
    InlineStack,
    Box,
    RadioButton,
    TextField,
    Banner,
    Icon,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect } from "react";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { DeleteIcon, LockIcon, NotificationIcon, StoreIcon, DatabaseIcon, KeyIcon, TextIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: { request: Request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    let settings = await prisma.settings.findUnique({
        where: { shop },
    });

    if (!settings) {
        settings = await prisma.settings.create({
            data: {
                shop,
                fileErasure: "keep_all",
                erasureDays: 90,
            },
        });
    }

    return { settings };
};

export const action = async ({ request }: { request: Request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();
    const fileErasure = formData.get("fileErasure") as string;
    const erasureDays = parseInt(formData.get("erasureDays") as string, 10);

    await prisma.settings.update({
        where: { shop },
        data: {
            fileErasure,
            erasureDays,
        },
    });

    return { status: "success" };
};

export default function SettingsPage() {
    const { settings } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    const [fileErasure, setFileErasure] = useState(settings.fileErasure);
    const [erasureDays, setErasureDays] = useState(settings.erasureDays.toString());
    const [activeItem, setActiveItem] = useState("job_files_erasure");

    useEffect(() => {
        if (actionData?.status === "success") {
            shopify.toast.show("Settings saved");
        }
    }, [actionData]);

    const handleSave = () => {
        submit({ fileErasure, erasureDays }, { method: "post" });
    };

    const handleEraseAll = () => {
        // Placeholder for erase all functionality
        console.log("Request to erase all files");
        shopify.toast.show("Request sent to erase all files");
    };

    const menuItems = [
        { id: "security", label: "Security", icon: LockIcon },
        { id: "notifications", label: "Notifications", icon: NotificationIcon },
        { id: "shop_sponsoring", label: "Shop Sponsoring", icon: StoreIcon },
        { id: "servers", label: "Servers", icon: DatabaseIcon },
        { id: "job_files_erasure", label: "Job Files Erasure", icon: DeleteIcon },
        { id: "shopify_api_scopes", label: "Shopify API Access Scopes", icon: KeyIcon },
        { id: "approved_documents", label: "Approved Documents", icon: TextIcon },
    ];

    return (
        <Page>
            <TitleBar title="Settings" />
            <Layout>
                <Layout.Section variant="oneThird">
                    <Card padding="0">
                        <div style={{ padding: "8px" }}>
                            <BlockStack gap="100">
                                {menuItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setActiveItem(item.id)}
                                        style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            backgroundColor: activeItem === item.id ? "#f1f2f3" : "transparent",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: activeItem === item.id ? "#202223" : "#5c5f62",
                                            fontWeight: activeItem === item.id ? 600 : 400,
                                        }}
                                    >
                                        <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Icon source={item.icon} tone={activeItem === item.id ? "base" : "subdued"} />
                                        </div>
                                        <Text as="span" variant="bodyMd">{item.label}</Text>
                                    </div>
                                ))}
                            </BlockStack>
                        </div>
                        <Box padding="400">
                            <Text as="p" variant="bodySm" tone="subdued">
                                <a href="#" style={{ color: "#005bd3", textDecoration: "none" }}>Read more about Settings</a>
                            </Text>
                        </Box>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    {activeItem === "job_files_erasure" && (
                        <BlockStack gap="400">
                            <BlockStack gap="200">
                                <InlineStack gap="200" align="start" blockAlign="center">
                                    <Icon source={DeleteIcon} tone="base" />
                                    <Text as="h2" variant="headingLg">Job Files Erasure</Text>
                                </InlineStack>
                                <Text as="p" variant="bodyMd">
                                    Control what happens to the data files that are attached to all the Export/Import jobs. Regardless of those settings, all the data files for all jobs are automatically deleted one month after uninstalling the Matrixify app. Read more in the T&C <a href="#" style={{ color: "#005bd3" }}>Data Processing Addendum</a>. Deleted files are not recoverable.
                                </Text>
                            </BlockStack>

                            <Banner tone="warning">
                                <p>Please note that if you raise any issue with Matrixify Support, we will not be able to access any of deleted files.</p>
                            </Banner>

                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h3" variant="headingSm">Rolling erasure of job files</Text>
                                    <BlockStack gap="200">
                                        <RadioButton
                                            label="Keep all history"
                                            checked={fileErasure === "keep_all"}
                                            id="keep_all"
                                            name="fileErasure"
                                            onChange={() => {
                                                setFileErasure("keep_all");
                                                // Auto-save when switching to keep_all
                                                submit({ fileErasure: "keep_all", erasureDays }, { method: "post" });
                                            }}
                                        />
                                        <InlineStack align="start" blockAlign="center" gap="200">
                                            <RadioButton
                                                label="Erase older than"
                                                checked={fileErasure === "erase_older_than"}
                                                id="erase_older_than"
                                                name="fileErasure"
                                                onChange={() => setFileErasure("erase_older_than")}
                                            />
                                            <div style={{ width: "80px" }}>
                                                <TextField
                                                    label="Days"
                                                    labelHidden
                                                    type="number"
                                                    value={erasureDays}
                                                    onChange={(value) => setErasureDays(value)}
                                                    autoComplete="off"
                                                    disabled={fileErasure !== "erase_older_than"}
                                                    onBlur={() => {
                                                        if (fileErasure === "erase_older_than") {
                                                            submit({ fileErasure, erasureDays }, { method: "post" });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <Text as="span" variant="bodyMd">days</Text>
                                        </InlineStack>
                                    </BlockStack>
                                </BlockStack>
                            </Card>

                            <Card>
                                <BlockStack gap="400">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <Text as="h3" variant="headingSm">Erase files for all jobs</Text>
                                        <Button variant="primary" tone="critical" onClick={handleEraseAll}>Request to erase all files</Button>
                                    </InlineStack>
                                </BlockStack>
                            </Card>
                        </BlockStack>
                    )}
                    {activeItem !== "job_files_erasure" && (
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">{menuItems.find(i => i.id === activeItem)?.label}</Text>
                                <Text as="p" tone="subdued">This section is not implemented yet.</Text>
                            </BlockStack>
                        </Card>
                    )}
                </Layout.Section>
            </Layout>
        </Page>
    );
}
