export type ClassDownloadStatus = 'idle' | 'loading' | 'success' | 'empty' | 'failed';

export type ClassImportStatus = 'idle' | 'deleting' | 'importing' | 'success' | 'partial' | 'failed' | 'blocked';

export type ClassComparisonStatus = 'idle' | 'loading' | 'unchanged' | 'changed' | 'failed' | 'stale';

export type StudentDifferenceStatus = 'unchanged' | 'added' | 'removed' | 'reordered' | 'current-invalid';

export type StudentPreviewStatus =
    'valid' |
    'not-found' |
    'duplicate' |
    'download-failed' |
    'imported' |
    'import-failed';

export interface HvuClassSyncItem {
    classId: number;
    syncClassId: string;
    name: string;
    kyhieu: string;
    namhoc: string;
    hocky: string;
    categoryId: number;
    downloadStatus: ClassDownloadStatus;
    importStatus: ClassImportStatus;
    remoteStudentCount: number;
    validStudentCount: number;
    invalidStudentCount: number;
    importedStudentCount: number;
    failedStudentCount: number;
    comparisonStatus: ClassComparisonStatus;
    currentStudentCount: number;
    unchangedStudentCount: number;
    addedStudentCount: number;
    removedStudentCount: number;
    reorderedStudentCount: number;
    invalidCurrentStudentCount: number;
    currentSnapshotSignature?: string;
    comparisonMessage?: string;
    errorMessage?: string;
}

export interface HvuClassStudentPreview {
    membershipKey: string;
    classId: number;
    syncClassId: string;
    className: string;
    studentCode: string;
    ordering?: number;
    studentId?: number;
    userId?: number;
    name?: string;
    fullName?: string;
    birthday?: string;
    email?: string;
    status: StudentPreviewStatus;
    errorMessage?: string;
}

export interface HvuClassStudentDifference {
    differenceKey: string;
    classId: number;
    syncClassId: string;
    className: string;
    studentCode?: string;
    fullName?: string;
    status: StudentDifferenceStatus;
    currentOrdering?: number;
    remoteOrdering?: number;
    message?: string;
}

export interface HvuClassDownloadResult {
    classItem: HvuClassSyncItem;
    students: HvuClassStudentPreview[];
    errorMessage?: string;
}

export interface ImportRecordResult {
    student: HvuClassStudentPreview;
    success: boolean;
    errorMessage?: string;
}

export interface ImportSummary {
    successClasses: number;
    partialClasses: number;
    failedClasses: number;
    skippedUnchangedClasses: number;
    staleBlockedClasses: number;
    successStudents: number;
    failedStudents: number;
}
