export type CouncilDashboardStatCardKey = 'councils' | 'courses' | 'proposals' | 'celo' | 'questions';

export interface CouncilDashboardStatCard {
    key: CouncilDashboardStatCardKey;
    label: string;
    value: number;
    subLabel?: string;
    colorClass: string;
    loading?: boolean;
}

export interface CouncilDashboardCourseRow {
    councilId: number;
    councilTitle: string;
    councilType: 'celo' | 'cauhoi';
    councilStatus: number;
    councilStatusLabel: string;
    councilDateStart: string;
    councilDateEnd: string;
    courseId: number;
    courseTitle: string;
    courseCode: string;
    credits: number;
    totalLessons: number;
    totalQuestions: number;
    approvedQuestions: number;
    totalProposals: number;
    approvedProposals: number;
    approvedLectures: number;
    totalLectures: number;
    approvedCpi: number;
    totalCpi: number;
    memberStatusLabel: string;
    accepted: boolean;
}

export interface CouncilDashboardCouncilGroup {
    councilId: number;
    councilTitle: string;
    councilType: 'celo' | 'cauhoi';
    councilStatus: number;
    councilStatusLabel: string;
    councilDateStart: string;
    councilDateEnd: string;
    councilMemberCount: number;
    councilChairmanCount: number;
    rows: CouncilDashboardCourseRow[];
}

export interface CouncilDashboardSummary {
    totalCouncils: number;
    totalCourses: number;
    totalProposals: number;
    approvedProposals: number;
    acceptedCeloCourses: number;
    totalCeloCourses: number;
    acceptedQuestionCourses: number;
    totalQuestionCourses: number;
    approvedLectureItems: number;
    totalLectureItems: number;
    approvedCpiItems: number;
    totalCpiItems: number;
}
