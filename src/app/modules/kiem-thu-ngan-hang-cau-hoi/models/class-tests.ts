import { IctuMedia } from '@app/modules/kiem-thu-ngan-hang-cau-hoi/models/file';
import { AnswerOptionClassTestQuestion } from '@modules/kiem-thu-ngan-hang-cau-hoi/models/class';

// export type IctuQuestionType = 'radio' | 'checkbox' | 'selectbox' | 'textarea' | 'inputbox' | 'drag_drop' | 'reorder_words' | 'grouping';
export type IctuQuestionType = 'grouping' | 'drag_drop' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'inputbox' | 'reorder_words' | 'selectbox' | 'matching';

// export const TYPE_TEST_MONKHAC = [
// 	{ id: 1, key: 'grouping', label: 'Câu hỏi kéo thả đáp án vào cột tương ứng' },
// 	{ id: 2, key: 'drag_drop', label: 'Câu hỏi nhóm kéo thả đáp án đúng' },
// 	{ id: 3, key: 'radio', label: 'Chọn 1 đáp án đúng' },
// 	{ id: 4, key: 'checkbox', label: 'Chọn nhiều đáp án đúng' },
// 	{ id: 5, key: 'group-radio', label: 'Nhóm câu hỏi chọn đáp án Đúng - Sai' },
// 	{ id: 6, key: 'group-input', label: 'Nhóm câu hỏi nhập đáp án' },
// ]
//
//
// export const TYPE_TEST_ANHVAN = [
// 	{ id: 7, key: 'inputbox', label: 'Matching 2 vế' },
// 	{ id: 8, key: 'inputbox', label: 'Nhập vào đáp án đúng' },
// 	{ id: 9, key: 'drag_drop', label: 'Drag-drop' },
// 	{ id: 10, key: 'reorder_words', label: 'Sắp xếp lại câu' },
// 	{ id: 11, key: 'radio', label: 'Chọn 1 đáp án đúng' },
// ]


export type ClassTestPurpose = 'ADDITIONAL' | 'SCHEDULED';

export type ClassTestType = 'tienganh' | 'monkhac';

export interface ClassTest {
	id : number;
	class_id : number;
	content : string; // test title
	purpose : ClassTestPurpose;
	media : Object[];	 // json audio => local |video=> youtobe, vimeo, local | tạm thời chưa dùng đến
	status : number;	 // 0 : Deactivate | 1 : active | -1 : delete | 2 : closed
	time_start : string; // Thời gian bắt đầu làm bài kiểm tra (khung 24h)
	total_time : number; // Tổng thời gian làm bài (phút)
	point : number;		 // 10 điểm quy đổi về: thang điểm 10
	source : 'lesson_test_questions' | string;
	type_test : ClassTestType;
	created_at : string;
	updated_at : string;
	created_by : number;
	structure : ClassTestStructure[];
}

export interface ClassTestStructure {
	prefix : string;
	question : number[];
	point : number;
	ordering : number;
	invertedQuestion : boolean;
	invertedAnswer : boolean;
	numberQuestion : number;
}

export interface ClassTestQuestion {
	id : number;
	ordering : number;
	group_id : number;
	class_id : number;
	class_test_id : number;
	question_number : number;
	question_direction : string;
	question_type : IctuQuestionType; // radio; checkbox; selectbox; inputbox
	answer_option : AnswerOptionClassTestQuestion[];
	answer_correct : string;
	config : ClassTestQuestionConfig,
	media : IctuMedia;
	part : number; // 10 20 30 => part 1, part 2, part 3
	skill : string;
	status : number; //	1: active; 0 inactive; -1: delete
	created_at : string;
	updated_at : string;
}

export type ClassTestQuestionExtendAnswer = Pick<ClassStudentTestAnswer , 'id' | 'class_test_question_id' | 'student_answer' | 'result'>;

export interface ClassTestQuestionExtend extends ClassTestQuestion {
	answer : Partial<ClassStudentTestAnswer>;
	child : ClassTestQuestionExtend[];
	dirty : boolean;
	needToReview : boolean;
	answered? : boolean;
	isAnswerCorrect : boolean;
	score : number;
}

export type ClassTestQuestionShort = Pick<ClassTestQuestion , 'id' | 'question_number' | 'question_type' | 'group_id' | 'ordering' | 'config'>;

export interface ClassTestQuestionConfig {
	cols : 1 | 2 | 3 | 4;
	invertedAnswer : boolean;
}

