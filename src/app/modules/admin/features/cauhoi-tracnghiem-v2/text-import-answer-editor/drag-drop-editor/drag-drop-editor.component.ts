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
    selector: 'app-drag-drop-editor',
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
    templateUrl: './drag-drop-editor.component.html',
    styleUrls: ['./drag-drop-editor.component.css']
})
export class DragDropEditorComponent implements OnInit, OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    countChangeImg: number = 0;

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    pool: Answers[] = [];

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {

            this.course_question = this.courseQuestion;

            // Tách pool: clone answer_option, KHÔNG mutate parent.
            // Reset in-place để giữ reference CDK đã capture.
            this.pool.length = 0;
            const cloned = [...(this.course_question.answer_option ?? [])];
            this.pool.push(...this.helperService.sort(cloned, 'value'));

            this.getIsCorrectAns(this.course_question);

            this.course_question['title_part'] = (this.courseQuestion.code ?? '').replace(/\-/gi, ' ');

            this.countChangeImg++;
        }
    }

    ngOnInit(): void {

    }

    getIsCorrectAns(question: CourseQuestions) {
        if (!question.children) return;

        // Sync ngược answer_correct từ item.answer trước khi sort children
        // để không mất đáp án đã kéo khi children bị sắp xếp lại
        question.children.forEach(c => {
            const arr = c['answer'] as Answers[] | undefined;
            if (arr?.length) {
                c.answer_correct = '|' + arr.map(a => a.id).join(';') + '|';
            }
        });

        const index = question.children.findIndex(m => m.question_number);
        if (index !== -1) {
            question.children = this.helperService.sort(question.children, 'question_number');
        } else {
            question.children = this.helperService.sort(question.children, 'id');
        }

        question.children.forEach(c => {
            c['answer'] = [];
            const correctIds = c.answer_correct
                ? c.answer_correct.replace(/\|/gi, '').split(';').filter(m => m).map(id => String(id))
                : [];
            if (correctIds.length && this.pool.length) {
                const matched: Answers[] = [];
                // Splice từ cuối để loại đáp án đã gán khỏi pool (tránh duplicate hiển thị)
                for (let i = this.pool.length - 1; i >= 0; i--) {
                    if (correctIds.includes(String(this.pool[i].id))) {
                        matched.push(this.pool[i]);
                        this.pool.splice(i, 1);
                    }
                }
                c['answer'] = this.helperService.sort(matched, 'value');
            }
        });
    }

    syncAnswer(item: CourseQuestionDragDrop) {
        item.answer_correct = item.answer?.length
            ? '|' + item.answer.map(a => a.id).join(';') + '|'
            : '';
    }


    dropMatching(event: CdkDragDrop<any>, q: CourseQuestions, item?: CourseQuestionDragDrop) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            if (item) this.syncAnswer(item);
            this.countChangeImg++;
            return;
        }

        if (item) {
            this.countChangeImg++;
            // Kéo vào zone (item = zone đích)
            if (item.answer.length > 0) {
                const old = item.answer.pop();
                if (!this.pool.some(a => a.id === old.id)) {
                    this.pool.push(old);
                }
            }

            transferArrayItem(
                event.previousContainer.data,
                item.answer,
                event.previousIndex,
                0
            );
            this.syncAnswer(item);

            // Nếu kéo từ zone khác (không phải pool), sync zone nguồn
            if (event.previousContainer.id?.startsWith('drop-')) {
                const i = parseInt(event.previousContainer.id.replace('drop-', ''), 10);
                if (!isNaN(i) && q.children[i]) {
                    this.syncAnswer(q.children[i]);
                }
            }
        } else {
            // Kéo về pool
            transferArrayItem(
                event.previousContainer.data,
                this.pool,
                event.previousIndex,
                event.currentIndex
            );
            this.pool = this.helperService.sort(this.pool, 'value');
            const fromZoneId = event.previousContainer.id;
            if (fromZoneId?.startsWith('drop-')) {
                const i = parseInt(fromZoneId.replace('drop-', ''), 10);
                this.syncAnswer(q.children[i]);
            }
            this.countChangeImg++;
        }
    }

    returnToPool(q: CourseQuestions, item: CourseQuestionDragDrop, answer: any) {
        // remove khỏi câu hỏi
        item.answer = item.answer.filter(a => a.id !== answer.id);

        // trả về pool (tránh duplicate, mutate in-place)
        if (!this.pool.some(a => a.id === answer.id)) {
            this.pool.push(answer);
            this.pool = this.helperService.sort(this.pool, 'value');
        }

        this.syncAnswer(item);
        this.countChangeImg++;
    }
}