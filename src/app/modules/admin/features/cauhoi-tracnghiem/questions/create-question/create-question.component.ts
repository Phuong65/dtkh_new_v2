import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputQuestionDirectionComponent } from '@modules/admin/features/cauhoi-tracnghiem/input-question-direction/input-question-direction.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { QuestionTypesModule } from '@modules/admin/features/cauhoi-tracnghiem/question-types/question-types.module';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RippleModule } from 'primeng/ripple';
import { cdrId2Name, CdrName, cdrName2Id, cdrName2Label, CoursePlanActivitiesCdr, CoursePlanActivitiesExtends, CourseQuestionHierarchy, IctuQuestionType, SelectOptions } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';
import { Answers, Question } from '@shared/models/question';
import { NotificationService } from '@core/services/notification.service';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { filter, map, mergeMap } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { InputQuestionMode } from '@modules/admin/features/cauhoi-tracnghiem/topical-question-bank/topical-question-bank.component';
import { OpenFileManagerService } from '@shared/services/open-file-manager.service';
import { OvicFile } from '@core/models/file';
import { SharedModule } from '@shared/shared.module';
import { AuthService } from '@core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { CourseQuestions } from '@shared/models/course-questions';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';
import { key_server } from '@env';
import { shuffleArray } from "@core/services/helper.service";

export interface CreateQuestionInfo {
	cdr: CoursePlanActivitiesCdr,
	cdrName: CdrName,
	question?: CourseQuestionHierarchy | CourseQuestions;
}

export type TestFormat = 'tienganh' | 'monkhac';

interface QuestionTypeSection {
	options: SelectOptions<IctuQuestionType>[];
	active: IctuQuestionType,
	placeholder: string
}

type CreateEditQuestionValidator = Record<IctuQuestionType, () => CreateEditQuestionErrorName | null>;

type CreateEditQuestionValidatorControl = Record<TestFormat, CreateEditQuestionValidator>;

type CreateEditQuestionErrorName =
	'the_child_question_empty' |
	'direction_of_child_question_empty' |
	'the_direction_of_the_question_is_empty' |
	'the_answer_options_are_empty' |
	'the_correct_answer_is_empty' |
	'the_correct_answer_of_the_child_question_is_empty' |
	'the_answer_of_the_child_question_is_empty';

@Component({
	selector: 'app-create-question',
	standalone: true,
	imports: [CommonModule, ButtonModule, CheckboxModule, DropdownModule, InputQuestionDirectionComponent, InputTextareaModule, QuestionTypesModule, ReactiveFormsModule, RippleModule, FormsModule, SharedModule, IctuMediaLinkPipe, InputTextModule],
	templateUrl: './create-question.component.html',
	styleUrls: ['./create-question.component.css']
})
export class CreateQuestionComponent implements OnInit {

	@Input() set dataCdr(_list: CoursePlanActivitiesExtends[]) {
		if (_list) {
			const data = [];
			_list.filter(m => m.week !== 100).map(m => {
				m.cdrList.forEach(i => {
					i['label'] = i.kyhieu.concat(" ", i.title);
					data.push(i);
				})

			})

			this.listCdr = data;
		}
	}

	@Input() set data(info: CreateQuestionInfo) {
		if (info) {
			this.info = info;
			this.fillForm(info);
			this.level = cdrName2Label(info.cdrName);
			this.formMode = 'create';
			this.changesTestType();
		}
	}

	@Input() set update(info: CreateQuestionInfo) {
		if (info) {
			this.info = info;
			// this.fillForm( info );
			this.level = cdrName2Label(info.cdrName);
			if (info.question) {
				this.question = info.question as any;
				this.formMode = 'update';
				this.form.reset({
					course_id: info.cdr.course_id,
					reference: 'course_plan_activities',
					reference_id: info.cdr.id,
					answer_correct: info.question.answer_correct,
					question_number: info.question.question_number,
					question_direction: info.question.question_direction,
					question_type: info.question.question_type,
					cdr: info.question.cdr,
					answer_option: info.question.answer_option,
					group_id: info.question.group_id,
					part: info.question.part,
					skill: info.question['skill'],
					media: info.question.media,
					code: info.question.code,
					config: info.question.config,
					shuff: info.question['shuff'],
					cdr_id: info.question.cdr_id,
					private: info.question.private,
					old_status: info.question.old_status,
					status: info.question.status
				});
				this.loading = false;
			}
		}
	}

	@Output() close: EventEmitter<InputQuestionMode> = new EventEmitter<InputQuestionMode>();

	@Input() set testFormat(testFormat: TestFormat) {
		this._testFormat = testFormat;
		this.changesTestType();
	};

	private _testFormat: TestFormat = 'monkhac';

	get testFormat(): TestFormat {
		return this._testFormat;
	}

	formMode: 'update' | 'create' = 'create';

