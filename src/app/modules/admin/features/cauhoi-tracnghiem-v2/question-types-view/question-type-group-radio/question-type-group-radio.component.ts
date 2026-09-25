import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { Answers, CourseQuestions } from '@modules/shared/models/course-questions';
import { KEY_ANSWER_new } from '@modules/shared/utils/syscat';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from "../../../../../shared/shared.module";

export interface ANSEXTEND extends Answers {
    isSelected?: boolean;
    isCorrect?: boolean;
}

@Component({
    selector: 'app-question-type-group-radio',
    standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoadMediaOnTextDirective,
    KatexImgDirective,
    ButtonModule,
    SharedModule,
    IctuMediaLinkPipe
],
    templateUrl: './question-type-group-radio.component.html',
    styleUrls: ['./question-type-group-radio.component.css']
})
export class QuestionTypeGroupRadioComponent implements OnInit, OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    @Input() isReadOnly: boolean = true;

    @Input() buttonKiemtra: boolean = false;

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    key_ans = KEY_ANSWER_new;

    isSelected: Answers[];

    showAns: boolean = false;

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {
            this.course_question = this.courseQuestion;
            this.showAns = false;
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

    getIsCorrectAns(question: CourseQuestions) {
        if (question.answer_correct) {
            const answer_correct = question.answer_correct.replace(/\|/g, '').split(",");
            question.answer_option?.forEach(f => {
                f['isCorrect'] = answer_correct.includes(f.id);
            })
        }
    }

    ngOnInit(): void {

    }

    getColClass(q: CourseQuestions) {
        if (q.config && q.config.cols) {
            const layout = q.config.cols;
            const map: any = { 1: 'col-12', 2: 'col-6', 3: 'col-4', 4: 'col-3' };
            return map[layout] || 'col-12';
        }

        return 'col-6';
    }

    onSelect(q: CourseQuestions, ans: ANSEXTEND) {
        if (this.isReadOnly) return;
        if (q.question_type === 'group-radio') {
            q.answer_option.forEach((a: any) => a.isSelected = false);
            ans.isSelected = true;
        } else {
            ans.isSelected = !ans.isSelected;
        }
    }

    getKey(index) {
        return String.fromCharCode(65 + index);
    }

    openAns() {
        this.showAns = true;
    }

    getAnsCorrect(question: CourseQuestions) {
        if (question?.answer_correct)
            return question.answer_correct.replace(/\|/g, '');
        return ''
    }
}
