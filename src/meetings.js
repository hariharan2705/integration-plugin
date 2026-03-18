import { apiClient } from "./apiClient.js";

/**
 * Create Meeting
 */
export const createMeeting = async (data) => {

    const client = apiClient();

    const res = await client.post("/meetings", {
        topic: data.topic,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        participants: Array.isArray(data.participants) ? data.participants : []
    });

    const meeting = res.data;

    console.log("Create Meeting response:", meeting);

    // open meeting automatically
    if (meeting.joinUrl) {
        window.open(meeting.joinUrl, "_blank");
    }

    return meeting;
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