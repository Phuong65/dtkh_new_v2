import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { SharedModule } from "../../../../../shared/shared.module";

@Component({
    selector: 'app-reorder-words-editor',
    standalone: true,
    imports: [
        CommonModule,
        LoadMediaOnTextDirective,
        KatexImgDirective,
        ReactiveFormsModule,
        FormsModule,
        SharedModule,
        IctuMediaLinkPipe
    ],
    templateUrl: './reorder-words-editor.component.html',
    styleUrls: ['./reorder-words-editor.component.css']
})
export class ReorderWordsEditorComponent implements OnInit, OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion']) {
            this.course_question = this.courseQuestion;
            if (!this.course_question) return;

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

            this.course_question['title_part'] = String(this.course_question.code || '').replace(/\-/gi, ' ');
        }
    }

    getIsCorrectAns(question: CourseQuestions) {
        question['shuffledWords'] = String(question.question_direction || '').split("/").map(m => m.trim()).filter(m => m && m !== '');
        const answer = String(question.answer_correct || '');
        // format: |câu hoàn chỉnh| -> strip | -> split space ra từng từ
        const initial = answer.split("|").map(m => m.trim()).filter(m => m && m !== '')
            .flatMap(sentence => sentence.split(" ").map(w => w.trim()).filter(w => w && w !== ''));
        question['userSentence'] = question['userSentence'] && question['userSentence'].length ? question['userSentence'] : initial;
    }

    syncAnswer(q: any) {
        const sentence: string[] = q.userSentence || [];
        q.answer_correct = sentence.length ? '|' + sentence.join(' ') + '|' : '';
    }

    ngOnInit(): void {

    }

    addWord(q: any, word: string) {
        q.userSentence = q.userSentence || [];
        q.userSentence.push(word);
        this.syncAnswer(q);
    }

    removeWord(q: any, index: number) {
        if (!q.userSentence) return;
        q.userSentence.splice(index, 1);
        this.syncAnswer(q);
    }

    isWordUsed(q: any, word: string): boolean {
        const userSentence = q.userSentence || [];
        const shuffledWords = q.shuffledWords || [];
        const usedCount = userSentence.filter((w: string) => w === word).length;
        const poolCount = shuffledWords.filter((w: string) => w === word).length;
        return usedCount >= poolCount;
    }
}
