import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { SharedModule } from '@modules/shared/shared.module';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';

@Component({
    selector: 'app-arrange-paragraphs-editor',
    standalone: true,
    imports: [
        CommonModule,
        DragDropModule,
        LoadMediaOnTextDirective,
        KatexImgDirective,
        SharedModule,
        IctuMediaLinkPipe
    ],
    templateUrl: './arrange-paragraphs-editor.component.html',
    styleUrls: ['./arrange-paragraphs-editor.component.css']
})
export class ArrangeParagraphsEditorComponent implements OnChanges {
    @Input() courseQuestion: CourseQuestions | any;

    @Input() av: number; // 1: môn tiếng anh

    token: string = this.auth.accessToken;

    course_question: CourseQuestions;

    /** Per-question options map. Khi av === 1 mỗi child là 1 câu arrange riêng;
     *  khi av !== 1 key = course_question.id. Mọi moveItemInArray chỉ tác động map này,
     *  KHÔNG mutate answer_option gốc trên parent/child. */
    optionsByQ: { [id: string]: any[] } = {};

    /** Vị trí gốc của mỗi item trong answer_option (trước reorder). order-badge dùng để hiển thị. */
    originalIndexByQ: { [id: string]: { [itemId: string]: number } } = {};

    constructor(
        private helperService: HelperService,
        private auth: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseQuestion'] && this.courseQuestion) {
            this.course_question = this.courseQuestion;

            // Build options map + original index map: mỗi câu hỏi (child hoặc chính course_question) clone answer_option riêng
            this.optionsByQ = {};
            this.originalIndexByQ = {};
            if (this.course_question.children && this.course_question.children.length) {
                this.course_question.children.forEach(child => {
                    this.optionsByQ[child.id] = this.buildOptions(child);
                    this.originalIndexByQ[child.id] = this.buildIndexMap(child.answer_option);
                });
            } else {
                this.optionsByQ[this.course_question.id] = this.buildOptions(this.course_question);
                this.originalIndexByQ[this.course_question.id] = this.buildIndexMap(this.course_question.answer_option);
            }

            if (this.course_question.children && this.course_question.children.length) {
                const index = this.course_question.children.findIndex(m => m.question_number);
                if (index !== -1) {
                    this.course_question.children = this.helperService.sort(this.course_question.children, 'question_number');
                } else {
                    this.course_question.children = this.helperService.sort(this.course_question.children, 'id');
                }
            }

            this.course_question['title_part'] = (this.course_question.code ?? '').replace(/\-/gi, ' ');
        }
    }

    drop(event: CdkDragDrop<string[]>, q: any) {
        const list = this.optionsByQ[q.id];
        if (!list) return;
        moveItemInArray(list, event.previousIndex, event.currentIndex);
        this.syncAnswer(q);
    }

    /** Sync options[q.id] → q.answer_correct format |id1,id2,id3,| */
    syncAnswer(q: any) {
        if (!q) return;
        const list = this.optionsByQ[q.id];
        q.answer_correct = list?.length
            ? '|' + list.map(o => o.id).join(',') + '|'
            : '';
    }

    /** Build map itemId → vị trí gốc (1-based cho badge) từ answer_option gốc. */
    private buildIndexMap(answerOption: any[] | undefined): { [itemId: string]: number } {
        const map: { [id: string]: number } = {};
        (answerOption || []).forEach((item, idx) => {
            map[item.id] = idx + 1;
        });
        return map;
    }

    /** Build options theo thứ tự answer_correct nếu có, fallback về answer_option.
     *  Format answer_correct: |id1,id2,id3,| — parse lấy ordered ids. */
    private buildOptions(q: any): any[] {
        const source = [...(q.answer_option || [])];
        const correct = q.answer_correct;
        if (!correct) return source;
        const ids = correct.replace(/\|/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
        if (!ids.length) return source;
        const byId = new Map(source.map(item => [item.id, item]));
        const ordered: any[] = [];
        ids.forEach((id: string) => {
            const item = byId.get(id);
            if (item) {
                ordered.push(item);
                byId.delete(id);
            }
        });
        // Append items không có trong answer_correct (defensive)
        byId.forEach(item => ordered.push(item));
        return ordered;
    }
}
