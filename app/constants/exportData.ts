export const AVAILABLE_SHEETS = [
    { id: "products", name: "Products", icon: "ProductIcon", count: 18, total: 18, columns: "54 of 61 columns", estimate: "11 sec" },
    { id: "smart_collections", name: "Smart Collections", icon: "CollectionIcon", count: 1, total: 1, columns: "21 of 26 columns", estimate: "11 sec" },
    { id: "custom_collections", name: "Custom Collections", icon: "CollectionIcon", count: 2, total: 2, columns: "21 of 23 columns", estimate: "12 sec" },
    { id: "customers", name: "Customers", icon: "PersonIcon", count: 3, total: 3, columns: "43 of 53 columns", estimate: "11 sec" },
    { id: "companies", name: "Companies", icon: "WorkIcon", count: 2, total: 2, columns: "0 of 71 columns", estimate: "11 sec", attention: true },
    { id: "discounts", name: "Discounts", icon: "DiscountIcon", count: 5, total: 5, columns: "26 of 42 columns", estimate: "14 sec" },
    { id: "draft_orders", name: "Draft Orders", icon: "NoteIcon", count: 10, total: 10, columns: "41 of 135 columns", estimate: "11 sec" },
    { id: "orders", name: "Orders", icon: "OrderIcon", count: 0, total: 0, columns: "199 of 219 columns", estimate: "10 sec" },
    { id: "payouts", name: "Payouts", icon: "CashDollarIcon", count: null, total: null, exportOnly: true, columns: "6 of 20 columns", estimate: "10 sec" },
    { id: "pages", name: "Pages", icon: "PageIcon", count: 2, total: 2, columns: "10 of 11 columns", estimate: "11 sec" },
    { id: "blog_posts", name: "Blog Posts", icon: "BlogIcon", count: 0, total: 0, columns: "41 of 42 columns", estimate: "10 sec" },
    { id: "redirects", name: "Redirects", icon: "ArrowRightIcon", count: 0, total: 0, columns: "4 columns", estimate: "10 sec" },
    { id: "activity", name: "Activity", icon: "ViewIcon", count: 141, total: 141, exportOnly: true, columns: "10 columns", estimate: "14 sec" },
    { id: "files", name: "Files", icon: "FileIcon", count: null, total: null, columns: "13 of 16 columns", estimate: "10 sec" },
    { id: "metaobjects", name: "Metaobjects", icon: "DatabaseIcon", count: 0, total: 0, columns: "0 of 12 columns", estimate: "10 sec", attention: true },
    { id: "menus", name: "Menus", icon: "MenuIcon", count: 2, total: 2, columns: "0 of 10 columns", estimate: "11 sec", attention: true },
    { id: "shop", name: "Shop", icon: "StoreIcon", count: 1, total: 1, columns: "4 of 33 columns", estimate: "11 sec" },
];

export const PRODUCTS_COLUMNS = [
    {
        name: "Basic Columns",
        columns: [
            "ID", "Tags", "Published Scope", "Handle", "Tags Command", "Template Suffix", "Command", "Created At", "Gift Card", "Title", "Updated At", "URL", "Body HTML", "Status", "Total Inventory Qty", "Vendor", "Published", "Row #", "Type", "Published At", "Top Row"
        ]
    },
    {
        name: "Category",
        columns: ["Category: ID", "Category: Name", "Category"]
    },
    {
        name: "Collections",
        badge: "Slow",
        columns: ["Custom Collections", "Smart Collections"]
    },
    {
        name: "Media",
        badge: "Slow",
        columns: ["Image Type", "Image Src", "Image Command", "Image Position", "Image Width", "Image Height", "Image Alt Text"]
    },
    {
        name: "Inventory / Variants",
        columns: [
            "Variant Inventory Item ID", "Variant Position", "Variant Tax Code", "Variant ID", "Variant SKU", "Variant Inventory Tracker", "Variant Command", "Variant Barcode", "Variant Inventory Policy", "Option1 Name", "Variant Image", "Variant Fulfillment Service", "Option1 Value", "Variant Weight", "Variant Requires Shipping", "Option2 Name", "Variant Weight Unit", "Variant Shipping Profile", "Option2 Value", "Variant Price", "Variant Inventory Qty", "Option3 Name", "Variant Compare At Price", "Variant Inventory Adjust", "Option3 Value", "Variant Taxable"
        ]
    },
    {
        name: "Variant Cost",
        badge: "Slow",
        columns: ["Variant Cost"]
    },
    {
        name: "Customs Information",
        badge: "Slow",
        columns: ["Variant HS Code", "Variant Country of Origin", "Variant Province of Origin"]
    },
    {
        name: "Multi-Location Inventory Levels",
        badge: "Slow",
        columns: [
            "Inventory Available: ...", "Inventory Damaged Adjust: ...", "Inventory Available Adjust: ...", "Inventory Safety Stock: ...", "Inventory On Hand: ...", "Inventory Safety Stock Adjust: ...", "Inventory On Hand Adjust: ...", "Inventory Quality Control: ...", "Inventory Committed: ...", "Inventory Quality Control Adjust: ...", "Inventory Reserved: ...", "Inventory Incoming: ...", "Inventory Damaged: ..."
        ]
    },
    {
        name: "Pricing by Catalogs",
        badge: "Very Slow",
        columns: ["Included / ...", "Price / ...", "Compare At Price / ..."]
    },
    {
        name: "Metafields",
        badge: "Slow",
        columns: ["Metafield: ..."]
    },
    {
        name: "Variant Metafields",
        badge: "Very Slow",
        columns: ["Variant Metafield: ..."]
    }
];

export const ICON_MAP = {
    ProductIcon: "ProductIcon",
    CollectionIcon: "CollectionIcon",
    PersonIcon: "PersonIcon",
    WorkIcon: "WorkIcon",
    DiscountIcon: "DiscountIcon",
    NoteIcon: "NoteIcon",
    OrderIcon: "OrderIcon",
    CashDollarIcon: "CashDollarIcon",
    PageIcon: "PageIcon",
    BlogIcon: "BlogIcon",
    ArrowRightIcon: "ArrowRightIcon",
    ViewIcon: "ViewIcon",
    FileIcon: "FileIcon",
    DatabaseIcon: "DatabaseIcon",
    MenuIcon: "MenuIcon",
    StoreIcon: "StoreIcon",
};
