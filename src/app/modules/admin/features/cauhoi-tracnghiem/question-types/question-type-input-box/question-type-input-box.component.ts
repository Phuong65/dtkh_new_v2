import { Component, Input, OnInit } from '@angular/core';
import { Question } from '@shared/models/question';
import { formatAnswerCorrect } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';

@Component({
	standalone: false,
	selector: 'question-type-input-box',
	templateUrl: './question-type-input-box.component.html',
	styleUrls: ['./question-type-input-box.component.css']
})
export class QuestionTypeInputBoxComponent implements OnInit {

	@Input() set question(question: Question) {
		if (question) {
			this._question = question;
			this.raw_answer = question.answer_correct ? question.answer_correct.split('|').map(t => t ? t.trim() : '').filter(Boolean).join(';') : '';
		} else {
			this._question = null;
			this.raw_answer = '';
		}
	}

	@Input() testFormat: string = 'tienganh';
	
	raw_answer: string;

	@Input() confirmOnDelete: boolean = false;

	private _question: Question;

	get question(): Question {
		return this._question;
	}

	constructor() { }

	ngOnInit(): void {
		
	}

	updateAnswer(): void {
		if (this.raw_answer) {
			this.question.answer_correct = '|' + this.raw_answer.split(';').map(t => t ? formatAnswerCorrect(t).toLowerCase() : '').filter(Boolean).join('|') + '|';
		} else {
			this.question.answer_correct = '';
		}
	}
}
