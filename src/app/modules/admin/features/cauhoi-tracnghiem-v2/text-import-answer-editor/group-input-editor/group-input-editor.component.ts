import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';


@Component({
    selector: 'app-group-input-editor',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        KatexImgDirective,
        LoadMediaOnTextDirective
    ],
    templateUrl: './group-input-editor.component.html', 
    styleUrls: ['./group-input-editor.component.css']
})
export class GroupInputEditorComponent implements OnInit, OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    /** Input trống cuối danh sách dùng để thêm đáp án mới, key = child.id */
    newAnswerInput: { [qId: string]: string } = {};

    /** Input sửa đáp án đã có, key = `${child.id}|${index}` */
    editingAnswer: { [key: string]: string } = {};

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {

            this.course_question = this.courseQuestion;

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

            this.course_question['title_part'] = (this.courseQuestion.code ?? '').replace(/\-/gi, ' ');
        }
    }

    getIsCorrectAns(question: CourseQuestions) {
        if (question.answer_correct) {
            const answer_correct = question.answer_correct.split("|").filter((m: string) => m && m !== '');
            question['new_answer_correct'] = answer_correct;
        } else {
            question['new_answer_correct'] = question['new_answer_correct'] ?? [];
        }
    }

    ngOnInit(): void {

    }

    /** Key trong map editingAnswer cho 1 ô input sửa đáp án */
    editKey(q: any, index: number): string {
        return `${q.id}|${index}`;
    }

    /** Lấy giá trị hiện đang sửa — fallback về giá trị trong model */
    getEditingValue(q: any, index: number): string {
        const key = this.editKey(q, index);
        return key in this.editingAnswer ? this.editingAnswer[key] : (q['new_answer_correct']?.[index] ?? '');
    }

    /** User gõ vào ô sửa — lưu vào map, KHÔNG sync model ngay */
    onEditInputChange(q: any, index: number, value: string): void {
        this.editingAnswer[this.editKey(q, index)] = value;
    }

    /** Enter hoặc blur → commit giá trị vào model + sync answer_correct */
    onEditCommit(q: any, index: number): void {
        const key = this.editKey(q, index);

        // Chưa chỉnh sửa gì → không xóa, không sync (tránh mất đáp án khi focus rồi blur ngay)
        if (!(key in this.editingAnswer)) {
            return;
        }

        const raw = this.editingAnswer[key].trim();

        if (!q['new_answer_correct']) {
            q['new_answer_correct'] = [];
        }

        if (raw === '') {
            // empty → xóa đáp án khỏi danh sách
            q['new_answer_correct'].splice(index, 1);
        } else {
            q['new_answer_correct'][index] = raw;
        }

        delete this.editingAnswer[key];
        this.syncAnswerCorrect(q);

    }

    /** User gõ vào ô "Thêm đáp án" — lưu vào map, KHÔNG commit ngay */
    onNewInputChange(q: any, value: string): void {
        this.newAnswerInput[q.id] = value;
    }

    /** Enter hoặc blur → nếu không rỗng thì push vào danh sách + sync */
    onNewCommit(q: any): void {
        const raw = (this.newAnswerInput[q.id] ?? '').trim();
        if (raw === '') {
            this.newAnswerInput[q.id] = '';
            return;
        }

        if (!q['new_answer_correct']) {
            q['new_answer_correct'] = [];
        }
        q['new_answer_correct'].push(raw);
        this.newAnswerInput[q.id] = '';
        this.syncAnswerCorrect(q);
    }

    /** Xóa đáp án tại index + sync */
    removeAnswer(q: any, index: number): void {
        if (!q['new_answer_correct']) return;
        q['new_answer_correct'].splice(index, 1);
        delete this.editingAnswer[this.editKey(q, index)];
        this.syncAnswerCorrect(q);
    }

    /** Rebuild answer_correct theo format `|a|b|c|` */
    syncAnswerCorrect(q: any): void {
        const arr: string[] = q['new_answer_correct'] ?? [];
        q.answer_correct = '|' + arr.join('|') + '|';
    }

    /** trackBy cho ngFor — giữ identity theo index để không recreate DOM input khi splice */
    trackByIndex(index: number, item?: any): number {
        return index;
    }
}
