// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { InputQuestionDirectionComponent } from '@modules/admin/features/cauhoi-tracnghiem/input-question-direction/input-question-direction.component';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { NotificationService } from '@core/services/notification.service';
import { extractJsonFromString } from './json-extract.util';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { cauhoi_khac, json_test, monkhac } from '@modules/shared/models/tn-ql-ca-thi';
import { RadioAndCheckboxEditorComponent } from "../text-import-answer-editor/radio-and-checkbox-editor/radio-and-checkbox-editor.component";
import { InputboxEditorComponent } from "../text-import-answer-editor/inputbox-editor/inputbox-editor.component";
import { GroupInputEditorComponent } from "../text-import-answer-editor/group-input-editor/group-input-editor.component";
import { GroupingEditorComponent } from "../text-import-answer-editor/grouping-editor/grouping-editor.component";
import { DragDropEditorComponent } from "../text-import-answer-editor/drag-drop-editor/drag-drop-editor.component";
import { QuestionTypeGroupRadioComponent } from "../question-types-view/question-type-group-radio/question-type-group-radio.component";
import { GroupRadioEditorComponent } from "../text-import-answer-editor/group-radio-editor/group-radio-editor.component";
import { ReorderWordsEditorComponent } from "../text-import-answer-editor/reorder-words-editor/reorder-words-editor.component";
import { ArrangeParagraphsEditorComponent } from "../text-import-answer-editor/arrange-paragraphs-editor/arrange-paragraphs-editor.component";
import { TextImportTestPreviewComponent } from "../text-import-test-preview/text-import-test-preview.component";
import { CoursePlanActivitiesExtend } from '../cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component';

import { firstValueFrom } from 'rxjs';
import { ApiAiService } from '@modules/shared/services/api-ai.service';
/** Chuẩn đầu ra mức Bloom — lấy từ `CHUAN_DAU_RA` (syscat.ts) */
type ChuanDauRaItem = {
    id: number;
    label: string;
    disabled: boolean;
    isActive: boolean;
};

/** Cấu trúc một đáp án (AI có thể trả về nhiều biến thể) */
interface AnswerOptionItem {
    id?: string;
    key?: string;
    value?: string;
    text?: string;
    label?: string;
}

/** Cấu hình hiển thị cho câu hỏi */
interface QuestionConfig {
    cols: number;
    invertedAnswer: boolean;
}

/** Cấu trúc một câu hỏi (có thể là group parent hoặc child question) */
interface AiQuestion {
    question_type: string;
    question_direction: string;
    answer_option: AnswerOptionItem[];
    answer_correct: string;
    group_id?: number;
    code?: string;
    media?: unknown;
    config?: QuestionConfig;
    raw_answer?: string;
    children?: AiQuestion[];

    /** Optional: số thứ tự câu hỏi (chỉ có ở child) */
    question_number?: number | string;

    // === Computed / enriched fields (do enrichQuestion() thêm vào) ===
    private?: number;
    cdr?: number;
    cdr_id?: number;
    _typeLabel?: string;
    _text?: string;
    _answers?: { label: string; text: string; isCorrect: boolean }[];
    _correctAnswerLabel?: string;
    _hasChildren?: boolean;
    _cdrLabel?: string;

    /** Cho phép các thuộc tính động khác */
    [key: string]: unknown;
}

/** Wrapper response từ API AI — có thể có data hoặc trả về trực tiếp */
interface ApiAiResponse {
    data?: unknown;
    error?: string;
    message?: string;
    [key: string]: unknown;
}

/**
 * Kiểu dữ liệu cho responseData.
 * Có thể là:
 * - Mảng câu hỏi
 * - Object chứa { data: AiQuestion[] }
 * - Một câu hỏi đơn lẻ
 * - null/undefined
 */
type ResponseData = AiQuestion[] | { data: AiQuestion[] } | AiQuestion | null;

