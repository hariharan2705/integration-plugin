import { apiClient } from "./apiClient.js";


const throwValidationError = (field, expectedType, example, received, expectedFormat = null) => {
    throw new Error(
        JSON.stringify({
            field,
            expectedType,
            ...(expectedFormat && { expectedFormat }),
            example,
            received
        })
    );
};

// Helper to ensure payload is a valid non-array object
const isInvalidPayload = (data) => data == null || typeof data !== "object" || Array.isArray(data);

// Basic URL validator for HTTP/HTTPS links
const isValidUrl = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

/**
 * Validate Create Meeting Payload
 * DTO: MeetingRequest (topic, startTime, endTime, duration, recordingAvailable, participants, organizers)
 */
function validateCreateMeetingPayload(data) {
    if (isInvalidPayload(data)) {
        throw new Error(
            JSON.stringify({
                field: "payload",
                expectedType: "object",
                example: { topic: "Project Kickoff Meeting" },
                received: data
            })
        );
    }

    if (typeof data.topic !== "string" || !data.topic.trim()) {
        throwValidationError(
            "topic",
            "non-empty string",
            "Project Kickoff Meeting",
            data.topic
        );
    }

    const isoLocalDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

    if (typeof data.startTime !== "string" || !isoLocalDateTime.test(data.startTime)) {
        throwValidationError(
            "startTime",
            "ISO LocalDateTime string",
            "2026-08-05T10:00:00",
            data.startTime,
            "yyyy-MM-dd'T'HH:mm:ss"
        );
    }

    if (typeof data.endTime !== "string" || !isoLocalDateTime.test(data.endTime)) {
        throwValidationError(
            "endTime",
            "ISO LocalDateTime string",
            "2026-08-05T10:30:00",
            data.endTime,
            "yyyy-MM-dd'T'HH:mm:ss"
        );
    }

    if (
        typeof data.duration !== "number" ||
        Number.isNaN(data.duration) ||
        !Number.isInteger(data.duration) ||
        data.duration <= 0
    ) {
        throwValidationError(
            "duration",
            "positive integer",
            30,
            data.duration
        );
    }

    if (typeof data.recordingAvailable !== "boolean") {
        throwValidationError(
            "recordingAvailable",
            "boolean",
            true,
            data.recordingAvailable
        );
    }

    if (
        data.organizers != null &&
        (!Array.isArray(data.organizers) || !data.organizers.every(email => typeof email === "string"))
    ) {
        throwValidationError(
            "organizers",
            "string[] | null",
            ["manager@company.com", "teamlead@company.com"],
            data.organizers
        );
    }

    if (
        data.participants != null &&
        (!Array.isArray(data.participants) || !data.participants.every(email => typeof email === "string"))
    ) {
        throwValidationError(
            "participants",
            "string[] | null",
            ["alice@company.com", "bob@company.com"],
            data.participants
        );
    }
}

/**
 * Validate Complete Meeting Payload
 * DTO: MeetingCompletionRequest (meetingId, status, actualDuration, recordingLink)
 */
function validateCompleteMeetingPayload(data) {
    if (isInvalidPayload(data)) {
        throw new Error(
            JSON.stringify({
                field: "payload",
                expectedType: "object",
                example: {
                    meetingId: "39726ff1-2991-4c7c-ae47-35762ddf96e2",
                    status: "COMPLETED",
                    actualDuration: 30,
                    recordingLink: "https://example.com/recordings/meeting123"
                },
                received: data
            })
        );
    }

    // 1. meetingId -> String (required)
    if (typeof data.meetingId !== "string" || !data.meetingId.trim()) {
        throwValidationError(
            "meetingId",
            "non-empty string",
            "39726ff1-2991-4c7c-ae47-35762ddf96e2",
            data.meetingId
        );
    }

    // 2. status -> String (required)
    if (typeof data.status !== "string" || !data.status.trim()) {
        throwValidationError(
            "status",
            "non-empty string",
            "COMPLETED",
            data.status
        );
    }

    // 3. actualDuration -> Integer (required, must be an integer to match Java Integer DTO type)
    if (
        typeof data.actualDuration !== "number" ||
        Number.isNaN(data.actualDuration) ||
        !Number.isInteger(data.actualDuration) ||
        data.actualDuration <= 0
    ) {
        throwValidationError(
            "actualDuration",
            "positive integer",
            30,
            data.actualDuration
        );
    }

    // 4. recordingLink -> String (optional, nullable)
    if (
        data.recordingLink != null &&
        (typeof data.recordingLink !== "string" || !isValidUrl(data.recordingLink))
    ) {
        throwValidationError(
            "recordingLink",
            "valid URL string | null",
            "https://example.com/recordings/meeting123",
            data.recordingLink,
            "http(s)://URL"
        );
    }
}


/**
 * Create Meeting
 */
export const createMeeting = async (data) => {
    validateCreateMeetingPayload(data);

    try {
        const client = apiClient();

        const res = await client.post("/meetings", {
            topic: data.topic,
            startTime: data.startTime,
            endTime: data.endTime,
            duration: data.duration,
            recordingAvailable: data.recordingAvailable,
            organizers: data.organizers ?? null,
            participants: data.participants ?? null
        });

        const meeting = res.data;

        console.log("Create Meeting response:", meeting);

        if (meeting.joinUrl) {
            window.open(meeting.joinUrl, "_blank");
        }

        return meeting;
    } catch (err) {
        if (err.response) {
            throw new Error(
                JSON.stringify({
                    message: "Failed to create meeting.",
                    status: err.response.status,
                    response: err.response.data
                })
            );
        }

        if (err.request) {
            throw new Error(
                JSON.stringify({
                    message: "Unable to reach the meeting service.",
                    reason: "No response received from server."
                })
            );
        }

        throw err;
    }
};


/**
 * Update Meeting
 */
export const updateMeeting = async (data) => {

    const client = apiClient();

    const res = await client.post("/meetings/update", {
        meetingId: data.meetingId,
        topic: data.topic,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        participants: Array.isArray(data.participants) ? data.participants : []
    });

    const meeting = res.data;

    console.log("Update Meeting response:", meeting);

    return meeting;
};


/**
 * Cancel Meeting
 */
export const cancelMeeting = async (meetingId) => {

    const client = apiClient();

    const res = await client.post(
        `/meetings/cancel?meetingId=${meetingId}`
    );

    const data = res.data;

    console.log("Cancel Meeting response:", data);

    return data;
};

/**
 * Complete Meeting API Call
 */
export const completeMeeting = async (data) => {
    validateCompleteMeetingPayload(data);

    try {
        const client = apiClient();

        const res = await client.put("/meetings/complete", {
            meetingId: data.meetingId,
            status: data.status,
            actualDuration: data.actualDuration,
            recordingLink: data.recordingLink ?? null
        });

        return {
            meetingId: res.data.externalMeetingId,
            status: res.data.status
        };
    } catch (err) {
        if (err.response) {
            throw new Error(
                JSON.stringify({
                    message: "Failed to complete meeting.",
                    status: err.response.status,
                    response: err.response.data
                })
            );
        }

        if (err.request) {
            throw new Error(
                JSON.stringify({
                    message: "Unable to reach the meeting service.",
                    reason: "No response received from server."
                })
            );
        }

        throw err;
    }
};