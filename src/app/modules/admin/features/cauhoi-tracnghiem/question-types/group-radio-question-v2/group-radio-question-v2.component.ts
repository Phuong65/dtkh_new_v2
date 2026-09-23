import { Component, Input, OnInit } from '@angular/core';
import { Answers, Question } from '@shared/models/question';
import { maxAnswerOptionId, questionPrefix, SelectOptions } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';
import { OpenFileManagerService } from '@shared/services/open-file-manager.service';
import { AbstractControl, FormControl } from '@angular/forms';

const orderArrayByAscending: (array: string[], separator?: string) => string = (array: string[], separator?: string): string => {
    return array.sort().sort((s1: string, s2: string): number => {
        const n1: number = parseInt(s1, 10);
        const n2: number = parseInt(s2, 10);
        return !Number.isNaN(n1) && !Number.isNaN(n2) ? n1 - n2 : 0;
    }).join(separator);
}

interface RadioAnswerOption {
    answer: Answers,
    prefix: string
}

const CHECKBOX_ANSWER_SEPARATOR: string = ',';

@Component({
	standalone: false,
    selector: 'group-radio-question-v2',
    templateUrl: './group-radio-question-v2.component.html',
    styleUrls: ['./group-radio-question-v2.component.css']
})
export class GroupRadioQuestionV2Component implements OnInit {
    desc_question = new FormControl('');

    @Input() set question(question: Question) {
        if (question) {
            if (this.ckEditor) {
                this.ckEditor.data.set('');
            }
            this.desc_question.setValue(question.question_direction);
            this._question = question;
            this.options = question.answer_option.reduce((reducer: RadioAnswerOption[], answer: Answers, index: number): RadioAnswerOption[] => {
                reducer.push({ answer, prefix: questionPrefix(index) });
                return reducer;
            }, new Array<RadioAnswerOption>());
            this.change++;
            this.isPresent = false;
        }
    }

    @Input() multiple: boolean = false; // checkbox if = true;

    @Input() set present(question: Question | any) {
        if (question) {
            if (this.ckEditor) {
                this.ckEditor.data.set('');
            }
            this._question = question;
            this.desc_question.setValue(question.question_direction);
            this.options = question.answer_option.reduce((reducer: RadioAnswerOption[], answer: Answers, index: number): RadioAnswerOption[] => {
                reducer.push({ answer, prefix: questionPrefix(index) });
                return reducer;
            }, new Array<RadioAnswerOption>());
            this.change++;
            this.isPresent = true;
        }
    }

    isPresent: boolean = false;

    private _question: Question;

    get question(): Question {
        return this._question;
    }

    options: RadioAnswerOption[];

    colOptions: SelectOptions<number>[] = [
        { value: 1, label: 'Hiển thị 1 phương án / dòng', disable: false },
        { value: 2, label: 'Hiển thị 2 phương án / dòng', disable: false },
        { value: 3, label: 'Hiển thị 3 phương án / dòng', disable: false },
        { value: 4, label: 'Hiển thị 4 phương án / dòng', disable: false }
    ];

    change: number = 0;

    ckEditor: any;

    constructor(private openFileManagerService: OpenFileManagerService) {

    }

    ngOnInit(): void {

    }

    addMoreAnswerOption(): void {
        if (this.question) {
            if (!this.question.answer_option || !Array.isArray(this.question.answer_option)) {
                this.question.answer_option = [];
            }
            const maxId: number = maxAnswerOptionId(this.question);
            const answer: Answers = { id: (1 + maxId).toString(10), value: '' };
            this.question.answer_option.push(answer);
            this.options.push({ answer, prefix: questionPrefix(this.options.length) });
        }
    }

    isCorrectAnswer(a: Answers): boolean {
        return this.question.answer_correct ? this.question.answer_correct.replace(/\|/gmi, '').split(CHECKBOX_ANSWER_SEPARATOR).filter(Boolean).map((t: string): string => t.trim()).includes(a.id) : false;
    }

    markCorrectAnswer(a: Answers): void {
        if (this.multiple) {
            const arrCorrect: string[] = this.question.answer_correct.replace(/\|/gmi, '').split(CHECKBOX_ANSWER_SEPARATOR).filter(Boolean).map((t: string): string => t.trim());
            const _newArrCorrect: string[] = arrCorrect.includes(a.id) ? arrCorrect.filter((o: string): boolean => o !== a.id) : [...arrCorrect, a.id];
            if (_newArrCorrect.length) {
                this.question.answer_correct = '|' + orderArrayByAscending(_newArrCorrect, CHECKBOX_ANSWER_SEPARATOR) + '|';
            }
            else {
                this.question.answer_correct = '';
            }
        }
        else {
            this.question.answer_correct = '|' + a.id + '|';
        }
    }

    deleteAnswer(option: RadioAnswerOption): void {
        this.options = this.options.filter((o: RadioAnswerOption): boolean => o.answer.id !== option.answer.id).map((o: RadioAnswerOption, index: number): RadioAnswerOption => {
            o.prefix = questionPrefix(index);
            return o;
        });
        this.question.answer_option = this.question.answer_option.filter((q: Answers): boolean => q.id !== option.answer.id);
        const arrCorrect: string[] = this.question.answer_correct.replace(/\|/gmi, '').split(CHECKBOX_ANSWER_SEPARATOR).filter(Boolean).map((t: string): string => t.trim()).filter((a: string): boolean => a !== option.answer.id);
        this.question.answer_correct = arrCorrect.length ? '|' + orderArrayByAscending(arrCorrect, CHECKBOX_ANSWER_SEPARATOR) + '|' : '';
    }

    ckEditorSetup(event): void {
        this.question.question_direction = event;
    }
}
