import { Component, Input, OnInit } from '@angular/core';
import { Question } from '@shared/models/question';
import { NotificationService } from '@core/services/notification.service';
import { SelectOptions } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';
import { CourseQuestionsService } from '@shared/services/course-questions.service';

@Component({
	standalone: false,
	selector: 'group-radio-question',
	templateUrl: './group-radio-question.component.html',
	styleUrls: ['./group-radio-question.component.css']
})
export class GroupRadioQuestionComponent implements OnInit {

	@Input() set present(question: Question | any) {
		if (question) {
			this._question = question;
		} else {
			this._question = null;
		}
		this.isPresent = true;
	}

	@Input() set question(question: Question) {
		if (question) {
			this._question = question;
		} else {
			this._question = null;
		}
		this.isPresent = false;
	}

	@Input() confirmOnDelete: boolean = false;

	isPresent: boolean = false;

	private _question: Question;

	get question(): Question {
		return this._question;
	}

	colOptions: SelectOptions<number>[] = [
		{ value: 2, label: 'Hiển thị 2 phương án / dòng', disable: false },
		{ value: 4, label: 'Hiển thị 4 phương án / dòng', disable: false }
	];

	loading: boolean = false;

	constructor(
		private notificationService: NotificationService,
		private courseQuestionsService: CourseQuestionsService
	) { }

	ngOnInit(): void {
	}

	markCorrectAnswer(question: Question, answer: string): void {
		question.answer_correct = '|' + answer + '|';
	}

	isCorrectAnswer(question: Question, answer: string): boolean {
		return question.answer_correct === '|' + answer + '|';
	}

	async deleteAnswer(index: number): Promise<void> {
		if (this.confirmOnDelete) {
			try {
				const confirm: boolean = await this.notificationService.confirmDelete();
				if (confirm) {
					this._delete(index);
				}
			} catch (e) {

			}
		} else {
			this._delete(index);
		}
	}

	private _delete(index: number): void {
		if (this.question.children[index]['id']) {
			this.loading = true;
			this.courseQuestionsService.deleteCourseQuestions([this.question.children[index]['id']]).subscribe({
				next: (): void => {
					this.loading = false;
					this.question.children = this.question.children.filter(c => c['id'] !== this.question.children[index]['id']);
				},
				error: (): void => {
					this.loading = false;
					this.notificationService.toastError('Mất kết nối với máy chủ');
				}
			});
		} else {
			this.question.children = this.question.children.filter((_, i): boolean => i !== index);
		}
	}

	addMoreAnswerOption(): void {
		if (this.question) {
			const cloneQuestion: Question = Object.assign(JSON.parse(JSON.stringify(this.question)), { children: [], question_direction: '', question_number: 0, media: null, answer_option: [], answer_correct: '', group_id: 0 });
			cloneQuestion.answer_option = [{ id: '1', value: 'Đúng' }, { id: '0', value: 'Sai' }];

			if (cloneQuestion['id']) {
				delete cloneQuestion['id'];
			}

			this.question.children.push(cloneQuestion);
		}
	}

	onChangeQuestionDirection(event, childQuestion: Question) {
		childQuestion.config.contentHtml = true;
		childQuestion.question_direction = event;
	}

}
