import { IctuDocument , IctuFile , IctuFileInfo , IctuMedia } from '@app/modules/kiem-thu-ngan-hang-cau-hoi/models/file';

interface ClassStudentParams {
	group : number;
	leader : boolean;
}

export interface ClassPramsGroupElement {
	leader_id : number,
	members : number[],
	group : number; // number of group, starts form 1
}

export interface ClassPrams {
	max_group : number;
	group_size : number;
	block_group : boolean;
	groups : ClassPramsGroupElement[];
}

export interface ClassScoreRatio {
	chuyencan : number,
	kiemtra : number
}

export interface Class {
	id : number;
	category_id : number; // Lớp thuộc ngành nào
	kyhieu : string;
	sotinchi : number;
	course_id : number;
	name : string;
	slug : string;
	course_info : { [ t : string ] : any };
	// manager_ids : number[];
	managers? : Instructor[];
	manager_ids : string;
	manager_info : string;
	time_start : string;
	time_end : string;
	hocky : string;
	khoa : string;
	dothoc : number;
	sosv_dangky : number;
	namhoc : string;
	trongso : ClassScoreRatio | null,
	price : number;
	status : number;
	params : ClassPrams;
	image : IctuFileInfo;
	user_id : number; // creator_id người tao
	created_at : string;
	updated_at : string;
}

export type Instructor = {
	avatar : string;
	display_name : string;
	email : string;
	phone : string;
	username : string;
}

export interface ClassWithInstructor extends Class {
	managers : Instructor[];
}

export interface ClassDocument {
	id : number;
	class_id : number;
	title : string;
	file_info : IctuDocument;
	student_ids : number[] | null; // [1,2,3]: id các học viên được share tài liệu | null share all
	created_at : string;
	updated_at : string;
}

export interface ClassHomeWorkTopic {
	group : number,
	topic : string,
	member_number : number,
	leader_id : number,
	group_point : number,
}


export type ClassHomeWorkTopicType = 'SINGLE' | 'GROUP';

export interface ClassHomeWork {
	id : number;
	class_id : number;
	title : string; // Tiêu đề bài tập hay bài thảo luận
	type : string; // Loại bài tập: BAITAP | THAOLUAN
	desc : string; // Mô tả nội dung bài tập hay bài thảo luận
	files : IctuDocument[]; // ID file đính kèm (nếu có)
	deadlines : string; // Hạn cuối nộp bài
	time_start : string; // thời hạn của bài thảo luận
	user_id : number; // creator_id Người tạo
	room_id : string;
	student_ids : number[]; //null: Tất cả học viên [1, 2]: Id của học viên được giao bài tập thêm
	created_at : string; //Ngày tạo
	topic_type : ClassHomeWorkTopicType,
	topics : ClassHomeWorkTopic[];
	updated_at : string; //Ngày update lần cuối
}

export interface ClassHomeWorkPost {
	id : number;
	class_id : number;
	class_homework_id : number;
	class_student_id : number;
	// files : IctuDriveFile[];
	files : IctuDocument[];
	point : number; //	cho điểm nếu có | -1 là không cho điểm
	status : number; // 0: Chờ duyệt | 1: Chấp nhận | -1: Yêu cầu nộp lại
	note : string; // assignment bài làm của học viên
	ngaynop : string; // Ngày nộp bài
	comment : string; // nhận xét của giảng viên
	co_owner : string; // student_id của các thành viên trong nhóm( Trường hợp nộp bào tập theo nhóm) |15|20|36|
	created_at : string;
	updated_at : string;
}

// lớp học phần
export interface ClassStudent {
	id : number;
	class_id : number;
	student_id : number;
	user_id : number; // lấy trong bảng user
	user_info : object;
	status : ClassStudentStatusType; // 1: đang hoạt động bình thường 0: đang chờ duyệt -1: bỏ học, 2 : closed
	namhoc : string;
	hocky : number;
	params : ClassStudentParams; // không dùng nữa
	created_at : string;
	updated_at : string;
}

export type ClassStudentStatusType = -1 | 0 | 1 | 2 | number;

export interface MixClass {
	class_student : ClassStudent;
	class_object : Class;
	class_title_name : string;
	class_teacher : string;
}

export interface AnswerOptionClassTestQuestion {
	id : string,
	value : string
}

export interface AnswerOption {
	id : string;
	value : string;
}

export interface ClassPlan {
	id : number,
	class_id : number,
	course_id : number,
	course_plan_activity_id : number,
	week : number, // Tuần thứ (1-14)
	date_start_of_week : string // sql date format | ngày bắt đầu của tuần (luôn là thứ 2)
	date_end_of_week : string // sql date format | ngày cuối của tuần
	desc : string, // nội dung ghi chú lưu ý cho sinh viên cần thực hiện trong tuần (nếu có)
	created_by : number,
	updated_by : number,
	is_deleted : number,
	deleted_by : number,
	created_at : string,
	updated_at : string,
}

export type ClassPlanActivityType = 'LESSON' | 'LESSON_TEST' | 'TESTING_TRACNGHIEM' | 'TESTING_TULUAN' | 'MEET' | 'ACTIVITY'; // LESSON; LESSON_TEST (bài tập bổ trợ); TESTING_TRACNGHIEM; TESTING_TULUAN; MEET ;ACTIVITY ;

export interface ClassPlanActivityParams {
	can_jump_forward? : boolean;
	skip? : boolean;
	ignore? : boolean;
	pause_when_change_tap? : boolean; // Cho dừng video khi chuyển tap;
	obligatory? : boolean; // Bắt buộc phải học;
	purpose? : 'SCHEDULED' | 'ADDITIONAL';
}

export interface ClassPlanActivity {
	id : number,
	class_id : number,
	course_id : number,
	plan_id : number,
	course_plan_activity_id : number,
	type : ClassPlanActivityType,
	reference_id : number, // ID bài học; ID bài tập bổ trợ; ID bài kiểm tra trắc nghiệm; ID bài kiểm tra tự luận
	ordering : number,
	title : string,
	desc : string,
	files : IctuFile[],
	video : IctuFile,
	zoom_meet : string,
	params : ClassPlanActivityParams; //
	exprided_date : string, // thời gian cần hoàn thành (mặc định lấy ngày cuối cùng của tuần), trường hợp là zoom hoặc meet thì đây là thời gian bắt đầu expiration date
	created_by : number,
	updated_by : number,
	created_at : string,
	updated_at : string,
	deleted_by : number,
	is_deleted : number,
}

export interface ClassPlanActivityStudent {
	id : number,
	class_id : number,
	class_plan_id : number,
	class_plan_activity_id : number,
	tracking : ClassPlanActivityStudentTrack,
	student_id : number,
	status : number, // -1 : created | 0: doing | 1: done
	is_deleted : number,
	created_by : number,
	updated_by : number,
	deleted_by : number,
	created_at : string,
	updated_at : string,
}

export interface ClassPlanActivityStudentTrack {
	duration : number, 	// Video duration
	played : number, 	// The total time the user has played on the video
	stopped : number, 	// Last stopped time
	reached : number, 	// The maximum time the user has played on the video
	test : ClassPlanActivityStudentTrackTestResult[]
}

export interface ClassPlanActivityStudentTrackTestResult {
	date : string;// 'DD/MM/YYYY HH:mm:ss',
	time : number; // Test duration
	answer : string; // Correct / answer
	point : number;
}

export interface ClassPlanActivityTicket {
}