@Component({
    selector: 'app-text-import-question',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        InputQuestionDirectionComponent,
        DropdownModule,
        TabViewModule,
        RadioAndCheckboxEditorComponent,
        InputboxEditorComponent,
        GroupInputEditorComponent,
        GroupingEditorComponent,
        DragDropEditorComponent,
        GroupRadioEditorComponent,
        ReorderWordsEditorComponent,
        ArrangeParagraphsEditorComponent,
        TextImportTestPreviewComponent
    ],
    templateUrl: './text-import-question.component.html',
    styleUrls: ['./text-import-question.component.css']
})
export class TextImportQuestionComponent implements OnInit, OnChanges {
    @Input() selectedCourse: ElnKhoaHoc;
    @Input() chuan_dau_ra: ChuanDauRaItem[] = [];
    @Input() activeLevelId: number = 0;
    @Input() selectCdr: CoursePlanActivitiesExtend | null = null;
    @Input() set list_plan(_list: CoursePlanActivitiesExtend[] | null) {
        if (_list) {
            const data: CoursePlanActivitiesExtend[] = [];
            _list.filter(m => m.week !== 100).forEach(m => {
                (m.children || []).forEach(i => {
                    i['label'] = `${i.kyhieu ?? ''} ${i['cdr_name'] ?? ''}`.trim();
                    data.push(i);
                });
            });
            this.listCdr = data;
        }
    }

    listCdr: CoursePlanActivitiesExtend[] = [];

    form: FormGroup;
    loading = false;
    responseData: ResponseData ;
    responseError: string | null = null;
    ckEditorInstance: unknown = null;
    previewMode = false;

    /** Pre-computed properties for template binding (Rule 1) */
    responseArray: AiQuestion[] = [];
    responseCount: number = 0;

    /** Active tab index */
    activeTab: number = 0;
    /** Total testable questions count (passed to test component) — chỉ đếm children nếu có */
    testTotalCount: number = 0;
    /** Deep clone của responseArray dành riêng cho tab Kiểm thử — không ảnh hưởng tab Soạn câu hỏi */
    testResponseArray: AiQuestion[] = [];
/** Saving in progress (shows save-progress dialog). */
    isSaving = false;
    /** Save progress: saved count / total count / current status text. */
    saveProgress: { saved: number; total: number; current: string } = { saved:0, total:0, current:'' };

