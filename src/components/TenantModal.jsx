import React, { useState } from "react";
import {
    createTenant,
    saveOrUpdateTenantIntegration,
    IntegrationType,
    IntegrationCategory,
} from "../api/tenants";

// Helper to map IntegrationType to default category
const getCategoryForType = (type) => {
    if (type === "ZOOM" || type === "TEAMS") {
        return IntegrationCategory.MEETING;
    }
    return IntegrationCategory.PAYMENT;
};

export function TenantModal({ onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState("tenant"); // "tenant" or "integration"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- TAB 1 STATE (Tenant Only) ---
    const [createdSecretKey, setCreatedSecretKey] = useState(null);
    const [copied, setCopied] = useState(false);
    const [tenantData, setTenantData] = useState({
        name: "",
        schemaName: "",
    });

    // --- TAB 2 STATE (Dynamic Integration Form) ---
    const [integrationData, setIntegrationData] = useState({
        secretKey: "",
        selectedType: "ZOOM", // Default selection
        // Dynamic fields
        zoom: { clientId: "", clientSecret: "", accountId: "" },
        teams: { clientId: "", clientSecret: "", tenantId: "", organizerUserId: "" },
        razorpay: { apiKey: "", keySecret: "" },
        stripe: { apiKey: "", publicKey: "", webhookSecretKey: "" },
    });

    // --- TAB 1 HANDLER: Create Tenant Only ---
    const handleTenantSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const tenantRes = await createTenant({
                name: tenantData.name,
                schemaName: tenantData.schemaName,
            });

            const secretKey =
                typeof tenantRes === "string"
                    ? tenantRes
                    : tenantRes?.secretKey || tenantRes?.data?.secretKey;

            if (!secretKey) {
                throw new Error("Could not retrieve secret key from created tenant.");
            }

            setLoading(false);
            setCreatedSecretKey(secretKey);

            // Pre-fill secretKey in Tab 2 state automatically
            setIntegrationData((prev) => ({ ...prev, secretKey }));

            if (onSuccess) {
                onSuccess({ tenant: tenantRes, secretKey });
            }
        } catch (err) {
            setLoading(false);
            setError(err.message || "Failed to create tenant.");
        }
    };

    // --- TAB 2 HANDLER: Submit Dynamic Integration ---
    const handleIntegrationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const type = integrationData.selectedType;
            const category = getCategoryForType(type);

            // Extract specific payload based on selected type
            let configuration = {};
            if (type === "ZOOM") configuration = integrationData.zoom;
            else if (type === "TEAMS") configuration = integrationData.teams;
            else if (type === "RAZORPAY") configuration = integrationData.razorpay;
            else if (type === "STRIPE") configuration = integrationData.stripe;

            const result = await saveOrUpdateTenantIntegration({
                secretKey: integrationData.secretKey,
                integrationType: type,
                integrationCategory: category,
                enabled: true,
                configJson: configuration, // Passes the dynamic payload to your API
            });

            setLoading(false);
            if (onSuccess) onSuccess({ integration: result });
            onClose(); // Close modal upon successful integration save
        } catch (err) {
            setLoading(false);
            setError(err.message || "Failed to save integration.");
        }
    };

    const handleCopyAndGoToIntegration = () => {
        if (createdSecretKey) {
            navigator.clipboard.writeText(createdSecretKey);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setActiveTab("integration"); // Switch to Tab 2
            }, 600);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* TAB HEADERS */}
                <div style={tabHeaderStyle}>
                    <button
                        type="button"
                        onClick={() => setActiveTab("tenant")}
                        style={activeTab === "tenant" ? activeTabStyle : inactiveTabStyle}
                    >
                        Create Tenant
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("integration")}
                        style={activeTab === "integration" ? activeTabStyle : inactiveTabStyle}
                    >
                        Integration
                    </button>
                </div>

                {error && <div style={errorStyle}>{error}</div>}

                {/* ================= TAB 1: CREATE TENANT ================= */}
                {activeTab === "tenant" && (
                    <div>
                        {!createdSecretKey ? (
                            <form onSubmit={handleTenantSubmit}>
                                <div style={fieldStyle}>
                                    <label>Tenant Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Acme Corp"
                                        value={tenantData.name}
                                        onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label>Schema Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. acme_db"
                                        value={tenantData.schemaName}
                                        onChange={(e) => setTenantData({ ...tenantData, schemaName: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={btnRowStyle}>
                                    <button type="button" onClick={onClose} disabled={loading} style={secBtnStyle}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} style={priBtnStyle}>
                                        {loading ? "Creating..." : "Create Tenant"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* SUCCESS STATE IN TAB 1 */
                            <div>
                                <div style={successAlertStyle}>
                                    ✅ <strong>Tenant Created Successfully!</strong>
                                </div>

                                <p style={{ fontSize: "13px", color: "#555", marginTop: 0 }}>
                                    Copy your secret key below and proceed to configure your integration settings.
                                </p>

                                <div style={keyContainerStyle}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={createdSecretKey}
                                        style={keyInputStyle}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopyAndGoToIntegration}
                                        style={copied ? copySuccessBtnStyle : copyBtnStyle}
                                    >
                                        {copied ? "Copied!" : "Copy & Go to Integration →"}
                                    </button>
                                </div>

                                <div style={{ ...btnRowStyle, marginTop: "20px" }}>
                                    <button type="button" onClick={onClose} style={secBtnStyle}>
                                        Close
                                    </button>
                                    <button type="button" onClick={() => setActiveTab("integration")} style={priBtnStyle}>
                                        Go to Integration →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ================= TAB 2: DYNAMIC INTEGRATION ================= */}
                {activeTab === "integration" && (
                    <form onSubmit={handleIntegrationSubmit}>
                        <div style={fieldStyle}>
                            <label>Secret Key</label>
                            <input
                                type="password"
                                required
                                placeholder="Enter or paste tenant secret key"
                                value={integrationData.secretKey}
                                onChange={(e) =>
                                    setIntegrationData({ ...integrationData, secretKey: e.target.value })
                                }
                                style={inputStyle}
                            />
                        </div>

                        <div style={fieldStyle}>
                            <label>Select Integration Type</label>
                            <select
                                value={integrationData.selectedType}
                                onChange={(e) =>
                                    setIntegrationData({ ...integrationData, selectedType: e.target.value })
                                }
                                style={inputStyle}
                            >
                                <option value="ZOOM">Zoom</option>
                                <option value="TEAMS">Microsoft Teams</option>
                                <option value="RAZORPAY">Razorpay</option>
                                <option value="STRIPE">Stripe</option>
                            </select>
                        </div>

                        <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "16px 0" }} />

                        {/* --- DYNAMIC FIELDS PER SERVICE --- */}

                        {/* 1. ZOOM */}
                        {integrationData.selectedType === "ZOOM" && (
                            <>
                                <div style={fieldStyle}>
                                    <label>Client ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={integrationData.zoom.clientId}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                zoom: { ...integrationData.zoom, clientId: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Client Secret</label>
                                    <input
                                        type="password"
                                        required
                                        value={integrationData.zoom.clientSecret}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                zoom: { ...integrationData.zoom, clientSecret: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Account ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={integrationData.zoom.accountId}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                zoom: { ...integrationData.zoom, accountId: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                            </>
                        )}

                        {/* 2. TEAMS */}
                        {integrationData.selectedType === "TEAMS" && (
                            <>
                                <div style={fieldStyle}>
                                    <label>Client ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={integrationData.teams.clientId}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                teams: { ...integrationData.teams, clientId: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Client Secret</label>
                                    <input
                                        type="password"
                                        required
                                        value={integrationData.teams.clientSecret}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                teams: { ...integrationData.teams, clientSecret: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Tenant ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={integrationData.teams.tenantId}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                teams: { ...integrationData.teams, tenantId: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Organizer User ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={integrationData.teams.organizerUserId}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                teams: { ...integrationData.teams, organizerUserId: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                            </>
                        )}

                        {/* 3. RAZORPAY */}
                        {integrationData.selectedType === "RAZORPAY" && (
                            <>
                                <div style={fieldStyle}>
                                    <label>Test API Key</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="rzp_test_..."
                                        value={integrationData.razorpay.apiKey}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                razorpay: { ...integrationData.razorpay, apiKey: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Test Key Secret</label>
                                    <input
                                        type="password"
                                        required
                                        value={integrationData.razorpay.keySecret}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                razorpay: { ...integrationData.razorpay, keySecret: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                            </>
                        )}

                        {/* 4. STRIPE */}
                        {integrationData.selectedType === "STRIPE" && (
                            <>
                                <div style={fieldStyle}>
                                    <label>API Key (Secret)</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="sk_test_..."
                                        value={integrationData.stripe.apiKey}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                stripe: { ...integrationData.stripe, apiKey: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Public Key</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="pk_test_..."
                                        value={integrationData.stripe.publicKey}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                stripe: { ...integrationData.stripe, publicKey: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label>Webhook Secret Key</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="whsec_..."
                                        value={integrationData.stripe.webhookSecretKey}
                                        onChange={(e) =>
                                            setIntegrationData({
                                                ...integrationData,
                                                stripe: { ...integrationData.stripe, webhookSecretKey: e.target.value },
                                            })
                                        }
                                        style={inputStyle}
                                    />
                                </div>
                            </>
                        )}

                        <div style={btnRowStyle}>
                            <button type="button" onClick={onClose} disabled={loading} style={secBtnStyle}>
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} style={priBtnStyle}>
                                {loading ? "Saving..." : "Save Integration"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

// STYLES
const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2147483647 };
const modalStyle = { background: "#fff", padding: "20px", borderRadius: "8px", width: "100%", maxWidth: "440px", fontFamily: "sans-serif", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const tabHeaderStyle = { display: "flex", borderBottom: "2px solid #eee", marginBottom: "16px" };
const activeTabStyle = { flex: 1, padding: "10px", background: "none", border: "none", borderBottom: "2px solid #0070f3", fontWeight: "bold", color: "#0070f3", cursor: "pointer" };
const inactiveTabStyle = { flex: 1, padding: "10px", background: "none", border: "none", color: "#666", cursor: "pointer" };
const fieldStyle = { display: "flex", flexDirection: "column", marginBottom: "12px", gap: "4px", fontSize: "14px" };
const inputStyle = { padding: "8px 10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px" };
const btnRowStyle = { display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" };
const priBtnStyle = { padding: "8px 16px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" };
const secBtnStyle = { padding: "8px 16px", backgroundColor: "#eaeaea", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer" };
const errorStyle = { backgroundColor: "#ffe6e6", color: "#d8000c", padding: "8px", borderRadius: "4px", marginBottom: "12px", fontSize: "13px" };

const successAlertStyle = { backgroundColor: "#e6f4ea", border: "1px solid #b7e1cd", color: "#137333", padding: "10px", borderRadius: "6px", fontSize: "13px", marginBottom: "12px" };
const keyContainerStyle = { display: "flex", gap: "8px", background: "#f5f5f5", padding: "8px", borderRadius: "6px", border: "1px solid #e0e0e0" };
const keyInputStyle = { flex: 1, background: "transparent", border: "none", fontFamily: "monospace", fontSize: "13px", color: "#333", outline: "none" };
const copyBtnStyle = { padding: "6px 12px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" };
const copySuccessBtnStyle = { padding: "6px 12px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" };