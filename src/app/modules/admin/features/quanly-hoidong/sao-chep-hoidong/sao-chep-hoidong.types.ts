export type CopySelectedHoidongState =
    'idle'
    | 'candidateLoading'
    | 'selecting'
    | 'previewLoading'
    | 'ready'
    | 'jobCreating'
    | 'jobRunning'
    | 'success'
    | 'partialSuccess'
    | 'error';

export {
    CopyHoidongCandidate,
    CopySelectedHoidongJobStatus,
    CopySelectedHoidongPreview,
    CopySelectedHoidongFailure,
    HoidongType
} from '@modules/shared/models/sao-chep-hoidong';
