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
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';


export interface CourseQuestionDragDrop extends CourseQuestions {
    answer?: Answers[];
    correct_id?: string;
}

@Component({
    selector: 'app-question-type-drag-drop',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DragDropModule,
        LoadMediaOnTextDirective,
        KatexImgDirective,
        SharedModule,
        IctuMediaLinkPipe
    ],
    templateUrl: './question-type-drag-drop.component.html',
    styleUrls: ['./question-type-drag-drop.component.css']
})
export class QuestionTypeDragDropComponent implements OnInit, OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    @Input() isReadOnly: boolean = true;

    countChangeImg: number = 0;

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {

            this.course_question = this.courseQuestion;

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
                const answer_correct = c.answer_correct ? c.answer_correct.replace(/\D/g, '') : '';
                c['correct_id'] = answer_correct;
            })
        }
    }


    dropMatching(event: CdkDragDrop<any>, q: CourseQuestions, item?: CourseQuestionDragDrop) {
        if (this.isReadOnly) return;

        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            return;
        }

        if (item) {
            if (item.answer.length > 0) {
                const old = item.answer.pop();
                q.answer_option.push(old);
            }

            transferArrayItem(
                event.previousContainer.data,
                item.answer,
                event.previousIndex,
                0
            );
        } else {
            transferArrayItem(
                event.previousContainer.data,
                q.answer_option,
                event.previousIndex,
                event.currentIndex
            );
        }

        this.countChangeImg++;
    }

    returnToPool(q: CourseQuestions, item: CourseQuestionDragDrop, answer: any) {
        if (this.isReadOnly) return;

        // remove khỏi câu hỏi
        item.answer = item.answer.filter(a => a.id !== answer.id);

        // trả về pool
        q.answer_option.push(answer);

        this.countChangeImg++;
    }

    getCorrectAnswer(q: CourseQuestions, item: CourseQuestions, index: number): string {
        const correctId = item['correct_id'];

        let found = q.answer_option.find(a => String(a.id) === String(correctId));

        if (found) return found.value;

        for (let m of q.children) {
            const ans = m['answer'].find(a => String(a.id) === String(correctId));
            if (ans) return ans.value;
        }

        return '';
    }
}
