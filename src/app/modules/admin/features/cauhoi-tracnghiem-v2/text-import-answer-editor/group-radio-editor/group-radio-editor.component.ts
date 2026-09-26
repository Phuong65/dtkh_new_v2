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
import { SharedModule } from "../../../../../shared/shared.module";

export interface ANSEXTEND extends Answers {
    isSelected?: boolean;
}

@Component({
    selector: 'app-group-radio-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        LoadMediaOnTextDirective,
        KatexImgDirective,
        SharedModule,
        IctuMediaLinkPipe
    ],
    templateUrl: './group-radio-editor.component.html',
    styleUrls: ['./group-radio-editor.component.css']
})
export class GroupRadioEditorComponent implements OnInit, OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    key_ans = KEY_ANSWER_new;

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {
            this.course_question = this.courseQuestion;
            this.syncData(this.course_question);
            if (this.course_question.children && this.course_question.children.length) {
                const index = this.course_question.children.findIndex(m => m.question_number);
                this.course_question.children = index !== -1
                    ? this.helperService.sort(this.course_question.children, 'question_number')
                    : this.helperService.sort(this.course_question.children, 'id');

                this.course_question.children.forEach(f => this.syncData(f));
            }

            this.course_question['title_part'] = (this.course_question.code ?? '').replace(/\-/gi, ' ');
        }
    }

    syncData(question: CourseQuestions) {
        if (question.answer_correct) {
            const raw = question.answer_correct.replace(/\|/g, '');
            const correctIds = raw.includes(',') ? raw.split(",") : [raw];
            question.answer_option?.forEach(f => {
                f['isSelected'] = correctIds.includes(String(f.id));
            });
        }
    }

    ngOnInit(): void {

    }

    getColClass(q: CourseQuestions) {
        const layout = q.config?.cols;
        const map: any = { 1: 'col-12', 2: 'col-6', 3: 'col-4', 4: 'col-3' };
        return map[layout] || 'col-6';
    }

    onSelect(q: CourseQuestions, ans: ANSEXTEND) {
        if (this.course_question.question_type === 'group-radio') {
            q.answer_option.forEach((a: any) => a.isSelected = false);
            ans.isSelected = true;
        } else {
            ans.isSelected = !ans.isSelected;
        }
        this.syncAnswer(q);
    }

    syncAnswer(q: CourseQuestions) {
        const selected = q.answer_option.filter(a => (a as ANSEXTEND).isSelected).map(a => a.id);
        if (this.course_question.question_type === 'group-radio') {
            q.answer_correct = selected.length ? `|${selected[0]}|` : '';
        } else {
            q.answer_correct = selected.length ? `|${selected.join(',')}|` : '';
        }
    }

    getKey(index) {
        return String.fromCharCode(65 + index);
    }
}
