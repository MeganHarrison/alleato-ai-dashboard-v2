// Temporarily disabled - database schema mismatches

// Placeholder exports to satisfy imports
export const getProjectMeetingInsights = async () => ({ success: false, insights: [] });
export const getAllMeetingInsightsFromMeetings = async () => ({ insights: [] });
export const getMeetingStatistics = async () => ({});
export const generateMeetingInsights = async (meetingId: string) => ({ success: false, message: 'Not implemented' });
export const bulkGenerateInsights = async (meetingIds: string[]) => ({ success: false, message: 'Not implemented' });
