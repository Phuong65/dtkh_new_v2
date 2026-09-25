import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { QuestionTypeArrangeParagraphsComponent } from '../question-types-view/question-type-arrange-paragraphs/question-type-arrange-paragraphs.component';
import { QuestionTypeDragDropComponent } from '../question-types-view/question-type-drag-drop/question-type-drag-drop.component';
import { QuestionTypeGroupInputComponent } from '../question-types-view/question-type-group-input/question-type-group-input.component';
import { QuestionTypeGroupRadioComponent } from '../question-types-view/question-type-group-radio/question-type-group-radio.component';
import { QuestionTypeGroupingComponent } from '../question-types-view/question-type-grouping/question-type-grouping.component';
import { QuestionTypeInputboxComponent } from '../question-types-view/question-type-inputbox/question-type-inputbox.component';
import { QuestionTypeRadioAndCheckboxComponent } from '../question-types-view/question-type-radio-and-checkbox/question-type-radio-and-checkbox.component';
import { QuestionTypeReorderWordsComponent } from '../question-types-view/question-type-reorder-words/question-type-reorder-words.component';

@Component({
    selector: 'app-text-import-test-preview',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        QuestionTypeRadioAndCheckboxComponent,
        QuestionTypeInputboxComponent,
        QuestionTypeGroupInputComponent,
        QuestionTypeGroupRadioComponent,
        QuestionTypeDragDropComponent,
        QuestionTypeGroupingComponent,
        QuestionTypeReorderWordsComponent,
        QuestionTypeArrangeParagraphsComponent
    ],
    templateUrl: './text-import-test-preview.component.html',
    styleUrls: ['./text-import-test-preview.component.css']
})
export class TextImportTestPreviewComponent implements OnChanges {
    @Input() responseArray: any[] = [];
    @Input() av: number = 0;
    @Input() testTotalCount: number = 0;
    /** 'monkhac' (default) hoặc 'tienganh' */
    @Input() testFormat: string = 'monkhac';

    @Output() checkComplete = new EventEmitter<{ correctCount: number; totalCount: number }>();
    @Output() retryRequested = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();

    /** Đã check đáp án chưa */
    testChecked: boolean = false;

    /** Số câu đúng */
    testCorrectCount: number = 0;

    /** Deep clone của responseArray để retry */
    private initialData: any[] = [];

