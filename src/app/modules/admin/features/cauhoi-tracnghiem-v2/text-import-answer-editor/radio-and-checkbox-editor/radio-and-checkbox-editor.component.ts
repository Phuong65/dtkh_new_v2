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
    selector: 'app-radio-and-checkbox-editor',
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
    templateUrl: './radio-and-checkbox-editor.component.html',
    styleUrls: ['./radio-and-checkbox-editor.component.css']
})

export class RadioAndCheckboxEditorComponent implements OnInit, OnChanges {
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
            this.preloadSelection(this.course_question);
            if (this.course_question.children && this.course_question.children.length) {
                const index = this.course_question.children.findIndex(m => m.question_number);
                if (index !== -1) {
                    this.course_question.children = this.helperService.sort(this.course_question.children, 'question_number');
                } else {
                    this.course_question.children = this.helperService.sort(this.course_question.children, 'id');
                }
                this.course_question.children.forEach(f => this.preloadSelection(f));
            }

            this.course_question['title_part'] = (this.course_question.code ?? '').replace(/\-/gi, ' ');
            this.preloadSelection(this.course_question, true);
        }
    }

    /**
     * Parse `answer_correct` (`|id|` / `|id1,id2|`) → set `isSelected` cho từng option.
     * @param recursive nếu true, đệ quy xuống từng `children` (đến tận leaf).
     */
    preloadSelection(question: CourseQuestions, recursive = false) {
        if (question.answer_correct && question.answer_option) {
            const correctIds = question.answer_correct.replace(/\|/g, '').split(",");
            question.answer_option.forEach(o => {
                o['isSelected'] = correctIds.includes(o.id);
            });
        }
        if (recursive && question.children?.length) {
            question.children.forEach(c => this.preloadSelection(c, true));
        }
    }

    /**
     * User chọn số đáp án / 1 hàng cho câu `q`. Khởi tạo `q.config` nếu thiếu.
     * 1 → col-12, 2 → col-6, 3 → col-4, 4 → col-3 (xem `getColClass`).
     */
    setCols(q: CourseQuestions, cols: number) {
        if (!q.config) {
            q.config = {} as any;
        }
        (q.config as any).cols = cols;
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
        if (q.question_type === 'radio') {
            q.answer_option.forEach((a: any) => a.isSelected = false);
            ans.isSelected = true;
            q.answer_correct = `|${ans.id}|`;
        } else {
            ans.isSelected = !ans.isSelected;
            const selectedIds = (q.answer_option as any[])
                .filter(a => a.isSelected)
                .map(a => a.id)
                .join(',');
            q.answer_correct = selectedIds ? `|${selectedIds}|` : '';
        }
    }

    getKey(index: number) {
        return String.fromCharCode(65 + index);
    }
}
