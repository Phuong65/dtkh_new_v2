import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { SharedModule } from '@modules/shared/shared.module';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';

@Component({
    selector: 'app-question-type-arrange-paragraphs',
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
    templateUrl: './question-type-arrange-paragraphs.component.html',
    styleUrls: ['./question-type-arrange-paragraphs.component.css']
})
export class QuestionTypeArrangeParagraphsComponent implements OnInit, OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    @Input() isReadOnly: boolean = true;

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {
            this.course_question = this.courseQuestion;

            this.getIsCorrectAns(this.course_question);

            if (this.course_question.children && this.course_question.children.length) {
                const index = this.course_question.children.findIndex(m => m.question_number);
                if (index !== -1) {
                    this.course_question.children = this.helperService.sort(this.course_question.children, 'question_number');
                } else {
                    this.course_question.children = this.helperService.sort(this.course_question.children, 'id');
                }
                this.course_question.children.forEach(f => {
                    this.getIsCorrectAns(f);
                })
            }

            this.course_question['title_part'] = (this.course_question.code ?? '').replace(/\-/gi, ' ');
        }
    }

    ngOnInit(): void {

    }

    getIsCorrectAns(question: CourseQuestions) {
        if (question.answer_correct) {
            const answer_correct = question.answer_correct.replace(/\|/g, '').split(",");
            question['new_answer_correct'] = answer_correct;
        }
    }

    drop(event: CdkDragDrop<string[]>, q: any) {
        if (this.isReadOnly) return;
        moveItemInArray(q.answer_option, event.previousIndex, event.currentIndex);
    }
}
