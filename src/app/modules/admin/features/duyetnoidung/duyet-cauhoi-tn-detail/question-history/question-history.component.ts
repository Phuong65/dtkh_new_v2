import { CommonModule } from '@angular/common';
import { Component, OnChanges, SimpleChanges, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CourseQuestionCommentService } from '@modules/shared/services/course-question-comment.service';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { SharedModule } from '@modules/shared/shared.module';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { QuestionTypeRadioAndCheckboxComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-radio-and-checkbox/question-type-radio-and-checkbox.component';
import { QuestionTypeInputboxComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-inputbox/question-type-inputbox.component';
import { QuestionTypeReorderWordsComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-reorder-words/question-type-reorder-words.component';
import { QuestionTypeArrangeParagraphsComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-arrange-paragraphs/question-type-arrange-paragraphs.component';
import { QuestionTypeDragDropComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-drag-drop/question-type-drag-drop.component';
import { QuestionTypeGroupInputComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-group-input/question-type-group-input.component';
import { QuestionTypeGroupRadioComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-group-radio/question-type-group-radio.component';
import { QuestionTypeGroupingComponent } from '../../../cauhoi-tracnghiem-v2/question-types-view/question-type-grouping/question-type-grouping.component';

interface HistoryComment {
    id: number;
    comment: string;
    display_name: string;
    cap_hoidong?: string;
}

interface HistoryItem {
    question: CourseQuestions;
    version: number;
    isCurrent: boolean;
    comments: HistoryComment[];
    commentsLoaded: boolean;
    loadingComments: boolean;
}

@Component({
    selector: 'app-question-history',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        QuestionTypeRadioAndCheckboxComponent,
        QuestionTypeInputboxComponent,
        QuestionTypeReorderWordsComponent,
        QuestionTypeArrangeParagraphsComponent,
        QuestionTypeDragDropComponent,
        QuestionTypeGroupInputComponent,
        QuestionTypeGroupRadioComponent,
        QuestionTypeGroupingComponent,
    ],
    templateUrl: './question-history.component.html',
    styleUrls: ['./question-history.component.css']
})
export class QuestionHistoryComponent implements OnChanges {
    private courseQuestionsService = inject(CourseQuestionsService);
    private courseQuestionCommentService = inject(CourseQuestionCommentService);

    readonly currentQuestion = input<CourseQuestions | null>(null);
    readonly av = input<number>(0);
    readonly courseId = input<number>(0);

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    readonly historyItems = signal<HistoryItem[]>([]);
    readonly isExpanded = signal(false);
    readonly loadingHistory = signal(false);
    readonly expandedVersion = signal<number | null>(null);
    readonly historyCount = signal(0);
    readonly historyCountLoaded = signal(false);
    readonly historyLoaded = signal(false);

    private historyLoadToken = 0;
    private ancestorLoadPromise: Promise<CourseQuestions[]> | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentQuestion']) {
            this.historyLoadToken++;
            this.historyItems.set([]);
            this.isExpanded.set(false);
            this.loadingHistory.set(false);
            this.expandedVersion.set(null);
            this.historyLoaded.set(false);
            this.historyCount.set(0);
            this.historyCountLoaded.set(false);
            this.ancestorLoadPromise = null;
            this.loadHistoryCount();
        }
    }

    toggleExpand(): void {
        this.isExpanded.set(!this.isExpanded());
        if (this.isExpanded() && !this.historyLoaded() && !this.loadingHistory()) {
            this.loadHistory();
        }
    }

    toggleVersionDetail(version: number): void {
        if (this.expandedVersion() === version) {
            this.expandedVersion.set(null);
        } else {
            this.expandedVersion.set(version);
            // Load comments for this version if not loaded yet
            const item = this.historyItems().find(h => h.version === version);
            if (item && !item.commentsLoaded && !item.loadingComments && !item.isCurrent) {
                this.loadCommentsForVersion(item);
            }
        }
    }

    private async loadHistoryCount(): Promise<void> {
        if (Number(this.currentQuestion()?.question_root_id) <= 0) return;

        const loadToken = this.historyLoadToken;
        try {
            const ancestors = await this.getAncestorQuestions();
            if (loadToken !== this.historyLoadToken) return;
            this.historyCount.set(ancestors.length);
            this.historyCountLoaded.set(true);
        } catch (e) {
            console.error('Error loading question history count:', e);
        }
    }

    private async loadHistory(): Promise<void> {
        const currentQuestion = this.currentQuestion();
        if (Number(currentQuestion?.question_root_id) <= 0) return;

        const loadToken = this.historyLoadToken;
        this.loadingHistory.set(true);

        try {
            const ancestors = await this.getAncestorQuestions();
            const questions = await Promise.all(
                [...ancestors].reverse().concat(currentQuestion).map(question =>
                    this.attachChildren(question)
                )
            );
            if (loadToken !== this.historyLoadToken) return;

            const allItems: HistoryItem[] = questions.map((question, index) => ({
                question,
                version: index + 1,
                isCurrent: index === questions.length - 1,
                comments: [],
                commentsLoaded: index === questions.length - 1,
                loadingComments: false,
            }));

            this.historyItems.set(allItems.reverse());
            this.historyCount.set(Math.max(questions.length - 1, 0));
            this.historyCountLoaded.set(true);
            this.historyLoaded.set(true);
        } catch (e) {
            console.error('Error loading question history:', e);
        } finally {
            if (loadToken === this.historyLoadToken) {
                this.loadingHistory.set(false);
            }
        }
    }

    private getAncestorQuestions(): Promise<CourseQuestions[]> {
        if (!this.ancestorLoadPromise) {
            this.ancestorLoadPromise = this.fetchAncestorQuestions();
        }
        return this.ancestorLoadPromise;
    }

    private async fetchAncestorQuestions(): Promise<CourseQuestions[]> {
        const history: CourseQuestions[] = [];
        const visited = new Set<number>();
        let rootId = Number(this.currentQuestion()?.question_root_id);

        while (rootId && !visited.has(rootId) && history.length < 20) {
            visited.add(rootId);
            const parents = await firstValueFrom(
                this.courseQuestionsService.getCourseQuestionsByCol('id', rootId)
            );
            const parent = parents?.[0];
            if (!parent) break;
            history.push(parent);
            rootId = Number(parent.question_root_id);
        }

        return history;
    }

    private async attachChildren(question: CourseQuestions): Promise<CourseQuestions> {
        if (!question.id) {
            return { ...question, children: [] };
        }

        const children = await firstValueFrom(
            this.courseQuestionsService.getCourseQuestionsByCol('group_id', question.id)
        );

        const isCurrentVersion = Number(question.id) === Number(this.currentQuestion()?.id);

        return {
            ...question,
            children: (children || [])
                .filter(child => !isCurrentVersion || child.status !== -3)
                .sort((a, b) => {
                    const questionNumberA = Number(a.question_number);
                    const questionNumberB = Number(b.question_number);
                    if (questionNumberA !== questionNumberB) {
                        if (!questionNumberA) return 1;
                        if (!questionNumberB) return -1;
                        return questionNumberA - questionNumberB;
                    }
                    return Number(a.id) - Number(b.id);
                })
        };
    }

    private async loadCommentsForVersion(item: HistoryItem): Promise<void> {
        const courseId = this.courseId();
        if (!item.question.id || !courseId) return;

        item.loadingComments = true;

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_question_id', condition: OvicQueryCondition.equal, value: item.question.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: '',
        };

        try {
            const result = await firstValueFrom(
                this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition)
            );

            item.comments = (result.data || []).map((c: any) => ({
                id: c.id,
                comment: c.comment || '',
                display_name: c.user?.display_name || 'Không xác định',
                cap_hoidong: c.cap_hoidong || '',
            }));
            item.commentsLoaded = true;
        } catch (e) {
            console.error('Error loading comments for version:', e);
            item.comments = [];
            item.commentsLoaded = true;
        } finally {
            item.loadingComments = false;
        }
    }
}
