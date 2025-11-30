import { useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
    Page,
    Card,
    BlockStack,
    InlineStack,
    Text,
    TextField,
    Button,
    Icon,
    Popover,
    ActionList,
    OptionList,
    LegacyCard,
    ChoiceList,
    Select,
    Tag,
} from "@shopify/polaris";
import { XIcon, PlusIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { JobList } from "../components/JobList";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);

    // Migration Logic: Update old IDs to 10-digit format
    const allJobs = await prisma.job.findMany();
    for (const job of allJobs) {
        if (!/^\d{10}$/.test(job.id)) {
            const newId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            try {
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
                await prisma.job.delete({ where: { id: job.id } });
            } catch (e) {
                console.error("Migration failed for job", job.id, e);
            }
        }
    }

    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const status = url.searchParams.getAll("status");
    const type = url.searchParams.getAll("type");
    const entity = url.searchParams.getAll("entity");
    const date = url.searchParams.getAll("date");

    const where: any = {};
    if (q) {
        where.OR = [
            { id: { contains: q } },
            { details: { contains: q } }
        ];
    }

    if (status.length > 0) {
        where.status = { in: status };
    }

    if (type.length > 0) {
        where.type = { in: type };
    }

    if (entity.length > 0) {
        where.entity = { in: entity };
    }

    if (date.length > 0) {
        const dateConditions: any[] = [];
        const now = new Date();

        if (date.includes("today")) {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            dateConditions.push({ createdAt: { gte: startOfDay } });
        }
        if (date.includes("yesterday")) {
            const startOfYesterday = new Date(now);
            startOfYesterday.setDate(now.getDate() - 1);
            startOfYesterday.setHours(0, 0, 0, 0);

            const endOfYesterday = new Date(now);
            endOfYesterday.setDate(now.getDate() - 1);
            endOfYesterday.setHours(23, 59, 59, 999);

            dateConditions.push({ createdAt: { gte: startOfYesterday, lte: endOfYesterday } });
        }
        if (date.includes("last7days")) {
            const last7Days = new Date(now);
            last7Days.setDate(now.getDate() - 7);
            dateConditions.push({ createdAt: { gte: last7Days } });
        }

        if (dateConditions.length > 0) {
            where.OR = (where.OR || []).concat(dateConditions);
        }
    }

    const jobs = await prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
    return { jobs, q, status, type, entity, date };
};