export type ClassTestQuestionStandard = Pick<ClassTestQuestion , 'id' | 'question_number' | 'question_direction' | 'question_type' | 'answer_option' | 'part' | 'group_id' | 'media' | 'config' | 'ordering' | 'skill'>

export interface ClassStudentTestMap {
	prefix : string;
	question : number[]; // [1345,1269]
	point : number;
	ordering : number;
	invertedQuestion : boolean;
	invertedAnswer : boolean;
	totalQuestion : number; // tổng số câu hỏi trong nhóm
	structure : Record<string , number[]>; // { 1345 : [13466,1347,1348,1349,1350] , 1269 : [1270,1271,1272,1273,1274,1275]}
}

export interface ClassStudentTest {
	id : number;
	class_test_id : number;
	class_id : number;
	student_id : number;
	time : number; // Thời gian làm bài của thí sinh(đơn vị giây)
	point : string; //decimal(10,2) default -1.00 | điểm quy về thang 10 (1 số thập phân); -1 là không thi
	note : string; //Ghi chú
	status : number; // -1 : Bỏ thi | 0 : Chưa thi | 1 : Đang thi | 2 : Đã thi xong (Chờ giáo viên chấm điểm) | 3 : Đã chấm xong
	with_correct_answers : number;
	map : ClassStudentTestMap[];
	params : ClassStudentTestParams;
	result : ClassStudentTestResult;
	questions : number[];
	created_at : string;
	updated_at : string;
}

export interface ClassStudentTestResult {
	time : string, // YYYY-MM-DD hh:mm:ss - "2023-12-21 09:01:51",
	point : number, // score coefficient 10
	creator : 'mobile' | 'web'
	reasonForSubmission : ClassStudentTestResultReasonForSubmission
}

export type ClassStudentTestResultReasonForSubmission = 'confirm' | 'expired';

export interface ClassStudentTestParams {
	mark_incomplete : number[], //danh sách câu hỏi mà thí sinh đánh dấu là cần xem lại
	starts : ClassStudentTestParamsStart[], // Số lần thí sinh ấn vào nút bắt đầu làm bài
	distractions : ClassStudentTestParamsDistraction[] // Số lần thí sinh thoát ra và quay lại tab bài thi trong quá trình làm bài
}

export type ClassStudentTestParamsStartDevice = 'mobile' | 'web';

export type ClassStudentTestParamsDistractionType = 'IN' | 'OUT';

export interface ClassStudentTestParamsDistraction {
	type : ClassStudentTestParamsDistractionType,
	_created_at : 'DD/MM/YYYY hh:mm:ss', // Avoid using duplicate key pls
	time_left : number
}

export interface ClassStudentTestParamsStart {
	_created_at : 'DD/MM/YYYY hh:mm:ss', // Avoid using duplicate key pls
	time_left : number,
	device : ClassStudentTestParamsStartDevice
}

export interface ClassStudentTestWithTest extends ClassStudentTest {
	test : ClassTestQuestionStandard[];
}

export type ClassStudentTestStructure = Pick<ClassStudentTest , 'class_test_id' | 'class_id' | 'student_id' | 'time' | 'map' | 'questions' | 'params'>

export interface ClassStudentTestLog {
	id : number;
	class_id : number;
	student_id : number;
	class_student_test_id : number;
	content : string; //Bắt dầu thi; Nộp bài; Thoát khỏi chế độ full màn hình; Chuyển Ứng dụng khác | start_the_test | submit_result | escape_full_screen | switch_to_other_apps
	created_at : string;
	updated_at : string;
}

export interface ClassStudentTestAnswer {
	id : number;
	class_student_test_id : number;
	class_test_id : number;
	class_test_question_id : number;
	class_id : number;
	student_id : number;
	student_answer : string;
	temporary : string; // lưu kết quả tạm cho question-type-reorder-words
	result : number;	// 1: đúng | 0: sai ; tương đương: 1 => một điểm , 0 => không điểm
	created_at : string;
	updated_at : string;
}

export enum TestLogStatus {
	startTheTest                    = 'start_the_test' ,
	submitResultByUser              = 'submit_result_by_user' ,
	closeTabDuringTheTest           = 'close_tab_during_the_test' ,
	resubmitResultByUser            = 'resubmit_result_by_user' ,
	forceSubmitResultBecauseTimeout = 'force_submit_result_because_timeout' ,
	exitFullScreen                  = 'exit_full_screen' ,
	openFullScreen                  = 'open_full_screen' ,
	switchToOtherApps               = 'switch_to_other_apps' ,
}