    /** Tất cả câu hỏi (render đồng loạt) */
    get nonDragQuestions(): any[] {
        return this.responseArray || [];
    }

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['responseArray'] && this.responseArray?.length > 0) {
            this.initialData = this.cloneData(this.responseArray);
            this.resetAllState();
        }
    }

    // ======================== CLONE ========================

    private cloneData(data: any[]): any[] {
        const clone = (globalThis as any).structuredClone;
        if (typeof clone === 'function') {
            return clone(data);
        }
        return JSON.parse(JSON.stringify(data));
    }

    // ======================== COUNT ========================

    countTestableQuestions(): number {
        let count = 0;
        for (const item of this.responseArray) {
            if (item.children?.length && !item.answer_option?.length) {
                count += item.children.length;
            } else if (item.children?.length && ['group-input', 'group-radio', 'drag_drop', 'grouping'].includes(item.question_type)) {
                count += item.children.length;
            } else {
                count++;
            }
        }
        return count;
    }

    // ======================== RESET STATE ========================

    private resetAllState(): void {
        this.testChecked = false;
        this.testCorrectCount = 0;
        this.responseArray.forEach(q => this.resetQuestionState(q));
    }

    private resetQuestionState(q: any): void {
        if (!q) return;
        q.showCorrectAnswer = false;
        q.isWrong = false;
        q.isCorrect = false;

        if (q.answer_option?.length) {
            q.answer_option.forEach((ans: any) => {
                ans.isWrong = false;
            });
        }

        if (Array.isArray(q.answer) && q.answer.length) {
            q.answer.forEach((a: any) => {
                a.isWrong = false;
            });
        }

        if (q.children?.length) {
            q.children.forEach((child: any) => this.resetQuestionState(child));
        }
    }

    // ======================== CHECK ANSWERS ========================

    checkAllAnswers(): void {
        let correctCount = 0;

        this.responseArray.forEach(q => {
            this.resetQuestionState(q);

            // Case 1: Group types with children (group-input, group-radio, drag_drop, grouping)
            if (q.children?.length && ['group-input', 'group-radio', 'drag_drop', 'grouping'].includes(q.question_type)) {
                this.evaluateQuestionCorrectness(q);
                const childCorrectCount = q.children.filter((c: any) => c.isCorrect).length;
                q.showCorrectAnswer = true;
                q.isCorrect = childCorrectCount === q.children.length;
                q.isWrong = !q.isCorrect;
                correctCount += childCorrectCount;
            }
            // Case 2: Pure children question (no answer_option, only children)
            else if (q.children?.length && !q.answer_option?.length) {
                let childOk = 0;
                q.children.forEach(child => {
                    this.resetQuestionState(child);
                    if (this.evaluateQuestionCorrectness(child)) childOk++;
                });
                q.showCorrectAnswer = true;
                q.isCorrect = childOk === q.children.length;
                q.isWrong = !q.isCorrect;
                correctCount += childOk;
            }
            // Case 3: Single question
            else {
                if (this.evaluateQuestionCorrectness(q)) correctCount++;
            }
        });

        this.testCorrectCount = correctCount;
        this.testChecked = true;
        this.checkComplete.emit({ correctCount, totalCount: this.countTestableQuestions() });
    }

    private evaluateQuestionCorrectness(q: any): boolean {
        if (!q) return false;

        switch (q.question_type) {
            case 'radio':
                return this.evaluateRadio(q);
            case 'checkbox':
                return this.evaluateCheckbox(q);
            case 'inputbox':
                return this.evaluateInputbox(q);
            case 'group-input':
                return this.evaluateGroupInput(q);
            case 'group-radio':
                return this.evaluateGroupRadio(q);
            case 'drag_drop':
                return this.evaluateDragDrop(q);
            case 'grouping':
                return this.evaluateGrouping(q);
            case 'reorder_words':
                return this.evaluateReorderWords(q);
            case 'arrange_paragraphs':
                return this.evaluateArrangeParagraphs(q);
            default:
                return false;
        }
    }

    // ======================== EVALUATE METHODS ========================

    /**
     * Radio: user selects one option via isSelected.
     * If has children: evaluate each child separately.
     */
    private evaluateRadio(q: any): boolean {
        // Tiếng Anh format: children have their own answer_option + isSelected
        if (q.children?.length) {
            let allCorrect = true;
            q.children.forEach((child: any) => {
                const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
                const selectedIds = (child.answer_option || []).filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
                const childCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];

                child.showCorrectAnswer = true;
                child.isCorrect = childCorrect;
                child.isWrong = !childCorrect;

                // Mark isCorrect on answer_option items for green highlight
                (child.answer_option || []).forEach((ans: any) => {
                    ans.isCorrect = correctIds.includes(String(ans.id));
                });

                if (!childCorrect) {
                    (child.answer_option || []).forEach((ans: any) => {
                        if (ans.isSelected && !ans.isCorrect) {
                            ans.isWrong = true;
                        }
                    });
                    allCorrect = false;
                }
            });
            q.showCorrectAnswer = true;
            return allCorrect;
        }

        // Mon khác format: evaluate parent answer_option directly
        const correctIds = this.parseCorrectAnswerIds(q.answer_correct);
        const selectedIds = q.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
        const userCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];

        q.showCorrectAnswer = true;

        // Mark isCorrect on answer_option items for green highlight
        q.answer_option.forEach((ans: any) => {
            ans.isCorrect = correctIds.includes(String(ans.id));
        });

        if (!userCorrect) {
            q.answer_option.forEach((ans: any) => {
                if (ans.isSelected && !ans.isCorrect) {
                    ans.isWrong = true;
                }
            });
        }

        return userCorrect;
    }

    /**
     * Checkbox: user selects multiple via isSelected.
     * Must match exact set of correct IDs.
     */
    private evaluateCheckbox(q: any): boolean {
        // Tiếng Anh format with children: evaluate each child
        if (q.children?.length) {
            let allCorrect = true;
            q.children.forEach((child: any) => {
                const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
                const selectedIds = (child.answer_option || []).filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
                const childCorrect = correctIds.length === selectedIds.length && correctIds.every(id => selectedIds.includes(id));

                child.showCorrectAnswer = true;
                child.isCorrect = childCorrect;
                child.isWrong = !childCorrect;

                // Mark isCorrect on answer_option items for green highlight
                (child.answer_option || []).forEach((ans: any) => {
                    ans.isCorrect = correctIds.includes(String(ans.id));
                });

                if (!childCorrect) {
                    (child.answer_option || []).forEach((ans: any) => {
                        if (ans.isSelected && !ans.isCorrect) {
                            ans.isWrong = true;
                        }
                    });
                    allCorrect = false;
                }
            });
            q.showCorrectAnswer = true;
            return allCorrect;
        }

        const correctIds = this.parseCorrectAnswerIds(q.answer_correct);
        const selectedIds = q.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
        const userCorrect = correctIds.length === selectedIds.length && correctIds.every(id => selectedIds.includes(id));

        q.showCorrectAnswer = true;

        // Mark isCorrect on answer_option items for green highlight
        q.answer_option.forEach((ans: any) => {
            ans.isCorrect = correctIds.includes(String(ans.id));
        });

        if (!userCorrect) {
            q.answer_option.forEach((ans: any) => {
                if (ans.isSelected && !ans.isCorrect) {
                    ans.isWrong = true;
                }
            });
        }

        return userCorrect;
    }

    /**
     * Inputbox: user types in userAnswer. Compare with answer_correct (pipe-separated).
     */
    private evaluateInputbox(q: any): boolean {
        if (q.children?.length) {
            let allCorrect = true;
            q.children.forEach((child: any) => {
                const correctValues = this.parseCorrectAnswerValues(child.answer_correct);
                const userAnswer = (child.userAnswer || '').toString().trim().toLowerCase();
                const childCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);

                child.showCorrectAnswer = true;
                child.isCorrect = childCorrect;
                child.isWrong = !childCorrect;

                if (!childCorrect) allCorrect = false;
            });
            return allCorrect;
        }

        const correctValues = this.parseCorrectAnswerValues(q.answer_correct);
        const userAnswer = (q.userAnswer || '').toString().trim().toLowerCase();
        const isCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);

        q.showCorrectAnswer = true;
        q.isWrong = !isCorrect;
        return isCorrect;
    }

    /**
     * Group Input: each child has answer (template uses [(ngModel)]="child.answer").
     * Set new_answer_correct để child component hiển thị "Đáp án đúng:"
     */
    private evaluateGroupInput(q: any): boolean {
        if (!q.children?.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctValues = this.parseCorrectAnswerValues(child.answer_correct);
            // Template binds to child.answer, not child.userAnswer
            const userAnswer = (child.answer || '').toString().trim().toLowerCase();
            const childCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);

            // Set new_answer_correct để template group-input hiển thị "Đáp án đúng:"
            child['new_answer_correct'] = correctValues;

            child.showCorrectAnswer = true;
            child.isCorrect = childCorrect;
            child.isWrong = !childCorrect;

            if (!childCorrect) allCorrect = false;
        });
        return allCorrect;
    }

    /**
     * Group Radio: each child has its own answer_option and isSelected.
     */
    private evaluateGroupRadio(q: any): boolean {
        if (!q.children?.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
            const selectedIds = child.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
            const childCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];

            child.showCorrectAnswer = true;
            child.isCorrect = childCorrect;
            child.isWrong = !childCorrect;

            // Mark isCorrect on answer_option items for green highlight
            child.answer_option.forEach((ans: any) => {
                ans.isCorrect = correctIds.includes(String(ans.id));
            });

            if (!childCorrect) {
                child.answer_option.forEach((ans: any) => {
                    if (ans.isSelected && !ans.isCorrect) {
                        ans.isWrong = true;
                    }
                });
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    /**
     * Drag Drop: each child has answer array, compare with answer_correct (digits).
     */
    private evaluateDragDrop(q: any): boolean {
        if (!q.children?.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctId = this.parseCorrectAnswerIdDigits(child.answer_correct);
            const userAnswerItems = child.answer || [];
            const selectedAnswer = userAnswerItems[0];
            const childCorrect = userAnswerItems.length === 1 && String(selectedAnswer?.id) === correctId;

            child.showCorrectAnswer = true;
            child.isCorrect = childCorrect;
            child.isWrong = !childCorrect;
            child.correct_id = correctId;

            userAnswerItems.forEach((a: any) => {
                a.isCorrect = String(a.id) === correctId;
            });

            if (!childCorrect) {
                userAnswerItems.forEach((a: any) => {
                    if (!a.isCorrect) {
                        a.isWrong = true;
                    }
                });
                child.isWrong = true;
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    /**
     * Grouping: each child has answer array, compare with answer_correct (semicolon).
     */
    private evaluateGrouping(q: any): boolean {
        if (!q.children?.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctIds = this.parseCorrectAnswerIdsSemicolon(child.answer_correct);
            const userAnswerItems = child.answer || [];
            const correctIdSet = new Set(correctIds);
            const userAnswerIds = userAnswerItems.map((a: any) => String(a.id));
            const childCorrect = correctIds.length === userAnswerIds.length && userAnswerIds.every((id: string) => correctIdSet.has(id));

            child.showCorrectAnswer = true;
            child.isCorrect = childCorrect;
            child.isWrong = !childCorrect;

            // Mark isCorrect on each answer item for green/red highlight
            userAnswerItems.forEach((a: any) => {
                a.isCorrect = correctIdSet.has(String(a.id));
            });

            if (!childCorrect) {
                userAnswerItems.forEach((a: any) => {
                    if (!a.isCorrect) {
                        a.isWrong = true;
                    }
                });
                child.isWrong = true;
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    /**
     * Reorder Words: userSentence stores word text, compare with answer_correct (pipe-separated strings).
     */
    private evaluateReorderWords(q: any): boolean {
        if (!q.children?.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            // answer_correct for reorder_words is pipe-separated word strings
            const correctWords = String(child.answer_correct || '').split('|').filter((w: string) => w && w !== '');
            const userSentence = (child.userSentence || []).join(" ");
            const childCorrect = correctWords.includes(userSentence);

            child.showCorrectAnswer = true;
            child.isCorrect = childCorrect;
            child.isWrong = !childCorrect;

            if (!childCorrect) {
                child.isWrong = true;
                allCorrect = false;
            }
        });

        return allCorrect;
    }

    /**
     * Arrange Paragraphs: compare current answer_option order against correct IDs.
     */
    private evaluateArrangeParagraphs(q: any): boolean {
        const targets = q.children?.length ? q.children : [q];
        let allCorrect = true;
        targets.forEach((item: any) => {
            const correctIds = this.parseCorrectAnswerIds(item.answer_correct);
            const userOrderIds = (item.answer_option || []).map((a: any) => String(a.id));
            const itemCorrect = correctIds.length === userOrderIds.length && correctIds.every((id, idx) => id === userOrderIds[idx]);

            item.showCorrectAnswer = true;
            item.isCorrect = itemCorrect;
            item.isWrong = !itemCorrect;

            (item.answer_option || []).forEach((ans: any, idx: number) => {
                const expectedId = idx < correctIds.length ? correctIds[idx] : null;
                ans.isCorrect = expectedId !== null && String(ans.id) === expectedId;
                ans.isWrong = !ans.isCorrect;
            });

            if (!itemCorrect) {
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    // ======================== PARSE HELPERS ========================

    private parseCorrectAnswerIds(answerCorrect: any): string[] {
        if (!answerCorrect) return [];
        return String(answerCorrect).replace(/\|/g, '').split(',').filter(id => id && id !== '');
    }

    private parseCorrectAnswerIdDigits(answerCorrect: any): string {
        if (!answerCorrect) return '';
        return String(answerCorrect).replace(/\D/g, '');
    }

    private parseCorrectAnswerIdsSemicolon(answerCorrect: any): string[] {
        if (!answerCorrect) return [];
        return String(answerCorrect).replace(/\|/g, '').split(';').filter(id => id && id !== '');
    }

    private parseCorrectAnswerValues(answerCorrect: any): string[] {
        if (!answerCorrect) return [];
        return String(answerCorrect).split('|').filter(v => v && v !== '');
    }

    // ======================== RETRY ========================

    retryAll(): void {
        if (!this.initialData?.length) return;
        this.responseArray = this.cloneData(this.initialData);
        this.resetAllState();
        this.retryRequested.emit();
    }

    /** Close preview (handle close button click) */
    closePreview(): void {
        this.close.emit();
    }

    trackByIndex(index: number, item?: any): number {
        return index;
    }
}