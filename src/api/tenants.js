import { apiClient } from "../apiClient";

export const IntegrationType = {
    RAZORPAY: "RAZORPAY",
    STRIPE: "STRIPE",
    TEAMS: "TEAMS",
    ZOOM: "ZOOM",
};

export const IntegrationCategory = {
    PAYMENT: "PAYMENT",
    MEETING: "MEETING",
};
export const createTenant = async (data) => {
    const client = apiClient();

    const payload = {
        status: "ACTIVE", // default status
        ...data,
    };

    console.log("Creating tenant with data:", payload);

    const res = await client.post("/tenant", payload);
    return res.data;
};

export const saveOrUpdateTenantIntegration = async (data) => {
    const validTypes = Object.values(IntegrationType);
    const validCategories = Object.values(IntegrationCategory);

    if (!data?.integrationType || !validTypes.includes(data.integrationType)) {
        throw new Error(
            `Invalid or missing integrationType. Must be one of: ${validTypes.join(", ")}`
        );
    }

    if (!data?.integrationCategory || !validCategories.includes(data.integrationCategory)) {
        throw new Error(
            `Invalid or missing integrationCategory. Must be one of: ${validCategories.join(", ")}`
        );
    }

    try {
        const client = apiClient();

        const payload = {
            secretKey: data.secretKey ?? null,
            integrationType: data.integrationType,
            integrationCategory: data.integrationCategory,
            enabled: data.enabled ?? true,
            configJson:
                typeof data.configJson === "object"
                    ? JSON.stringify(data.configJson)
                    : data.configJson,
        };

        console.log("Saving tenant integration with payload:", payload);

        const res = await client.post("/tenant/integration", payload);
        return res.data;
    } catch (error) {
        console.error("Error in saveOrUpdateTenantIntegration:", error);

        // Extract useful Axios error message if available
        const errorMessage =
            error.response?.data?.message || error.message || "An unknown error occurred";

        // Re-throw a cleaner Error object for the calling application
        throw new Error(errorMessage);
    }
};