import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { Answers, CourseQuestions } from '@modules/shared/models/course-questions';
import { SharedModule } from '@modules/shared/shared.module';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';


export interface CourseQuestionDragDrop extends CourseQuestions {
    answer?: Answers[];
}

@Component({
    selector: 'app-grouping-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DragDropModule,
        LoadMediaOnTextDirective,
        KatexImgDirective,
        SharedModule
    ],

    templateUrl: './grouping-editor.component.html',
    styleUrls: ['./grouping-editor.component.css']
})
export class GroupingEditorComponent implements OnInit {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    countChangeImg: number = 0;

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    /**
     * Pool đáp án riêng — clone từ `answer_option` của parent khi load.
     * Mọi thay đổi (filter / sort / push) chỉ tác động lên `pool`, KHÔNG mutate `answer_option` gốc.
     */
    pool: Answers[] = [];

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {

            this.course_question = this.courseQuestion;

            if (this.course_question.children) {
                this.course_question['dropListIds'] = [
                    'pool',
                    ...this.course_question.children.map((_, i) => 'drop-' + i)
                ];
            } else {
                this.course_question['dropListIds'] = ['pool'];
            }

            if (this.course_question.answer_option) {
                // clone ra pool riêng — không mutate `answer_option` của parent
                this.pool = this.helperService.sort([...this.course_question.answer_option], 'value');
            }

            this.getIsCorrectAns(this.course_question);

            this.course_question['title_part'] = (this.courseQuestion.code ?? '').replace(/\-/gi, ' ');

            this.countChangeImg++;
        }
    }

    ngOnInit(): void {

    }

    getIsCorrectAns(question: CourseQuestions) {
        if (question.children) {
            const index = this.course_question.children.findIndex(m => m.question_number);
            if (index !== -1) {
                this.course_question.children = this.helperService.sort(this.course_question.children, 'question_number');
            } else {
                this.course_question.children = this.helperService.sort(this.course_question.children, 'id');
            }
            question.children.forEach(c => {
                c['answer'] = [];
                const correctIds = c.answer_correct
                    ? c.answer_correct.replace(/\|/gi, '').split(';').filter(m => m).map(id => String(id))
                    : [];
                if (correctIds.length && this.pool.length) {
                    const matched: Answers[] = [];
                    this.pool = this.pool.filter((opt: Answers) => {
                        const match = correctIds.includes(String(opt.id));
                        if (match) matched.push(opt);
                        return !match;
                    });
                    c['answer'] = this.helperService.sort(matched, 'value');
                }
            });
        }
    }

    /**
     * Sync `answer_correct` của một child theo các đáp án đang nằm trong `sentence-list`.
     * Format: `|id1;id2;id3|` — strip pipe, split `;`.
     */
    syncAnswer(item: CourseQuestionDragDrop) {
        const ids = (item.answer || []).map(a => a.id).join(';');
        item.answer_correct = ids ? `|${ids}|` : '';
    }


    dropMatching(event: CdkDragDrop<any>, q: CourseQuestions, item?: CourseQuestionDragDrop) {
        // kéo trong cùng list
        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            if (item) this.syncAnswer(item);
            this.countChangeImg++;
            return;
        }

        // kéo giữa các list
        transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
        );
        this.countChangeImg++;
        // item = drop zone (vừa nhận), container = pool (vừa bị lấy)
        if (item) {
            this.syncAnswer(item);
        } else if (q.children && event.previousContainer.id?.startsWith('drop-')) {
            // kéo từ drop-{i} về pool — sync child vừa bị rút theo id
            const idx = parseInt(event.previousContainer.id.split('-')[1], 10);
            if (!isNaN(idx) && q.children[idx]) {
                this.syncAnswer(q.children[idx]);
            }
        }
    }

    returnToPool(q: CourseQuestions, item: CourseQuestionDragDrop, answer: any) {
        item.answer = item.answer.filter((a: Answers) => a.id !== answer.id);

        // trả về pool riêng (không mutate `answer_option` của parent), tránh trùng + sort lại
        if (!this.pool.find(a => a.id === answer.id)) {
            this.pool = this.helperService.sort([...this.pool, answer], 'value');
        }

        this.syncAnswer(item);
        this.countChangeImg++;
    }
}
