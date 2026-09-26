import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Question } from '@shared/models/question';
import { CourseQuestions, Answers } from '@shared/models/course-questions';
import { QuestionTypeArrangeParagraphsComponent } from '../../question-types-view/question-type-arrange-paragraphs/question-type-arrange-paragraphs.component';
import { QuestionTypeDragDropComponent } from '../../question-types-view/question-type-drag-drop/question-type-drag-drop.component';
import { QuestionTypeGroupInputComponent } from '../../question-types-view/question-type-group-input/question-type-group-input.component';
import { QuestionTypeGroupRadioComponent } from '../../question-types-view/question-type-group-radio/question-type-group-radio.component';
import { QuestionTypeGroupingComponent } from '../../question-types-view/question-type-grouping/question-type-grouping.component';
import { QuestionTypeInputboxComponent } from '../../question-types-view/question-type-inputbox/question-type-inputbox.component';
import { QuestionTypeRadioAndCheckboxComponent } from '../../question-types-view/question-type-radio-and-checkbox/question-type-radio-and-checkbox.component';
import { QuestionTypeReorderWordsComponent } from '../../question-types-view/question-type-reorder-words/question-type-reorder-words.component';
import { TestFormat } from '../cauhoi-tracnghiem-create-form/cauhoi-tracnghiem-create-form.component';

@Component({
	selector: 'app-question-test-preview',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		ButtonModule,
		RippleModule,
		QuestionTypeRadioAndCheckboxComponent,
		QuestionTypeInputboxComponent,
		QuestionTypeReorderWordsComponent,
		QuestionTypeArrangeParagraphsComponent,
		QuestionTypeDragDropComponent,
		QuestionTypeGroupInputComponent,
		QuestionTypeGroupRadioComponent,
		QuestionTypeGroupingComponent
	],
	templateUrl: './question-test-preview.component.html',
	styleUrls: ['./question-test-preview.component.css']
})
export class QuestionTestPreviewComponent implements OnChanges {

	@Input() question: Question | CourseQuestions;

	@Input() testFormat: TestFormat = 'monkhac';

	@Output() close: EventEmitter<void> = new EventEmitter<void>();

	previewChecked: boolean = false;

	previewIsCorrect: boolean = false;

	previewChildCorrectCount: number = 0;

	previewChildTotal: number = 0;

	private initialQuestion: Question | CourseQuestions | null = null;

