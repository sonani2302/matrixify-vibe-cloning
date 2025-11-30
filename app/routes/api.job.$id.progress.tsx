import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    const { id } = params;

    const job = await prisma.job.findUnique({
        where: { id: id as string },
        select: {
            id: true,
            status: true,
            progress: true,
            totalItems: true,
            processedItems: true
        }
    });

    if (!job) {
        return Response.json({ error: "Job not found" }, { status: 404 });
    }

    return Response.json({ job });
};
