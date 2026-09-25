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
    correct_ids?: string[];
}

@Component({
    selector: 'app-question-type-grouping',
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

    templateUrl: './question-type-grouping.component.html',
    styleUrls: ['./question-type-grouping.component.css']
})
export class QuestionTypeGroupingComponent implements OnInit {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    @Input() isReadOnly: boolean = true;

    countChangeImg: number = 0;

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    answer_option_dup: Answers[] = [];

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {

            this.course_question = this.courseQuestion;

            if (this.course_question.answer_option) {
                this.course_question.answer_option = this.helperService.sort(this.course_question.answer_option, 'value');
                this.answer_option_dup = [...new Set(this.course_question.answer_option)];
            }

            this.getIsCorrectAns(this.course_question);

            this.course_question['title_part'] = (this.courseQuestion.code ?? '').replace(/\-/gi, ' ');
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
                const answer_correct = c.answer_correct ? c.answer_correct.replace(/\|/gi, '').split(";").filter(m => m) : [];
                c['correct_ids'] = answer_correct;
            })
        }
    }


    dropMatching(event: CdkDragDrop<any>, q: CourseQuestions, item?: CourseQuestionDragDrop) {
        if (this.isReadOnly) return;
        // kéo trong cùng list
        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
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
    }

    returnToPool(q: CourseQuestions, item: CourseQuestionDragDrop, answer: any) {
        if (this.isReadOnly) return;

        item.answer = item.answer.filter(a => a.id !== answer.id);

        // tránh trùng
        if (!q.answer_option.find(a => a.id === answer.id)) {
            q.answer_option.push(answer);
        }

        this.countChangeImg++;
    }

    getCorrectAnswer(q: CourseQuestions, item: CourseQuestions, index: number): string {
        const correctId = item['correct_id'];

        let found = q.answer_option.find(a => a.id === correctId);

        if (found) return found.value;

        for (let m of q.children) {
            const ans = m['answer'].find(a => a.id.toString() === correctId.toString());
            if (ans) return ans.value;
        }

        return '';
    }

    getCorrectAnswers(q: CourseQuestionDragDrop, item: CourseQuestionDragDrop): string[] {
        const ids = item.correct_ids || [];
        const idSet = new Set(ids.map(id => String(id)));
        const res = this.helperService.sort(this.answer_option_dup.filter(m => idSet.has(String(m.id))), 'value');
        return res.map(m => m.value) || [];
    }
}