	level: string;

	info: CreateQuestionInfo;

	loading: boolean = true;

	form: FormGroup;

	token: string = this.auth.accessToken;

	listCdr: CoursePlanActivitiesCdr[];

	select_private = [
		{ label: "Private", id: 1 },
		{ label: "Public", id: 0 }
	]

	private resetQuestion: Record<IctuQuestionType, (info: CreateQuestionInfo) => Question> = {
		'group-input': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'group-input',
				answer_option: [],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 2,
					invertedAnswer: true
				},
				children: [
					{ question_direction: '', question_type: 'group-input', answer_option: [], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] },
					{ question_direction: '', question_type: 'group-input', answer_option: [], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] },
					{ question_direction: '', question_type: 'group-input', answer_option: [], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] },
					{ question_direction: '', question_type: 'group-input', answer_option: [], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] }
				]

			};
		},
		'group-radio': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'group-radio',
				answer_option: [],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 2,
					invertedAnswer: true
				},
				children: [
					{ question_direction: '', question_type: 'group-radio', answer_option: [{ id: '1', value: 'Đúng' }, { id: '0', value: 'Sai' }], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] },
					{ question_direction: '', question_type: 'group-radio', answer_option: [{ id: '1', value: 'Đúng' }, { id: '0', value: 'Sai' }], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] },
					{ question_direction: '', question_type: 'group-radio', answer_option: [{ id: '1', value: 'Đúng' }, { id: '0', value: 'Sai' }], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] },
					{ question_direction: '', question_type: 'group-radio', answer_option: [{ id: '1', value: 'Đúng' }, { id: '0', value: 'Sai' }], answer_correct: '', group_id: 0, media: null, part: 0, cdr: cdrName2Id(info.cdrName), question_number: 0, code: '', config: { cols: 1, invertedAnswer: true }, children: [] }
				]
			};
		},
		'checkbox': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'checkbox',
				answer_option: [
					{ id: '1', value: '' },
					{ id: '2', value: '' },
					{ id: '3', value: '' },
					{ id: '4', value: '' }
				],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 2,
					invertedAnswer: true
				},
				children: []
			};
		},
		'drag_drop': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'drag_drop',
				answer_option: [],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 1,
					invertedAnswer: true
				},
				children: []
			};
		},
		'radio': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'radio',
				answer_option: [
					{ id: '1', value: '' },
					{ id: '2', value: '' },
					{ id: '3', value: '' },
					{ id: '4', value: '' }
				],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 2,
					invertedAnswer: true
				},
				children: []
			};
		},
		'grouping': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'grouping',
				answer_option: [],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 1,
					invertedAnswer: true
				},
				children: []
			};
		},
		'inputbox': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'inputbox',
				answer_option: [],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 1,
					invertedAnswer: true
				},
				children: []
			};
		},
		'reorder_words': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'reorder_words',
				answer_option: [],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 1,
					invertedAnswer: true
				},
				children: []
			};
		},
		'matching': (): Question => {
			return null;
		},
		'arrange_paragraphs': (info: CreateQuestionInfo): Question => {
			return {
				question_direction: '',
				question_type: 'arrange_paragraphs',
				answer_option: [],
				answer_correct: '',
				group_id: 0,
				media: null,
				part: 0,
				cdr: cdrName2Id(info.cdrName),
				question_number: 0,
				code: '',
				config: {
					cols: 1,
					invertedAnswer: true
				},
				children: []
			};
		}
	};

	private allQuestionType: SelectOptions<IctuQuestionType>[] = [
		{ value: 'group-input', label: '[group-input] - Nhóm câu hỏi nhập đáp án', disable: false },
		{ value: 'group-radio', label: '[group-radio] - Nhóm câu hỏi chọn đáp án Đúng - Sai', disable: false },
		{ value: 'checkbox', label: '[check-box] - Chọn nhiều đáp án đúng', disable: false },
		{ value: 'drag_drop', label: '[drag-drop] - Câu hỏi nhóm kéo thả đáp án đúng', disable: false },
		{ value: 'radio', label: '[radio] - Chọn 1 đáp án đúng', disable: false },
		{ value: 'grouping', label: '[grouping] - Câu hỏi kéo thả đáp án vào cột tương ứng', disable: false },
		{ value: 'inputbox', label: '[input-box] - Nhập vào đáp án đúng', disable: false },
		{ value: 'reorder_words', label: '[reorder-words] - Sắp xếp lại câu theo thứ tự đúng', disable: false },
		{ value: 'arrange_paragraphs', label: '[arrange-paragraphs] - Sắp xếp câu thành đoạn văn', disable: false },
		// { value : 'selectbox' , label : '[select-box] - Select box' , disable : false } ,
		{ value: 'matching', label: '[matching] - Matching 2 vế', disable: true }
	];

	private filterQuestionType: Record<TestFormat, IctuQuestionType[]> = {
		monkhac: ['grouping', 'drag_drop', 'radio', 'checkbox', 'group-radio', 'group-input'],
		tienganh: ['inputbox', 'drag_drop', 'reorder_words', 'radio', 'matching', 'arrange_paragraphs']
	};

	question: Question;

	questionTypeSection: QuestionTypeSection = {
		options: [],
		active: null,
		placeholder: '--Vui lòng chọn đinh dạng bài kiểm tra--'
	};

	guideMessages: string = 'Vui lòng chọn đinh dạng bài kiểm tra';

	private validator: CreateEditQuestionValidatorControl = {
		monkhac: {
			'inputbox': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng thêm các câu hỏi');
					return 'the_answer_options_are_empty';
				}
				const allChildrenHaveCorrectAnswer: boolean = this.question.children.reduce((reducer: boolean, o): boolean => reducer && !!o.answer_correct, true);
				if (allChildrenHaveCorrectAnswer) {
					return null;
				}
				else {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ thông tin của các phương án trả lời');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
			},
			'radio': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.answer_option.length) {
					this.notificationService.toastInfo('Vui nhập các phương án trả lời cho câu hỏi');
					return 'the_answer_options_are_empty';
				}
				if (!!this.question.answer_correct) {
					const allAnswerOptionHaveValue: boolean = this.question.answer_option.reduce((reducer: boolean, o): boolean => reducer && !!o.value, true);
					if (allAnswerOptionHaveValue) {
						return null;
					}
					else {
						this.notificationService.toastInfo('Vui lòng nhập đầy đủ thông tin của các phương án trả lời');
						return 'the_correct_answer_of_the_child_question_is_empty';
					}
				}
				else {
					this.notificationService.toastInfo('Vui lòng chọn phương án trả lời đúng');
					return 'the_correct_answer_is_empty';
				}
			},
			'reorder_words': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				const allAnswerOptionHaveValue: boolean = this.question.answer_option.reduce((reducer: boolean, o): boolean => reducer && !!o.value, true);
				if (allAnswerOptionHaveValue) {
					return null;
				}
				else {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ thông tin của các phương án trả lời');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
			},
			'grouping': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const _initReducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = {
					noDirectionsEmpty: true,
					noCorrectAnswersEmpty: true
				};
				const allQuestionChild: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = this.question.children.reduce((reducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean }, o): { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } => {
					reducer.noDirectionsEmpty = reducer.noDirectionsEmpty && !!o.question_direction;
					reducer.noCorrectAnswersEmpty = reducer.noCorrectAnswersEmpty && !!o.answer_correct;
					return reducer;
				}, _initReducer);
				if (!allQuestionChild.noDirectionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi cho câu hỏi phụ');
					return 'the_direction_of_the_question_is_empty';
				}
				if (!allQuestionChild.noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'drag_drop': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const _initReducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = {
					noDirectionsEmpty: true,
					noCorrectAnswersEmpty: true
				};
				const allQuestionChild: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = this.question.children.reduce((reducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean }, o): { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } => {
					reducer.noDirectionsEmpty = reducer.noDirectionsEmpty && !!o.question_direction;
					reducer.noCorrectAnswersEmpty = reducer.noCorrectAnswersEmpty && !!o.answer_correct;
					return reducer;
				}, _initReducer);
				if (!allQuestionChild.noDirectionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi cho câu hỏi phụ');
					return 'the_direction_of_the_question_is_empty';
				}
				if (!allQuestionChild.noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'checkbox': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.answer_option.length) {
					this.notificationService.toastInfo('Vui nhập các phương án trả lời cho câu hỏi');
					return 'the_answer_options_are_empty';
				}
				if (!!this.question.answer_correct) {
					const allAnswerOptionHaveValue: boolean = this.question.answer_option.reduce((reducer: boolean, o): boolean => reducer && !!o.value, true);
					if (allAnswerOptionHaveValue) {
						return null;
					}
					else {
						this.notificationService.toastInfo('Vui lòng nhập đầy đủ thông tin của các phương án trả lời');
						return 'the_correct_answer_of_the_child_question_is_empty';
					}
				}
				else {
					this.notificationService.toastInfo('Vui lòng chọn phương án trả lời đúng');
					return 'the_correct_answer_is_empty';
				}
			},
			'group-radio': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const _initReducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = {
					noDirectionsEmpty: true,
					noCorrectAnswersEmpty: true
				};
				const allQuestionChild: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = this.question.children.reduce((reducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean }, o): { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } => {
					reducer.noDirectionsEmpty = reducer.noDirectionsEmpty && !!o.question_direction;
					reducer.noCorrectAnswersEmpty = reducer.noCorrectAnswersEmpty && !!o.answer_correct;
					return reducer;
				}, _initReducer);
				if (!allQuestionChild.noDirectionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi cho câu hỏi phụ');
					return 'the_direction_of_the_question_is_empty';
				}
				if (!allQuestionChild.noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'group-input': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const _initReducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = {
					noDirectionsEmpty: true,
					noCorrectAnswersEmpty: true
				};
				const allQuestionChild: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = this.question.children.reduce((reducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean }, o): { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } => {
					reducer.noDirectionsEmpty = reducer.noDirectionsEmpty && !!o.question_direction;
					reducer.noCorrectAnswersEmpty = reducer.noCorrectAnswersEmpty && !!o.answer_correct;
					return reducer;
				}, _initReducer);
				if (!allQuestionChild.noDirectionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi cho câu hỏi phụ');
					return 'the_direction_of_the_question_is_empty';
				}
				if (!allQuestionChild.noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'matching': (): CreateEditQuestionErrorName => {
				return null;
			},
			'arrange_paragraphs': (): CreateEditQuestionErrorName => {
				return null;
			}
		},
		tienganh: {
			'inputbox': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng thêm các câu hỏi');
					return 'the_answer_options_are_empty';
				}
				const noCorrectAnswersEmpty: boolean = this.question.children.reduce((reducer: boolean, o): boolean => (reducer && !!o.answer_correct), true);
				if (!noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'radio': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const _initReducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean, noAnswersOptionsEmpty: boolean } = {
					noDirectionsEmpty: true,
					noAnswersOptionsEmpty: true,
					noCorrectAnswersEmpty: true
				};
				const allQuestionChild: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean, noAnswersOptionsEmpty: boolean } = this.question.children.reduce((reducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean, noAnswersOptionsEmpty: boolean }, o): {
					noDirectionsEmpty: boolean,
					noCorrectAnswersEmpty: boolean,
					noAnswersOptionsEmpty: boolean
				} => {
					reducer.noDirectionsEmpty = reducer.noDirectionsEmpty && !!o.question_direction;
					reducer.noCorrectAnswersEmpty = reducer.noCorrectAnswersEmpty && !!o.answer_correct;
					reducer.noAnswersOptionsEmpty = reducer.noAnswersOptionsEmpty && !!o.answer_option.length && o.answer_option.reduce((r2: boolean, i2): boolean => r2 && !!i2.value, true);
					return reducer;
				}, _initReducer);

				if (!allQuestionChild.noDirectionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi cho câu hỏi phụ');
					return 'the_direction_of_the_question_is_empty';
				}
				if (!allQuestionChild.noAnswersOptionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ nội dung các phương án trả lời cho câu hỏi phụ');
					return 'the_answer_of_the_child_question_is_empty';
				}
				if (!allQuestionChild.noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'reorder_words': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const noCorrectAnswersEmpty: boolean = this.question.children.reduce((reducer: boolean, o): boolean => (reducer && !!o.answer_correct), true);
				if (!noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'grouping': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				return null;
			},
			'drag_drop': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const _initReducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = {
					noDirectionsEmpty: true,
					noCorrectAnswersEmpty: true
				};
				const allQuestionChild: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } = this.question.children.reduce((reducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean }, o): { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean } => {
					reducer.noDirectionsEmpty = reducer.noDirectionsEmpty && !!o.question_direction;
					reducer.noCorrectAnswersEmpty = reducer.noCorrectAnswersEmpty && !!o.answer_correct;
					return reducer;
				}, _initReducer);
				if (!allQuestionChild.noDirectionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi cho câu hỏi phụ');
					return 'the_direction_of_the_question_is_empty';
				}
				if (!allQuestionChild.noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			},
			'checkbox': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				return null;
			},
			'group-radio': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				return null;
			},
			'group-input': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				return null;
			},
			'matching': (): CreateEditQuestionErrorName => {
				return null;
			},
			'arrange_paragraphs': (): CreateEditQuestionErrorName => {
				if (!this._validateQuestionDirection()) {
					return 'direction_of_child_question_empty';
				}
				if (!this.question.children.length) {
					this.notificationService.toastInfo('Vui lòng nhập câu hỏi phụ');
					return 'the_child_question_empty';
				}
				const _initReducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean, noAnswersOptionsEmpty: boolean } = {
					noDirectionsEmpty: true,
					noAnswersOptionsEmpty: true,
					noCorrectAnswersEmpty: true
				};
				const allQuestionChild: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean, noAnswersOptionsEmpty: boolean } = this.question.children.reduce((reducer: { noDirectionsEmpty: boolean, noCorrectAnswersEmpty: boolean, noAnswersOptionsEmpty: boolean }, o): {
					noDirectionsEmpty: boolean,
					noCorrectAnswersEmpty: boolean,
					noAnswersOptionsEmpty: boolean
				} => {
					reducer.noDirectionsEmpty = reducer.noDirectionsEmpty && !!o.question_direction;
					reducer.noCorrectAnswersEmpty = reducer.noCorrectAnswersEmpty && !!o.answer_correct;
					reducer.noAnswersOptionsEmpty = reducer.noAnswersOptionsEmpty && !!o.answer_option.length && o.answer_option.reduce((r2: boolean, i2): boolean => r2 && !!i2.value, true);
					return reducer;
				}, _initReducer);
				if (!allQuestionChild.noDirectionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi cho câu hỏi phụ');
					return 'the_direction_of_the_question_is_empty';
				}
				if (!allQuestionChild.noAnswersOptionsEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ nội dung các phương án trả lời cho câu hỏi phụ');
					return 'the_answer_of_the_child_question_is_empty';
				}
				if (!allQuestionChild.noCorrectAnswersEmpty) {
					this.notificationService.toastInfo('Vui lòng nhập đầy đủ đáp án đúng cho các câu hỏi phụ');
					return 'the_correct_answer_of_the_child_question_is_empty';
				}
				return null;
			}
		}
	};

	availableToSave: boolean = false;

	list_part_code: any[];

	ckEditor: any;

	key_server = key_server;

	constructor(
		private auth: AuthService,
		private fb: FormBuilder,
		private notificationService: NotificationService,
		private courseQuestionsService: CourseQuestionsService,
		private openFileManagerService: OpenFileManagerService
	) {
		this.form = this.fb.group({
			course_id: [0, [Validators.required]],
			reference: ['', [Validators.required]],
			reference_id: [0, [Validators.required]],
			answer_correct: ['', [Validators.required]],
			question_number: [0],
			question_direction: ['', [Validators.required]],
			question_type: ['', [Validators.required]],
			cdr: [0, [Validators.required]],
			answer_option: [null],
			group_id: [0],
			part: [0],
			skill: [''],
			media: [null],
			code: [''],
			config: [null],
			shuff: [''],
			cdr_id: [''],
			private: [''],
			old_status: [0],
			status: [0]
		});
	}

	ngOnInit(): void {
		this.f['question_type'].valueChanges.pipe(filter((value) => !!value)).subscribe((type: IctuQuestionType) => {
			this.f['question_direction'].setValue('');
			this.question = this.resetQuestion[type](this.info);
			if (this.ckEditor) {
				this.ckEditor.data.set('');
			}
		});

		this.f['question_direction'].valueChanges.subscribe((text: string) => this.availableToSave = !!text);

		const list_part = [];

		for (let i = 1; i <= 8; i++) {
			const code = 'Part-'.concat(i.toString());
			list_part.push({ value: code, label: code });
		}

		this.list_part_code = list_part;
	}

	private _validateQuestionDirection(): boolean {
		const notEmpty: boolean = !!this.f['question_direction'].value;
		if (!notEmpty) {
			this.notificationService.toastInfo('Vui lòng nhập nội dung câu hỏi');
		}
		return notEmpty;
	}

	ckEditorSetup(ckEditor: any): void {
		this.ckEditor = ckEditor;
	}

	private fillForm(info: CreateQuestionInfo, defaultQuestionType: string = ''): void {
		const resetInfo = {
			course_id: info.cdr.course_id,
			reference: 'course_plan_activities',
			reference_id: info.cdr.id,
			answer_correct: '',
			question_number: 0,
			question_direction: '',
			cdr: cdrName2Id(info.cdrName),
			question_type: defaultQuestionType,
			answer_option: null,
			group_id: 0,
			part: 0,
			skill: '',
			media: null,
			code: '',
			config: null,
			shuff: '',
			cdr_id: this.f['cdr_id'].value ? this.f['cdr_id'].value : 0,
			private: 0,
			old_status: 0,
			status: 0
		};
		this.form.reset(resetInfo);
		this.loading = false;
	}

	get f(): { [key: string]: AbstractControl<any> } {
		return this.form.controls;
	}

	changesTestType(): void {
		this.questionTypeSection.active = null;
		this.questionTypeSection.options = this.getAcceptQuestionType(this.testFormat);
		this.questionTypeSection.placeholder = '--Chọn loại câu hỏi--';
		this.f['question_type'].setValue('');
		this.guideMessages = 'Chọn loại câu hỏi';
	}

	private getAcceptQuestionType(testType: TestFormat): SelectOptions<IctuQuestionType>[] {
		const questionTypeAccepted: IctuQuestionType[] = testType ? this.filterQuestionType[testType] : [];
		return this.allQuestionType.filter((option: SelectOptions<IctuQuestionType>): boolean => questionTypeAccepted.includes(option.value));
	}

	changesQuestionType(): void {
		this.f['question_type'].setValue(this.questionTypeSection.active);
	}

	private _uploadSingleQuestion(question: Question, send: boolean = false): Observable<number> {
		// return this.preUploadImage( input ).pipe( switchMap( ( question : Question ) : Observable<number> => question[ 'id' ] ? this.courseQuestionsService.updateCourseQuestions( question[ 'id' ] , this.filterNecessaryFieldsForUpdate( question ) ) : this.courseQuestionsService.addCourseQuestions( this.filterNecessaryFieldsForUpdate( question ) ) ) );
		if (send === true) {
			question['status'] = question['status'] === -1 ? -2 : question['status'];
		}
		return question['id'] ? this.courseQuestionsService.updateCourseQuestions(question['id'], this.filterNecessaryFieldsForUpdate(question)).pipe(map((id: string) => parseInt(id, 10)))
			: this.courseQuestionsService.addCourseQuestions(this.filterNecessaryFieldsForUpdate(question));
	}

	async saveQuestion(send: boolean = false): Promise<void> {
		const error: CreateEditQuestionErrorName = this.validator[this.testFormat][this.question.question_type]();
		if (!error) {
			this.notificationService.startLoading();
			this.question['old_status'] = this.form.getRawValue()['old_status'];
			this.question['status'] = this.form.getRawValue()['status'];

			if (this.question['id'] && (this.question['status'] !== 0 || this.question['old_status'] !== 0)) {
				await this.updateStatusQuestion();
				this.question['question_root_id'] = this.question['id'];
				delete this.question['id'];
			}
			this.question.question_direction = this.f['question_direction'].value;
			this.question['cdr_id'] = this.form.getRawValue()['cdr_id'];
			this.question['week'] = this.info.cdr.week;
			this.question['private'] = this.info.cdr.week === 100 ? 1 : this.form.getRawValue()['private'];
			if (this.info.cdr.week === 100) {
				if (!this.form.getRawValue()['cdr_id']) {
					this.notificationService.stopLoading();
					this.notificationService.toastWarning("Vui lòng chọn cdr cho câu hỏi");
					return;
				}
			}
			if (this.testFormat === 'tienganh') {
				this.question['code'] = this.form.getRawValue()['code'];
				if (!this.form.getRawValue()['code']) {
					this.notificationService.stopLoading();
					this.notificationService.toastWarning("Vui lòng chọn part cho câu hỏi");
					return;
				}
			}

			this._uploadSingleQuestion(this.question, send).pipe(
				mergeMap((id: number): Observable<Question> => {
					this.question['id'] = id;
					this.question.children.map((_qChild: Question): Question => {
						if (_qChild['id'] && (this.question['status'] !== 0 || this.question['old_status'] !== 0)) {
							_qChild['question_root_id'] = _qChild['id'];
							delete _qChild['id'];
						}
						_qChild['cdr_id'] = this.question['cdr_id'];
						_qChild['code'] = this.question['code'];
						_qChild['private'] = this.question['private'];
						_qChild.group_id = id;
						_qChild['__uploaded'] = false;
						_qChild['week'] = this.info.cdr.week;
						return _qChild;
					});
					return of(this.question);
				}),
				mergeMap((question: Question): Observable<Question> => {
					if (question.children.length) {
						const _observes: Observable<any>[] = question.children.filter((i: Question): boolean => i['__uploaded'] === false).reduce((reducer, c) => {
							if (reducer.length < (question.children.length / 4)) {
								const _i: Observable<number> = this._uploadSingleQuestion(c);
								reducer.push(
									_i.pipe(map((id: number): any => {
										c['id'] = id;
										c['__uploaded'] = true;
									})
									)
								);
							}
							return reducer;
						}, new Array<Observable<any>>());
						return _observes.length ? forkJoin(_observes).pipe(map((): Question => question)) : of(question);
					}
					else {
						return of(question);
					}
				}),
				mergeMap((question: Question): Observable<Question> => {
					if (question.children.length) {
						const _observes: Observable<any>[] = question.children.filter((i: Question): boolean => i['__uploaded'] === false).reduce((reducer, c) => {
							if (reducer.length < (question.children.length / 4)) {
								const _i: Observable<number> = this._uploadSingleQuestion(c);
								reducer.push(
									_i.pipe(map((id: number): any => {
										c['id'] = id;
										c['__uploaded'] = true;
									})
									)
								);
							}
							return reducer;
						}, new Array<Observable<any>>());
						return _observes.length ? forkJoin(_observes).pipe(map((): Question => question)) : of(question);
					}
					else {
						return of(question);
					}
				}),
				mergeMap((question: Question): Observable<Question> => {
					if (question.children.length) {
						const _observes: Observable<any>[] = question.children.filter(i => i['__uploaded'] === false).reduce((reducer, c) => {
							if (reducer.length < question.children.length / 4) {
								const _i: Observable<number> = this._uploadSingleQuestion(c);
								reducer.push(
									_i.pipe(map((id: number): any => {
										c['id'] = id;
										c['__uploaded'] = true;
									})
									)
								);
							}
							return reducer;
						}, new Array<Observable<any>>());
						return _observes.length ? forkJoin(_observes).pipe(map((): Question => question)) : of(question);
					}
					else {
						return of(question);
					}
				}),
				mergeMap((question: Question): Observable<Question> => {
					if (question.children.length) {
						const _observes: Observable<any>[] = question.children.filter((i: Question): boolean => i['__uploaded'] === false).reduce((reducer, c) => {
							const _i: Observable<number> = this._uploadSingleQuestion(c);
							reducer.push(
								_i.pipe(map((id: number): any => {
									c['id'] = id;
									c['__uploaded'] = true;
								})
								)
							);
							return reducer;
						}, new Array<Observable<any>>());
						return _observes.length ? forkJoin(_observes).pipe(map((): Question => question)) : of(question);
					}
					else {
						return of(question);
					}
				})
			).subscribe({
				next: (question: Question): void => {
					try {
						const _qIndex: number = this.info.cdr.group[cdrId2Name(question.cdr)].questions.findIndex(q => q.id === question['id']);
						if (-1 === _qIndex) {
							this.info.cdr.group[cdrId2Name(question.cdr)].questions.push(question as any);
							this.info.cdr.group[cdrId2Name(question.cdr)].reachRequirement = this.info.cdr.group[cdrId2Name(question.cdr)].questions.length === this.info.cdr.group[cdrId2Name(question.cdr)].require;
							if (this.info.cdr.group[cdrId2Name(question.cdr)].reachRequirement) {
								if (this.formMode === 'update') {
									this.close.emit('list');
								}
								else {
									this.notificationService.toastInfo('Số lượng câu hỏi phân phối theo Cdr này đã đạt tới ngưỡng yêu cầu.');
									this.close.emit(null);
								}
							}
							else {
								this.fillForm(this.info, this.f['question_type'].value);

								// this.f[ 'question_type' ].setValue( this.questionTypeSection.active );

								// this.level = cdrName2Label( this.info.cdrName );
								// this.testType = null;
								// this.changesTestType();
								// this.question = null;
								if (this.formMode === 'update') {
									this.close.emit('list');
								}
							}
						}
						else {
							this.info.cdr.group[cdrId2Name(question.cdr)].questions[_qIndex] = question as any;
							if (this.formMode === 'update') {
								this.close.emit('list');
							}
							else {
								this.close.emit(null);
							}
						}
					}
					catch (e) {
						console.log(e);
					}
					this.notificationService.stopLoading();
				},
				error: (): void => {
					this.notificationService.toastError('Mất kết nối với máy chủ');
					this.notificationService.stopLoading();
				}
			});
		}
	}

	private _startSaveQuestion(): void {
		// handle upload
		if (!this.question['uploaded']) {
			if (!this.question['__upload_fail'] || this.question['__upload_fail'] < 2) {
				// upload parent first;
				this.notificationService.startLoading();
				this.question.question_direction = this.f['question_direction'].value;
				this.questionUploader(this.question);
			}
		}
		else {
			// find in children
			const childIndex: any = this.question.children.findIndex(c => !c['uploaded'] && (!c['__upload_fail'] || c['__upload_fail'] < 2));
			if (-1 !== childIndex) {
				this.questionUploader(this.question.children[childIndex]);
				// const childInfo : any                     = this.filterNecessaryFieldsForUpdate( this.question.children[ childIndex ] );
				// const childUploader$ : Observable<number> = this.question.children[ childIndex ][ 'id' ] ? this.courseQuestionsService.updateCourseQuestions( this.question.children[ childIndex ][ 'id' ] , childInfo ) : this.courseQuestionsService.addCourseQuestions( childInfo );
			}
		}
		// const uploadSuccess : boolean = this.question[ 'uploaded' ] && this.question.children.reduce();

	}

	private questionUploader(question: Question): void {
		const newInfo: any = this.filterNecessaryFieldsForUpdate(question);
		const _upLoader$: Observable<number> = question['id'] ? this.courseQuestionsService.updateCourseQuestions(question['id'], newInfo) : this.courseQuestionsService.addCourseQuestions(newInfo);
		_upLoader$.pipe(
			map((id: number): void => {
				question = Object.assign(question, { id }, newInfo);
				question.children.map((_qChild: Question): Question => {
					_qChild.group_id = id;
					return _qChild;
				});
				question['uploaded'] = true;
			})
		).subscribe({
			next: (): void => {
				this._startSaveQuestion();
			},
			error: (): void => {
				this.notificationService.toastError('Mất kết nối với máy chủ');
				question['uploaded'] = false;
				if (!question['__upload_fail']) {
					question['__upload_fail'] = 1;
					/*try again*/
				}
				else {
					// increase fail counter one more times and stop;
					question['__upload_fail'] += 1;
				}
				this._startSaveQuestion();
			}
		});
	}

	/****************************************************************
	 * Filter the necessary fields to prepare for update progress
	 * **************************************************************/
	private filterNecessaryFieldsForUpdate(q: Question): any {
		return {
			question_direction: q.question_direction,
			question_type: q.question_type,
			answer_option: q.answer_option,
			answer_correct: q.answer_correct,
			group_id: q.group_id,
			media: q.media,
			part: q.part,
			cdr: q.cdr,
			question_number: q.question_number,
			code: q.code,
			raw_answer: q['raw_answer'] ? q['raw_answer'] : '',
			config: q.config,
			reference: 'course_plan_activities',
			reference_id: this.info.cdr.id,
			course_id: this.info.cdr.course_id,
			status: q['status'],
			cdr_id: q['cdr_id'],
			private: this.info.cdr.week === 100 ? 1 : q.private,
			week: this.info.cdr.week,
			question_root_id: q['question_root_id'],
			old_status: q['old_status'] ? q['old_status'] : 0
		};
	}

	addMoreChildQuestion(): void {
		if (this.questionTypeSection.active) {
			const newQuestion: Question = this.resetQuestion[this.questionTypeSection.active](this.info);
			switch (newQuestion.question_type) {
				case 'radio':
					newQuestion.config.cols = 2;
					newQuestion.answer_option = [
						{ id: '1', value: '' },
						{ id: '2', value: '' },
						{ id: '3', value: '' },
						{ id: '4', value: '' }
					];
					break;
				case 'arrange_paragraphs':
					const options: Answers[] = shuffleArray<Answers>([{ id: '1', value: '' }, { id: '2', value: '' }, { id: '3', value: '' }, { id: '4', value: '' }]);
					newQuestion.answer_option = shuffleArray<Answers>(options);
					newQuestion.answer_correct = options.map((anw: Answers): string => anw.id).join(',');
					break;
				default:
					break;
			}
			this.question.children.push(newQuestion);
		}
		else {
			void this.notificationService.alertInfo('Thông báo', 'Vui lòng chọn loại câu hỏi');
		}
	}

	async removeChildQuestion(index: number): Promise<void> {
		try {
			if (this.question.children[index]['id']) {
				const confirm: boolean = await this.notificationService.confirmDelete();
				if (confirm) {
					this.loading = true;
					this.courseQuestionsService.deleteCourseQuestions([this.question.children[index]['id']]).subscribe({
						next: (): void => {
							this.loading = false;
							this.question.children = this.question.children.filter((_, i): boolean => i !== index);
						},
						error: (): void => {
							this.loading = false;
							this.notificationService.toastError('Mất kết nối với máy chủ');
						}
					});
				}
			}
			else {
				this.question.children = this.question.children.filter((_, i): boolean => i !== index);
			}
		}
		catch (e) {
			console.error(e);
		}
	}

	async btnImportQuestionMedia(): Promise<void> {
		try {
			const file: OvicFile[] = await this.openFileManagerService.openFileManagerNew({ isMultipleMode: true, ext: 'mp3', tag: 'question' });
			if (['serverAws', 'serverFile'].includes(file[0].source)) {
				this.question.media = { type: 'audio', source: file[0].source, path: file[0].id.toString(10), replay: 1 };
			}
		}
		catch (e) {

		}
	}

	validateInputMediaReplay(): void {
		if (this.question.media?.replay) {
			if (typeof this.question.media.replay !== 'number') {
				const replay: number = parseInt(this.question.media.replay, 10);
				if (!Number.isNaN(replay)) {
					this.question.media.replay = Math.min(10, Math.max(1, replay));
				}
				else {
					this.question.media.replay = 1;
				}
			}
		}
	}

	loopUpdateQuestion(request: Observable<any>[], key: number): Observable<any> {
		return request[key].pipe(mergeMap(a => {
			if (request[key + 1]) {
				return this.loopUpdateQuestion(request, key + 1);
			}
			else {
				return of(null);
			}
		}))
	}

	getStatusTestPromise(request: Observable<any>[]): Promise<any> {
		return new Promise((resolve, reject) => {
			this.loopUpdateQuestion(request, 0).subscribe({
				next: (_role) => {
					resolve(_role);
				},
				error: () => {
					this.notificationService.toastError(
						'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
					);
					resolve(null);
				}
			});
		});
	}

	async updateStatusQuestion(): Promise<void> {
		if (this.question) {
			const requests: Observable<any>[] = [];
			requests.push(this.courseQuestionsService.updateCourseQuestions(this.question['id'], { status: -3 }));
			if (this.question.children && this.question.children.length) {
				requests.push(this.courseQuestionsService.updateCourseQuestionsByCol(this.question['id'], { status: -3 }, 'group_id'));
			}
			await this.getStatusTestPromise(requests);
		}
	}
}
