import React from "react";
import { createRoot } from "react-dom/client";
import { TenantModal } from "./components/TenantModal.jsx";

// Re-export all API methods
export { initPlugin } from "./apiClient.js";
export { createPayment, refundPayment } from "./payments.js";
export { createMeeting, updateMeeting, cancelMeeting, completeMeeting } from "./meetings.js";
export {
    createTenant,
    saveOrUpdateTenantIntegration,
} from "./api/tenants.js";

// Store a single root instance outside the function scope
let modalRootInstance = null;
let modalContainer = null;

export const openTenantRegistrationModal = (options = {}) => {
    // 1. If container doesn't exist, create and append to document body
    if (!modalContainer || !document.getElementById("integration-plugin-modal-root")) {
        modalContainer = document.createElement("div");
        modalContainer.id = "integration-plugin-modal-root";
        modalContainer.style.position = "relative";
        modalContainer.style.zIndex = "2147483647";
        document.body.appendChild(modalContainer);
    }

    // 2. Reuse existing root or create a new one
    if (!modalRootInstance) {
        modalRootInstance = createRoot(modalContainer);
    }

    // 3. Define cleanup handler
    const closeModal = () => {
        if (modalRootInstance) {
            modalRootInstance.unmount();
            modalRootInstance = null; // Clear the instance reference
        }
        if (modalContainer && modalContainer.parentNode) {
            modalContainer.parentNode.removeChild(modalContainer);
            modalContainer = null; // Clear the container reference
        }
    };

    // 4. Render the Modal
    modalRootInstance.render(
        <TenantModal
            onClose={closeModal}
            onSuccess={(data) => {
                if (typeof options.onSuccess === "function") {
                    options.onSuccess(data);
                }
            }}
        />
    );
};