export default function AllJobs() {
    const { jobs, q, status, type, entity, date } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState(q || "");
    const [popoverActive, setPopoverActive] = useState(false);
    const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);

    const [selectedStatus, setSelectedStatus] = useState<string[]>(status || []);
    const [selectedType, setSelectedType] = useState<string[]>(type || []);
    const [selectedEntity, setSelectedEntity] = useState<string[]>(entity || []);
    const [selectedDate, setSelectedDate] = useState<string[]>(date || []);

    // Sync state with loader data when URL changes
    useEffect(() => {
        setSelectedStatus(status || []);
        setSelectedType(type || []);
        setSelectedEntity(entity || []);
        setSelectedDate(date || []);
    }, [status, type, entity, date]);

    const togglePopoverActive = () => {
        setPopoverActive((active) => !active);
        if (popoverActive) {
            setActiveFilterCategory(null); // Reset on close
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };

    const updateFilters = (newStatus: string[], newType: string[], newEntity: string[], newDate: string[]) => {
        const params = new URLSearchParams();
        if (searchValue) params.set("q", searchValue);
        newStatus.forEach(s => params.append("status", s));
        newType.forEach(t => params.append("type", t));
        newEntity.forEach(e => params.append("entity", e));
        newDate.forEach(d => params.append("date", d));
        navigate(`?${params.toString()}`);
    };

    const handleStatusChange = (value: string[]) => {
        setSelectedStatus(value);
        updateFilters(value, selectedType, selectedEntity, selectedDate);
    };

    const handleTypeChange = (value: string[]) => {
        setSelectedType(value);
        updateFilters(selectedStatus, value, selectedEntity, selectedDate);
    };

    const handleEntityChange = (value: string[]) => {
        setSelectedEntity(value);
        updateFilters(selectedStatus, selectedType, value, selectedDate);
    };

    const handleDateChange = (value: string[]) => {
        setSelectedDate(value);
        updateFilters(selectedStatus, selectedType, selectedEntity, value);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== (q || "")) {
                const params = new URLSearchParams();
                params.set("q", searchValue);
                selectedStatus.forEach(s => params.append("status", s));
                selectedType.forEach(t => params.append("type", t));
                selectedEntity.forEach(e => params.append("entity", e));
                selectedDate.forEach(d => params.append("date", d));
                navigate(`?${params.toString()}`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue, navigate, q, selectedStatus, selectedType, selectedEntity, selectedDate]);

    // Update local state if URL changes externally (e.g. back button)
    useEffect(() => {
        setSearchValue(q || "");
    }, [q]);

    const removeTag = (category: string) => {
        switch (category) {
            case "status": handleStatusChange([]); break;
            case "type": handleTypeChange([]); break;
            case "entity": handleEntityChange([]); break;
            case "date": handleDateChange([]); break;
        }
    };

    const clearAllFilters = () => {
        const params = new URLSearchParams();
        if (searchValue) params.set("q", searchValue);
        navigate(`?${params.toString()}`);
    };

    return (
        <Page>
            <TitleBar title="All Jobs - Page 1" />
            <BlockStack gap="400">
                {/* Search and Filter Bar */}
                <Card>
                    <BlockStack gap="300">
                        <TextField
                            label=""
                            value={searchValue}
                            onChange={handleSearchChange}
                            placeholder="Filter by ID or File Name"
                            autoComplete="off"
                            labelHidden
                            clearButton
                            onClearButtonClick={() => setSearchValue("")}
                        />
                        <InlineStack gap="200" align="start" blockAlign="center">
                            {selectedStatus.length > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '8px', border: '1px solid #E1E3E5', backgroundColor: '#FFFFFF', fontSize: '13px', lineHeight: '20px', color: '#303030', gap: '4px' }}>
                                    <span>State: {selectedStatus.join(", ")}</span>
                                    <div onClick={() => removeTag("status")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon source={XIcon} tone="base" /></div>
                                </div>
                            )}
                            {selectedType.length > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '8px', border: '1px solid #E1E3E5', backgroundColor: '#FFFFFF', fontSize: '13px', lineHeight: '20px', color: '#303030', gap: '4px' }}>
                                    <span>Queue: {selectedType.join(", ")}</span>
                                    <div onClick={() => removeTag("type")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon source={XIcon} tone="base" /></div>
                                </div>
                            )}
                            {selectedEntity.length > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '8px', border: '1px solid #E1E3E5', backgroundColor: '#FFFFFF', fontSize: '13px', lineHeight: '20px', color: '#303030', gap: '4px' }}>
                                    <span>Entity: {selectedEntity.join(", ")}</span>
                                    <div onClick={() => removeTag("entity")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon source={XIcon} tone="base" /></div>
                                </div>
                            )}
                            {selectedDate.length > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '8px', border: '1px solid #E1E3E5', backgroundColor: '#FFFFFF', fontSize: '13px', lineHeight: '20px', color: '#303030', gap: '4px' }}>
                                    <span>Date: {selectedDate.join(", ")}</span>
                                    <div onClick={() => removeTag("date")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon source={XIcon} tone="base" /></div>
                                </div>
                            )}
                            <Popover
                                active={popoverActive}
                                activator={
                                    <button
                                        onClick={togglePopoverActive}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            border: '1px dashed #E1E3E5',
                                            backgroundColor: '#FFFFFF',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: '#303030',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>Add filter</span>
                                        <Icon source={PlusIcon} tone="base" />
                                    </button>
                                }
                                onClose={togglePopoverActive}
                            >
                                <LegacyCard>
                                    {!activeFilterCategory ? (
                                        <ActionList
                                            items={[
                                                { content: "State", onAction: () => setActiveFilterCategory("state") },
                                                { content: "Entity", onAction: () => setActiveFilterCategory("entity") },
                                                { content: "Queue", onAction: () => setActiveFilterCategory("queue") },
                                                { content: "Date", onAction: () => setActiveFilterCategory("date") },
                                            ]}
                                        />
                                    ) : (
                                        <LegacyCard.Section>
                                            <div style={{ marginBottom: "10px" }}>
                                                <Button variant="plain" onClick={() => setActiveFilterCategory(null)} icon={undefined}>
                                                    &lt; Back
                                                </Button>
                                            </div>
                                            {activeFilterCategory === "state" && (
                                                <ChoiceList
                                                    title="State"
                                                    choices={[
                                                        { label: "Finished", value: "Finished" },
                                                        { label: "Failed", value: "Failed" },
                                                        { label: "Processing", value: "Processing" },
                                                        { label: "Queued", value: "Queued" },
                                                        { label: "Cancelled", value: "Cancelled" },
                                                    ]}
                                                    selected={selectedStatus}
                                                    onChange={handleStatusChange}
                                                    allowMultiple
                                                />
                                            )}
                                            {activeFilterCategory === "entity" && (
                                                <ChoiceList
                                                    title="Entity"
                                                    choices={[
                                                        { label: "Products", value: "Products" },
                                                        { label: "Customers", value: "Customers" },
                                                        { label: "Orders", value: "Orders" },
                                                        { label: "Companies", value: "Companies" },
                                                        { label: "Smart Collections", value: "Smart Collections" },
                                                        { label: "Custom Collections", value: "Custom Collections" },
                                                        { label: "Draft Orders", value: "Draft Orders" },
                                                        { label: "Payouts", value: "Payouts" },
                                                        { label: "Pages", value: "Pages" },
                                                        { label: "Blog Posts", value: "Blog Posts" },
                                                        { label: "Redirects", value: "Redirects" },
                                                        { label: "Activity", value: "Activity" },
                                                        { label: "Files", value: "Files" },
                                                        { label: "Metaobjects", value: "Metaobjects" },
                                                    ]}
                                                    selected={selectedEntity}
                                                    onChange={handleEntityChange}
                                                    allowMultiple
                                                />
                                            )}
                                            {activeFilterCategory === "queue" && (
                                                <ChoiceList
                                                    title="Queue"
                                                    choices={[
                                                        { label: "Export", value: "Export" },
                                                        { label: "Import", value: "Import" },
                                                    ]}
                                                    selected={selectedType}
                                                    onChange={handleTypeChange}
                                                    allowMultiple
                                                />
                                            )}
                                            {activeFilterCategory === "date" && (
                                                <ChoiceList
                                                    title="Date"
                                                    choices={[
                                                        { label: "Today", value: "today" },
                                                        { label: "Yesterday", value: "yesterday" },
                                                        { label: "Last 7 Days", value: "last7days" },
                                                    ]}
                                                    selected={selectedDate}
                                                    onChange={handleDateChange}
                                                    allowMultiple
                                                />
                                            )}
                                        </LegacyCard.Section>
                                    )}
                                </LegacyCard>
                            </Popover>
                            {(selectedStatus.length > 0 || selectedType.length > 0 || selectedEntity.length > 0 || selectedDate.length > 0) && (
                                <Button variant="plain" onClick={clearAllFilters}>Clear all</Button>
                            )}
                        </InlineStack>
                    </BlockStack>
                </Card>

                {/* Jobs List */}
                <JobList jobs={jobs} />
            </BlockStack>
        </Page>
    );
}