    constructor(
        private fb: FormBuilder,
        private courseQuestionsService: CourseQuestionsService,
        private notificationService: NotificationService,
        private apiAiService: ApiAiService
    ) {
        this.form = this.fb.group({
            prompt: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.resetState();
        this.enrichInitialData();
    }

    ngOnDestroy(): void {
        this.resetState();
    }

    private resetState(): void {
        this.loading = false;
        // this.responseData = null;
        this.responseArray = [];
        this.responseCount = 0;
        this.responseError = null;
        this.previewMode = false;
        this.activeTab = 0;
        this.testTotalCount = 0;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activeLevelId'] && !changes['activeLevelId'].firstChange) {
            const newLevelId = changes['activeLevelId'].currentValue;
            if (newLevelId && this.responseData) {
                this.updateAllQuestionsCdr(newLevelId);
            }
        }
        if (changes['selectCdr'] && !changes['selectCdr'].firstChange) {
            this.responseData = null;
            this.syncResponseData();
        }
    }

    private updateAllQuestionsCdr(newLevelId: number): void {
        const arr = this.responseArray;
        if (arr.length > 0) {
            arr.forEach(q => this.updateCdrRecursive(q, newLevelId));
        }
    }

    private updateCdrRecursive(q: AiQuestion, newLevelId: number): void {
        if (!q) return;
        q.cdr = newLevelId;
        q._cdrLabel = this.computeCdrLabel(newLevelId);
        if (q.children && Array.isArray(q.children)) {
            q.children.forEach(c => this.updateCdrRecursive(c, newLevelId));
        }
    }

    private syncResponseData(): void {
        this.responseArray = this.computeResponseArray();
        this.responseCount = this.countAllQuestions(this.responseArray);
        this.syncTestData();
    }

    /**
     * Tạo deep clone của responseArray cho tab Kiểm thử
     * Đảm bảo mọi thay đổi trong test không ảnh hưởng đến responseArray gốc
     */
    private syncTestData(): void {
        this.testResponseArray = this.responseArray.length > 0
            ? JSON.parse(JSON.stringify(this.responseArray))
            : [];
    }

    private computeResponseArray(): AiQuestion[] {
        if (!this.responseData) return [];
        if (Array.isArray(this.responseData)) return this.responseData as AiQuestion[];
        if (this.responseData && 'data' in this.responseData && Array.isArray(this.responseData.data)) {
            return this.responseData.data as AiQuestion[];
        }
        if (this.responseData && !('data' in this.responseData)) {
            return [this.responseData as AiQuestion];
        }
        return [];
    }

    private enrichInitialData(): void {
        const arr = this.computeResponseArray();
        if (arr.length > 0) {
            arr.forEach(q => this.enrichQuestion(q));
        }
        this.syncResponseData();
    }

    get promptControl(): AbstractControl {
        return this.form.get('prompt')!;
    }

    onCkEditorReady(editor: unknown): void {
        this.ckEditorInstance = editor;
    }

    submitPrompt(): void {
        this.form.get('prompt')?.markAsTouched();
        if (this.form.invalid) {
            this.notificationService.toastWarning('Vui lòng nhập nội dung câu hỏi');
            return;
        }

        const prompt: string = this.form.get('prompt')?.value;
        if (!prompt || !prompt.trim()) {
            this.notificationService.toastWarning('Vui lòng nhập nội dung câu hỏi');
            return;
        }

        this.loading = true;
        this.responseData = null;
        this.responseError = null;
        this.previewMode = true;
        this.activeTab = 0;
        this.notificationService.isProcessing(true);

        this.apiAiService.getCauHoiTracNghiemAi(prompt).subscribe({
            next: (response: ApiAiResponse | string) => {
                try {
                    const rawText = typeof response === 'string' ? response : JSON.stringify(response);
                    const parsed = extractJsonFromString(rawText);
                    const items = Array.isArray(parsed) ? parsed : (parsed?.data && Array.isArray(parsed.data) ? parsed.data : [parsed]);
                    items.forEach((q: AiQuestion) => this.enrichQuestion(q));
                    this.responseData = Array.isArray(parsed) ? parsed : parsed;
                    this.syncResponseData();
                    this.previewMode = true;
                    this.notificationService.toastSuccess(`Đã xử lý: ${this.responseCount} câu hỏi`);
                    console.log(this.responseArray);
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Lỗi parse JSON từ phản hồi hệ thống';
                    this.responseError = msg;
                    this.responseData = response as ResponseData;
                    this.syncResponseData();
                    this.notificationService.toastWarning('Không thể tự động phân tích JSON, hiển thị kết quả thô');
                }
                this.loading = false;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.loading = false;
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Mất kết nối với máy chủ');
            }
        });
    }

    private enrichQuestion(q: AiQuestion): void {
        if (!q) return;
        if (q.private === undefined || q.private === null) q.private = 0;
        if (!q.config) q.config = { invertedAnswer: false, cols: 1 };
        q.cdr = this.activeLevelId || 1;
        q['showCorrectAnswer'] = true;

        q._typeLabel = this.computeQuestionType(q);
        q._text = q.question_direction || '';
        q._answers = this.computeAnswers(q);
        q._correctAnswerLabel = this.computeCorrectAnswer(q);
        q._hasChildren = !!(q.children && Array.isArray(q.children) && q.children.length > 0);
        q._cdrLabel = this.computeCdrLabel(q.cdr);

        if (q.children && Array.isArray(q.children)) {
            q.children.forEach(c => this.enrichQuestion(c));
        }
    }

    onDividerMouseDown(event: MouseEvent): void {
        event.preventDefault();
        const splitLayout = (event.target as HTMLElement).closest('.split-layout') as HTMLElement;
        if (!splitLayout) return;

        const startX = event.clientX;
        const editorPanel = splitLayout.querySelector('.editor-panel') as HTMLElement;
        const startWidth = editorPanel?.offsetWidth || 560;

        const onMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - startX;
            const newWidth = Math.max(320, Math.min(startWidth + delta, window.innerWidth - 400));
            if (editorPanel) {
                editorPanel.style.width = newWidth + 'px';
                editorPanel.style.flex = 'none';
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    editAgain(): void {
        this.responseData = null;
        this.responseError = null;
        this.activeTab = 0;
        this.syncResponseData();
    }

    togglePrivate(q: AiQuestion): void {
        q.private = q.private === 1 ? 0 : 1;
    }

    toggleInvert(q: AiQuestion): void {
        if (!q.config) q.config = { invertedAnswer: false, cols: 1 };
        q.config.invertedAnswer = !q.config.invertedAnswer;
    }

    onCdrSelect(question: AiQuestion, cdrId: number): void {
        question.cdr_id = cdrId;
    }

    private computeCdrLabel(cdrId: number): string {
        if (!cdrId || !this.chuan_dau_ra) return '';
        const found = this.chuan_dau_ra.find(c => Number(c.id) === Number(cdrId));
        return found ? found.label : '';
    }

    private computeListCdrLabel(cdr_id: number): string {
        if (!cdr_id || !this.listCdr) return '';
        const found = this.listCdr.find(c => Number(c.id) === Number(cdr_id));
        return found ? found['label'] : '';
    }

    /**
     * Đếm tổng số câu có thể kiểm thử.
     * - Nếu có children → đếm children (không đếm parent)
     * - Nếu không có children → đếm chính item đó
     * Đồng bộ với countTestableQuestions() trong TextImportTestPreviewComponent
     */
    private countAllQuestions(data: AiQuestion[]): number {
        let count = 0;
        for (const item of data) {
            if (item.children?.length && !item.answer_option?.length) {
                count += item.children.length;
            } else if (item.children?.length && ['group-input', 'group-radio', 'drag_drop', 'grouping'].includes(item.question_type)) {
                count += item.children.length;
            } else {
                count++;
            }
        }
        return count;
    }

    private computeQuestionType(question: AiQuestion): string {
        const typeMap: Record<string, string> = {
            radio: 'Trắc nghiệm 1 đáp án',
            checkbox: 'Trắc nghiệm nhiều đáp án',
            inputbox: 'Nhập liệu',
            reorder_words: 'Sắp xếp từ',
            arrange_paragraphs: 'Sắp xếp đoạn',
            drag_drop: 'Kéo thả',
            'group-input': 'Nhóm nhập liệu',
            'group-radio': 'Nhóm trắc nghiệm',
            grouping: 'Nhóm ghép cặp',
        };
        return typeMap[question?.question_type] || question?.question_type || 'Không xác định';
    }

    private computeAnswers(question: AiQuestion): { label: string; text: string; isCorrect: boolean }[] {
        const answers = question?.answer_option || [];
        if (!Array.isArray(answers)) return [];

        const correctStr = question?.answer_correct || '';
        const correctIds = correctStr.startsWith('|')
            ? correctStr.split('|').filter((s: string) => s.trim() !== '')
            : correctStr.split(',').map((s: string) => s.trim()).filter(Boolean);

        return answers.map((ans: AnswerOptionItem, idx: number) => {
            const id = ans.id ?? ans.key ?? String(idx + 1);
            return {
                label: String.fromCharCode(65 + idx),
                text: ans.value ?? ans.text ?? ans.label ?? '',
                isCorrect: correctIds.includes(String(id)) || correctIds.includes(String(idx + 1))
            };
        });
    }

    private computeCorrectAnswer(question: AiQuestion): string {
        const correctStr = question?.answer_correct || '';
        if (!correctStr) return '';

        const ids = correctStr.startsWith('|')
            ? correctStr.split('|').filter((s: string) => s.trim() !== '')
            : correctStr.split(',').map((s: string) => s.trim()).filter(Boolean);

        return ids.map((id: string) => {
            const num = parseInt(id);
            if (!isNaN(num)) return String.fromCharCode(64 + num);
            return id.toUpperCase();
        }).join(', ');
    }

    /** Called when test completes — update testTotalCount for header display */
    onTestCheckComplete(event: { correctCount: number; totalCount: number }): void {
        this.testTotalCount = event.totalCount;
    }

    /** Called when test retry is requested */
    onTestRetry(): void {
        // Nothing extra needed — test component handles its own data
    }
/** Progress percent for the save dialog progress bar. */
    get saveProgressPercent(): number {
        if (!this.saveProgress.total) return 0;
        return Math.round((this.saveProgress.saved / this.saveProgress.total) * 100);
    }

    /**
     * Save all questions sequentially -- parent first, then its children:
     * 1. Save the parent question and take the returned id from the save request.
     * 2. Save each child question with `group_id` = parent id.
     * No subscribe inside loops -- uses async/await + firstValueFrom.
     */
    async saveQuestions(): Promise<void> {
        const questions = this.responseArray;
        if (!questions.length) {
            this.notificationService.toastWarning('No questions to save.');
            return;
        }
        if (!this.selectCdr?.id || !this.selectCdr.course_id) {
            this.notificationService.toastWarning('Missing CDR/course info -- cannot save questions.');
            return;
        }

        const total = questions.reduce((sum, q) => sum +1 + (q.children?.length ||0),0);
        this.isSaving = true;
        this.saveProgress = { saved:0, total, current:'' };

        try {
            for (let i =0; i < questions.length; i++) {
                const parent = questions[i];
                if (!parent) continue;

                this.saveProgress.current='Saving parent #'+(i+1)+'...';
                const parentId = await this.saveSingleQuestion(parent, parent.group_id ||0);

                this.saveProgress.saved++;
                this.saveProgress.current='Parent #'+(i+1)+' saved, saving children...';

                if (parent.children?.length) {
                    for (let j =0; j < parent.children.length; j++) {
                        const child = parent.children[j];
                        this.saveProgress.current='Saving child #'+(j+1)+' of question #'+(i+1)+'...';
                        await this.saveSingleQuestion(child, parentId, parent);
                        this.saveProgress.saved++;
                    }
                }
                this.saveProgress.current='Question #'+(i+1)+' saved';
            }
            this.notificationService.toastSuccess('Saved '+this.saveProgress.saved+'/'+this.saveProgress.total+' questions.');
        } catch (e: unknown) {
            const msg=e instanceof Error ? e.message : 'Unknown error';
            this.notificationService.toastError('Save failed: '+msg);
        } finally {
            this.isSaving=false;
        }
    }

    /**
     * Save a single question (parent or child):
     * - Has id -> update (updateCourseQuestions).
     * - No id -> create (addCourseQuestions), then assign the returned id.
     * @param groupId `group_id` written into payload -- for a child, this is the parent id.
     * @param parent Parent question (children inherit code/cdr/cdr_id/private when missing).
     */
    private saveSingleQuestion(q: AiQuestion, groupId: number, parent?: AiQuestion): Promise<number> {
        const payload = this.buildSavePayload(q, groupId, parent);
        const request = q['id']
            ? this.courseQuestionsService.updateCourseQuestions(Number(q['id']), payload)
            : this.courseQuestionsService.addCourseQuestions(payload);

        return firstValueFrom(request).then((id: unknown): number => {
            const newId = id === null || id === undefined ? (Number(q['id']) ||0) : Number(id);
            q['id'] = newId;
            q.group_id = groupId;
            return newId;
        });
    }

    /**
     * Prepare save payload -- mirrors `filterNecessaryFieldsForUpdate()`
     * in `cauhoi-tracnghiem-create-form` (reference = 'course_plan_activities').
     */
    private buildSavePayload(q: AiQuestion, groupId: number, parent?: AiQuestion): any {
        const isKthp = this.selectCdr?.week ===100;
        const code = q.code || parent?.code || '';
        const cdr = q.cdr ?? parent?.cdr ?? this.activeLevelId ??1;
        const cdrId = q.cdr_id ?? parent?.cdr_id ?? null;
        const privateVal = (q.private !== undefined && q.private !== null)
            ? q.private
            : ((parent?.private !== undefined && parent?.private !== null) ? parent.private :0);
        return {
            question_direction: q.question_direction || '',
            question_type: q.question_type,
            answer_option: Array.isArray(q.answer_option) ? q.answer_option : [],
            answer_correct: q.answer_correct || '',
            group_id: groupId,
            media: q.media ?? null,
            part: q['part'] ??0,
            cdr,
            question_number: q.question_number ??0,
            code,
            raw_answer: q.raw_answer || '',
            config: q.config ?? { cols:1, invertedAnswer:false },
            reference: 'course_plan_activities',
            reference_id: this.selectCdr?.id ?? null,
            course_id: this.selectCdr?.course_id ?? null,
            status: q['status'] ??0,
            cdr_id: cdrId,
            private:isKthp ? 1 : privateVal,
            week: this.selectCdr?.week ?? null,
            question_root_id: 0,
            old_status: q['old_status'] ??0
        };
    }
}