	constructor() { }

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['question'] && this.question) {
			this.initialQuestion = this.cloneQuestion(this.question);
			this.resetPreview();
		}
	}

	checkAnswers(): void {
		if (!this.question) {
			return;
		}
		this.resetQuestionState(this.question);
		this.previewChecked = true;
		const correct = this.evaluateQuestionCorrectness(this.question, this.testFormat);
		this.previewIsCorrect = correct;
		this.updateChildResultSummary();
	}

	resetPreview(): void {
		this.previewChecked = false;
		this.previewIsCorrect = false;
		this.previewChildCorrectCount = 0;
		this.previewChildTotal = 0;
		if (this.question) {
			this.resetQuestionState(this.question);
		}
	}

	retryPreview(): void {
		if (!this.initialQuestion) {
			this.resetPreview();
			return;
		}
		this.question = this.cloneQuestion(this.initialQuestion);
		this.resetPreview();
	}

	closePreview(): void {
		if (this.initialQuestion) {
			this.question = this.cloneQuestion(this.initialQuestion);
		}
		this.resetPreview();
		this.close.emit();
	}

	private resetQuestionState(q: Question | CourseQuestions): void {
		q['showCorrectAnswer'] = false;

		if (q.answer_option && q.answer_option.length) {
			q.answer_option.forEach((ans: any) => {
				ans.isWrong = false;
			});
		}

		// Reset isWrong on child.answer items (drag_drop, grouping)
		if (q['answer'] && q['answer'].length) {
			q['answer'].forEach((a: any) => {
				a.isWrong = false;
			});
		}

		q['isWrong'] = false;
		q['isCorrect'] = false;

		if (q.children && q.children.length) {
			q.children.forEach((child: any) => {
				this.resetQuestionState(child);
			});
		}
	}

	private evaluateQuestionCorrectness(q: Question | CourseQuestions, testFormat: TestFormat): boolean {
		switch (q.question_type) {
			case 'radio':
				return this.evaluateRadio(q);
			case 'checkbox':
				return this.evaluateCheckbox(q);
			case 'inputbox':
				return this.evaluateInputbox(q, testFormat);
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

	/**
	 * Radio: user selects one option via isSelected.
	 * Compare selected option id with answer_correct.
	 * For tienganh format (has children): evaluate each child separately.
	 */
	private evaluateRadio(q: Question | CourseQuestions): boolean {
		// Tiếng Anh format: children have their own answer_option + isSelected
		if (q.children && q.children.length) {
			let allCorrect = true;
			q.children.forEach((child: any) => {
				const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
				const selectedIds = (child.answer_option || []).filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
				const childCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];

				child['showCorrectAnswer'] = true;
				child['isCorrect'] = childCorrect;
				child['isWrong'] = !childCorrect;

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
			q['showCorrectAnswer'] = true;
			return allCorrect;
		}

		// Mon khác format: evaluate parent answer_option directly
		const correctIds = this.parseCorrectAnswerIds(q.answer_correct);
		const selectedIds = q.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
		const userCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];

		q['showCorrectAnswer'] = true;

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
	 * Checkbox: user selects multiple options via isSelected.
	 * Compare selected ids with answer_correct (comma-separated).
	 */
	private evaluateCheckbox(q: Question | CourseQuestions): boolean {
		// Tiếng Anh format with children: evaluate each child
		if (q.children && q.children.length) {
			let allCorrect = true;
			q.children.forEach((child: any) => {
				const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
				const selectedIds = (child.answer_option || []).filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
				const childCorrect = correctIds.length === selectedIds.length && correctIds.every(id => selectedIds.includes(id));

				child['showCorrectAnswer'] = true;
				child['isCorrect'] = childCorrect;
				child['isWrong'] = !childCorrect;

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
			q['showCorrectAnswer'] = true;
			return allCorrect;
		}

		const correctIds = this.parseCorrectAnswerIds(q.answer_correct);
		const selectedIds = q.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
		const userCorrect = correctIds.length === selectedIds.length && correctIds.every(id => selectedIds.includes(id));

		q['showCorrectAnswer'] = true;

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
	 * Inputbox: user types answer in q.userAnswer.
	 * Compare with answer_correct (pipe-separated alternatives).
	 * For monkhac: q is the main question (single input).
	 * For tienganh: q has children, each child has userAnswer.
	 */
	private evaluateInputbox(q: Question | CourseQuestions, testFormat: TestFormat): boolean {
		if (testFormat === 'tienganh') {
			return this.evaluateChildrenInputbox(q);
		}
		return this.evaluateSingleInputbox(q);
	}

	private evaluateSingleInputbox(q: Question | CourseQuestions): boolean {
		if (!q.children || !q.children.length) {
			const correctValues = this.parseCorrectAnswerValues(q.answer_correct);
			const userAnswer = (q['userAnswer'] || '').toString().trim().toLowerCase();
			const isCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);

			q['showCorrectAnswer'] = true;
			q['isWrong'] = !isCorrect;

			return isCorrect;
		}
		return this.evaluateChildrenInputbox(q);
	}

	private evaluateChildrenInputbox(q: Question | CourseQuestions): boolean {
		if (!q.children || !q.children.length) {
			return true;
		}
		let allCorrect = true;
		q.children.forEach((child: any) => {
			const correctValues = this.parseCorrectAnswerValues(child.answer_correct);
			const userAnswer = (child['userAnswer'] || '').toString().trim().toLowerCase();
			const childCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);

			child['showCorrectAnswer'] = true;
			child['isCorrect'] = childCorrect;
			child['isWrong'] = !childCorrect;

			if (!childCorrect) {
				allCorrect = false;
			}
		});
		return allCorrect;
	}

	/**
	 * Group Input (monkhac group-input): each child has userAnswer.
	 */
	private evaluateGroupInput(q: Question | CourseQuestions): boolean {
		if (!q.children || !q.children.length) {
			return true;
		}
		let allCorrect = true;
		q.children.forEach((child: any) => {
			const correctValues = this.parseCorrectAnswerValues(child.answer_correct);
			const userAnswer = (child['userAnswer'] || '').toString().trim().toLowerCase();
			const childCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);

			child['showCorrectAnswer'] = true;
			child['isCorrect'] = childCorrect;
			child['isWrong'] = !childCorrect;

			if (!childCorrect) {
				allCorrect = false;
			}
		});
		return allCorrect;
	}

	/**
	 * Group Radio: each child has its own answer_option and isSelected.
	 */
	private evaluateGroupRadio(q: Question | CourseQuestions): boolean {
		if (!q.children || !q.children.length) {
			return true;
		}
		let allCorrect = true;
		q.children.forEach((child: any) => {
			const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
			const selectedIds = child.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
			const childCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];

			child['showCorrectAnswer'] = true;
			child['isCorrect'] = childCorrect;
			child['isWrong'] = !childCorrect;

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

	private evaluateDragDrop(q: Question | CourseQuestions): boolean {
		if (!q.children || !q.children.length) {
			return true;
		}
		let allCorrect = true;
		q.children.forEach((child: any) => {
			const correctId = this.parseCorrectAnswerIdDigits(child.answer_correct);
			const userAnswerItems = child['answer'] || [];
			const selectedAnswer = userAnswerItems[0];
			const childCorrect = userAnswerItems.length === 1 && String(selectedAnswer?.id) === correctId;

			child['showCorrectAnswer'] = true;
			child['isCorrect'] = childCorrect;
			child['isWrong'] = !childCorrect;
			child['correct_id'] = correctId;

			userAnswerItems.forEach((a: any) => {
				a.isCorrect = String(a.id) === correctId;
			});

			if (!childCorrect) {
				userAnswerItems.forEach((a: any) => {
					if (!a.isCorrect) {
						a.isWrong = true;
					}
				});
				child['isWrong'] = true;
				allCorrect = false;
			}
		});
		return allCorrect;
	}

	/**
	 * Grouping: each child has an `answer` array.
	 * Grouping view uses semicolon (;) as delimiter; must parse answer_correct with semicolon.
	 * Template checks `a.isWrong` on individual answer items.
	 */
	private evaluateGrouping(q: Question | CourseQuestions): boolean {
		if (!q.children || !q.children.length) {
			return true;
		}
		let allCorrect = true;
		q.children.forEach((child: any) => {
			// Grouping uses semicolon delimiter (same as grouping component)
			const correctIds = this.parseCorrectAnswerIdsSemicolon(child.answer_correct);
			const userAnswerItems = child['answer'] || [];
			const correctIdSet = new Set(correctIds);
			const userAnswerIds = userAnswerItems.map((a: any) => String(a.id));
			const childCorrect = correctIds.length === userAnswerIds.length && userAnswerIds.every((id: string) => correctIdSet.has(id));

			child['showCorrectAnswer'] = true;
			child['isCorrect'] = childCorrect;
			child['isWrong'] = !childCorrect;

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
				child['isWrong'] = true;
				allCorrect = false;
			}
		});
		return allCorrect;
	}

	/**
	 * Reorder Words: userSentence stores word strings.
	 * answer_correct stores words split by pipe (|) -> word strings, not IDs.
	 * Compare word strings against word strings.
	 */
	private evaluateReorderWords(q: Question | CourseQuestions): boolean {
		if (!q.children || !q.children.length) {
			return true;
		}
		let allCorrect = true;
		q.children.forEach((child: any) => {
			// answer_correct for reorder_words is pipe-separated word strings
			const correctWords = String(child.answer_correct || '').split('|').filter((w: string) => w && w !== '');
			const userSentence = child['userSentence'].join(" ");
			const childCorrect = correctWords.includes(userSentence);

			child['showCorrectAnswer'] = true;
			child['isCorrect'] = childCorrect;
			child['isWrong'] = !childCorrect;

			if (!childCorrect) {
				child['isWrong'] = true;
				allCorrect = false;
			}
		});

		return allCorrect;
	}

	/**
	 * Arrange Paragraphs: user drags to reorder child.answer_option (no userSentence).
	 * Compare the current answer_option order (id array) against correct ids.
	 */
	private evaluateArrangeParagraphs(q: Question | CourseQuestions): boolean {
		const targets = q.children && q.children.length ? q.children : [q];
		let allCorrect = true;
		targets.forEach((item: any) => {
			const correctIds = this.parseCorrectAnswerIds(item.answer_correct);
			const userOrderIds = (item.answer_option || []).map((a: any) => String(a.id));
			const itemCorrect = correctIds.length === userOrderIds.length && correctIds.every((id, idx) => id === userOrderIds[idx]);

			item['showCorrectAnswer'] = true;
			item['isCorrect'] = itemCorrect;
			item['isWrong'] = !itemCorrect;

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

	get hasChildResultSummary(): boolean {
		return this.previewChecked && this.previewChildTotal > 0;
	}

	private updateChildResultSummary(): void {
		const children = (this.question?.children || []) as any[];
		this.previewChildTotal = children.length;
		this.previewChildCorrectCount = children.filter(child => child.isCorrect === true).length;
	}

	/**
	 * Parse answer_correct: strip pipe characters, split by comma, filter empty.
	 */
	private parseCorrectAnswerIds(answerCorrect: any): string[] {
		if (!answerCorrect) {
			return [];
		}
		return String(answerCorrect).replace(/\|/g, '').split(',').filter(id => id && id !== '');
	}

	private parseCorrectAnswerIdDigits(answerCorrect: any): string {
		if (!answerCorrect) {
			return '';
		}
		return String(answerCorrect).replace(/\D/g, '');
	}

	/**
	 * Parse answer_correct for grouping: strip pipe characters, split by semicolon, filter empty.
	 * Grouping view uses semicolon as delimiter.
	 */
	private parseCorrectAnswerIdsSemicolon(answerCorrect: any): string[] {
		if (!answerCorrect) {
			return [];
		}
		return String(answerCorrect).replace(/\|/g, '').split(';').filter(id => id && id !== '');
	}

	/**
	 * Parse answer_correct values for inputbox: split by pipe for alternatives.
	 */
	private parseCorrectAnswerValues(answerCorrect: any): string[] {
		if (!answerCorrect) {
			return [];
		}
		return String(answerCorrect).split('|').filter(v => v && v !== '');
	}

	private cloneQuestion(question: Question | CourseQuestions): Question | CourseQuestions {
		const clone = (globalThis as any).structuredClone;
		if (typeof clone === 'function') {
			return clone(question);
		}
		return JSON.parse(JSON.stringify(question));
	}

	getKey(index: number): string {
		return String.fromCharCode(65 + index);
	}
}