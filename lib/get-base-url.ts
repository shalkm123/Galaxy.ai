import { headers } from "next/headers";

export async function getBaseUrl() {
    const headerStore = await headers();

    const protocol =
        headerStore.get("x-forwarded-proto") ||
        (process.env.NODE_ENV === "development" ? "http" : "https");

    const host =
        headerStore.get("x-forwarded-host") ||
        headerStore.get("host") ||
        "localhost:3000";

    return `${protocol}://${host}`;
}