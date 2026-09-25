import { Component , OnInit } from '@angular/core';
import { ElnKhoaHoc , EXAMFORMAT } from '@shared/models/elng-khoa-hoc';
import { CoursePlanActivities } from '@shared/models/course-plan-activities';
import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { ConfigsService } from '@shared/services/configs.service';
import { ConditionOption , type Set } from '@shared/models/condition-option';
import { IctuPaginator , IctuQueryParams , OvicConditionParam , OvicQueryCondition } from '@core/models/dto';
import { forkJoin , mergeMap , Observable , of , switchMap } from 'rxjs';
import { MatListModule , MatSelectionListChange } from '@angular/material/list';
import { CourseTesters } from '@shared/models/course-testers';
import { CourseTestersService } from '@shared/services/course-testers.service';
import { map } from 'rxjs/operators';
import { User } from '@core/models/user';
import { TimeForTest } from '@modules/kiem-thu-ngan-hang-cau-hoi/models/time-for-test';
import { CourseTesterSessionService } from '@shared/services/course-tester-session.service';
import { CourseTesterSession , CourseTesterSessionStructure , courseTesterSessionStructureCounter } from '@shared/models/course-tester-session';
import { Configs } from '@shared/models/configs';
import { CourseQuestions } from '@shared/models/course-questions';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { CommonModule } from '@angular/common';
import { FormsModule , ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { CourseTesterResultsService } from "@shared/services/course-tester-results.service";
import { CourseTesterResults } from "@shared/models/course-tester-results";
import { arrayShuffle } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';

interface CourseTestersExtend extends CourseTesters {
	coursePlanActivities : CoursePlanActivities;
}

interface TeacherTestInfo extends ElnKhoaHoc {
	courseTesters : CourseTestersExtend[];
	userCreatorPlan : User,
	subInfo : string;
}

type BlockState = 'loading' | 'success' | 'error' | 'onwaiting' | 'empty';

interface SubjectSection {
	data : TeacherTestInfo[];
	selected : TeacherTestInfo;
	state : BlockState;
}

interface GridSection {
	data : GridSectionCell[],
	state : BlockState;
}

interface GridSectionCell {
	sessions : CourseTesterSession[],
	newSession : Partial<CourseTesterSession>,
	courseTester : CourseTestersExtend;
	passed : boolean, // test verify when user's best result reached the requirement
	verify : boolean, // all cdr status eqa 1
	canDo : boolean, // you can do when your tried under totalAttempts
	report : {
		know : number,
		understand : number,
		apply : number,
		analysis : number,
		totalQuestions : number;
		numberOfTestedQuestion : number;
		numberOfPendingQuestion : number;
		totalAttempts : number,
		tried : number,
		bestResult : number;
		requirement : number,
	}
	listCdr : CoursePlanActivities[]
	questions : CourseQuestions[]
}

interface ReviewTestSession {
	displayModal : boolean,
	cell : GridSectionCell,
	session : CourseTesterSession,
}

interface LectureCheckTestDto {
	courseTesters : CourseTesters[],
	courses : ElnKhoaHoc[],
	coursePlanActivities : CoursePlanActivities[],
	users : User[]
}

/** Thống kê kết quả test của tuần
 * @prop {CourseQuestions[]} totalQuestions - Tổng số câu hỏi ( Chỉ tính câu có phương án trả lời, không tính câu dẫn)
 * @prop {CourseQuestions[]} answeredQuestions - Những câu hỏi người dùng đã từng trả lời
 * @prop {CourseQuestions[]} passedQuestions - Những câu hỏi đã trả lời đúng hoặc đã được duyệt
 * @prop {CourseQuestions[]} testQuestions - Những câu hỏi yêu cầu test ( Gồm những câu hỏi gv chưa test hoặc đã test nhưng trả lời sai)
 * @prop {number[]} testedQuestionIDs - Danh sach id những câu hỏi GV đã từng test
 * */
interface SessionTestReport {
	totalQuestions : CourseQuestions[];
	answeredQuestions : CourseQuestions[];
	passedQuestions : CourseQuestions[];
	needTestQuestions : CourseQuestions[];
	testedQuestionIDs : number[],
}

@Component( {
	standalone  : true ,
	imports     : [ CommonModule , ReactiveFormsModule , FormsModule , DialogModule , ProgressBarModule , MatListModule , ButtonModule ] ,
	selector    : 'app-giang-vien-test' ,
	templateUrl : './giang-vien-test.component.html' ,
	styleUrls   : [ './giang-vien-test.component.css' ]
} )
export class GiangVienTestComponent implements OnInit {

	menu : SubjectSection = {
		data     : [] ,
		selected : null ,
		state    : 'loading'
	};

	grid : GridSection = {
		data  : [] ,
		state : 'onwaiting'
	};

	timeForTest : TimeForTest;

	loading : boolean = false;

	review : ReviewTestSession = {
		displayModal : false ,
		cell         : null ,
		session      : null
	};

	constructor (
		private elnKhoaHocService : ElnKhoaHocService ,
		private userService : UserService ,
		private auth : AuthService ,
		private notificationService : NotificationService ,
		private router : Router ,
		private coursePlanActivitiesService : CoursePlanActivitiesService ,
		private configsService : ConfigsService ,
		private courseQuestionsService : CourseQuestionsService ,
		private courseTestersService : CourseTestersService ,
		private courseTesterSessionService : CourseTesterSessionService ,
		private courseTesterResultsService : CourseTesterResultsService
	) {
	}

	ngOnInit () : void {
		this.loadMenu();
	}

	private loadMenu () : void {
		this.menu.state = 'loading';
		this.courseTestersService.receiveAssignedTest( this.auth.user.id ).pipe(
			mergeMap( ( courses : CourseTesters[] ) : Observable<LectureCheckTestDto> => this.loadCourseFromCourseTester( courses ) ) ,
			mergeMap( ( response : LectureCheckTestDto ) : Observable<LectureCheckTestDto> => this.loadAssignedTeachersFromCourses( response ) )
		).subscribe( {
			next  : ( { courseTesters , courses , coursePlanActivities , users } : LectureCheckTestDto ) : void => {
				this.menu.data  = courses.map( ( f : ElnKhoaHoc ) : TeacherTestInfo => {
					let info : string = '';
					if ( f.params ) {
						const sotinchi : number    = f.params.sotinchi ? f.params.sotinchi : 0;
						const sotinchi_th : number = f.params[ 'sotinchi_th' ] ? f.params[ 'sotinchi_th' ] : 0;
						const index_m : number     = EXAMFORMAT.findIndex( ( { key } : { key : string } ) : boolean => key === f.params.exam_format );
						let exam : string          = 'Chưa có thông tin';
						if ( index_m !== -1 ) {
							exam = EXAMFORMAT[ index_m ].label;
						}
						info = ' - TC: ' + sotinchi.toString().concat( '-' , sotinchi_th.toString( 10 ) , ' - ' , exam );
					}
					const filteredCourseTesters : CourseTestersExtend[] = courseTesters.filter( ( { course_id } : CourseTesters ) : boolean => course_id === f.id ).map( ( c : CourseTesters ) : CourseTestersExtend => {
						return {
							... c ,
							coursePlanActivities : coursePlanActivities.find( ( _cpa : CoursePlanActivities ) : boolean => _cpa.id === c.course_plan_activity_id )
						};
					} );
					const userCreatorPlan : User                        = users.find( ( _user : User ) : boolean => _user.id === f.creator_plan_id );
					return {
						... f ,
						courseTesters : filteredCourseTesters ,
						userCreatorPlan ,
						subInfo       : ( userCreatorPlan?.display_name || 'Chưa có giảng viên' ) + info
					};
				} );
				this.menu.state = 'success';
			} ,
			error : () : void => {
				this.menu.state = 'error';
			}
		} );
	}

	reloadMenu () : void {
		this.loadMenu();
	}

	private loadCourseFromCourseTester ( courses : CourseTesters[] ) : Observable<LectureCheckTestDto> {
		if ( ! courses.length ) {
			return of( { courseTesters : [] , courses : [] , coursePlanActivities : [] , users : [] } );
		}
		const courseIds : number[]          = courses.map( ( c : CourseTesters ) : number => c.course_id );
		const queryParams : IctuQueryParams = {
			include    : [ ... new Set( courseIds ) ].join( ',' ) ,
			include_by : 'id'
		};

		const coursePlanActivityIds : number[]              = courses.map( ( c : CourseTesters ) : number => c.course_plan_activity_id );
		const conditionsForPlanActivities : ConditionOption = {
			condition : [] ,
			set       : [
				{ label : 'limit' , value : '-1' } ,
				{ label : 'include' , value : [ ... new Set( coursePlanActivityIds ) ].join( ',' ) } ,
				{ label : 'include_by' , value : 'id' }
			] ,
			page      : null
		};

		return forkJoin<{
			courseTesters : Observable<CourseTesters[]>,
			courses : Observable<ElnKhoaHoc[]>,
			coursePlanActivities : Observable<CoursePlanActivities[]>,
			users : Observable<User[]>,
		}>( {
			courseTesters        : of( courses ) ,
			courses              : this.elnKhoaHocService.get<ElnKhoaHoc>( [] , queryParams ).pipe( map( ( res : IctuPaginator<ElnKhoaHoc> ) : ElnKhoaHoc[] => res.data ) ) ,
			coursePlanActivities : this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew( conditionsForPlanActivities ).pipe( map( ( res : { data : CoursePlanActivities[] } ) : CoursePlanActivities[] => res.data ) ) ,
			users                : of( [] )
		} );
	}

	private loadAssignedTeachersFromCourses ( preLoadedData : LectureCheckTestDto ) : Observable<LectureCheckTestDto> {
		const teacher_ids : number[]              = preLoadedData.courses.map( ( { creator_plan_id } : ElnKhoaHoc ) : number => creator_plan_id );
		const condition_teacher : ConditionOption = {
			condition : [] ,
			set       : [
				{ label : 'limit' , value : '-1' } ,
				{ label : 'include' , value : [ ... new Set( teacher_ids ) ].join( ',' ) } ,
				{ label : 'include_by' , value : 'id' }
			] ,
			page      : null
		};
		return teacher_ids.length ? this.userService.getUserByPageNew( condition_teacher ).pipe(
			map( ( response : { data : User[] } ) : LectureCheckTestDto => ( { ... preLoadedData , users : response.data } ) )
		) : of( preLoadedData );
	}

	onSelectCourse ( event : MatSelectionListChange ) : void {
		this.menu.selected = event.options[ 0 ].value;
		this.collectTestReports();
	}

	/**
	 * Lấy toàn bộ những câu đã trả lời đúng từ trước
	 * @param {CourseTestersExtend[]} courseTesters - Mảng các phiên đã được phân công( mỗi phiên là 1 tuần )
	 * @return {CourseTesterResults[]} - Mảng các câu hỏi đã trả lời đúng ( đã trả lời trước đó và đươc máy chấm là đúng )
	 * */
	private getCorrectResults ( courseTesters : CourseTestersExtend[] ) : Observable<CourseTesterResults[]> {
		if ( ! courseTesters.length ) {
			return of( [] );
		}
		const conditions : OvicConditionParam[] = [ {
			conditionName : 'result' ,
			condition     : OvicQueryCondition.equal ,
			value         : '1'
		} ];
		const queryParams : IctuQueryParams     = {
			limit      : -1 ,
			paged      : 1 ,
			select     : 'id,result,course_tester_id,question_id' ,
			include_by : 'course_tester_id' ,
			include    : courseTesters.map( ( t : CourseTestersExtend ) : number => t.id ).join( ',' ) ,
			groupby    : 'question_id'
		};
		// get all correct answered from course testers;
		return this.courseTesterResultsService.query<CourseTesterResults>( conditions , queryParams );
	}

	/**
	 * Lấy toàn bộ ngân hàng câu hỏi của môn học
	 * @param {number} courseID - Course ID
	 * @return {CourseQuestions[]} - Mảng các câu hỏi của ngân hàng môn học
	 * */
	private getCourseQuestionsByCourseID ( courseID : number ) : Observable<CourseQuestions[]> {
		const conditions : OvicConditionParam[] = [
			{ conditionName : 'course_id' , condition : OvicQueryCondition.equal , value : courseID.toString() } ,
			{ conditionName : 'reference' , condition : OvicQueryCondition.equal , value : 'course_plan_activities' , orWhere : 'and' } ,
			{ conditionName : 'status' , condition : OvicQueryCondition.notEqual , value : '-3' , orWhere : 'and' }
		];
		const queryParams : IctuQueryParams     = {
			limit  : -1 ,
			paged  : 1 ,
			select : 'id,cdr,group_id,question_type,reference_id,status,old_status'
		};
		return this.courseQuestionsService.query<CourseQuestions>( conditions , queryParams );
	}

	/**
	 * get plan activities by CourseTesters
	 * @param {CourseTestersExtend[]} courseTesters - Array of CourseTesters
	 * @return {CoursePlanActivities[]} - Array of plan activities.
	 * */
	private getPlanActivitiesByIDs ( courseTesters : CourseTestersExtend[] ) : Observable<CoursePlanActivities[]> {
		if ( ! courseTesters.length ) {
			return of( [] );
		}
		const conditions : OvicConditionParam[] = [
			{ conditionName : 'type' , condition : OvicQueryCondition.equal , value : 'ACTIVITY_CDR' } ,
			{ conditionName : 'status' , condition : OvicQueryCondition.notEqual , value : '-3' , orWhere : 'and' }
		];
		const queryParams : IctuQueryParams     = {
			paged      : 1 ,
			limit      : -1 ,
			include    : [ ... new Set( courseTesters.map( ( t : CourseTestersExtend ) : number => t.coursePlanActivities.id ) ) ].join( ',' ) ,
			include_by : 'parent_id' ,
			select     : 'id,week,parent_id,course_id,kyhieu,ma_cdr,type,cdr_cauhoi'
		};
		return this.coursePlanActivitiesService.query<CoursePlanActivities>( conditions , queryParams );
	}

	/**
	 * get all CourseTesterSessions
	 * @param {number} userID - User ID.
	 * @param {number} courseID - Course ID
	 * @return {CoursePlanActivities[]} - Array of plan activities.
	 * */
	private getCourseTesterSessions ( userID : number , courseID : number ) : Observable<CourseTesterSession[]> {
		const conditions : OvicConditionParam[] = [
			{ conditionName : 'user_id' , condition : OvicQueryCondition.equal , value : userID.toString( 10 ) } ,
			{ conditionName : 'course_id' , condition : OvicQueryCondition.equal , value : courseID.toString() , orWhere : 'and' }
		];
		const queryParams : IctuQueryParams     = {
			limit : -1 ,
			paged : 1
		};
		return this.courseTesterSessionService.query<CourseTesterSession>( conditions , queryParams )
	}

	/**
	 * get timeForTestConfig
	 * @return {Configs} - timeForTestConfig Object.
	 * */
	private getTimeForTestConfig () : Observable<Configs> {
		const conditions : OvicConditionParam[] = [
			{ conditionName : 'config_key' , value : 'TIME_FOR_TEST' , condition : OvicQueryCondition.equal }
		];
		const queryParams : IctuQueryParams     = {
			limit : 1 ,
			paged : 1
		};
		return this.configsService.query<Configs>( conditions , queryParams ).pipe(
			map( ( response : Configs[] ) : Configs => Array.isArray( response ) && response.length ? response[ 0 ] : null )
		)
	}

	collectTestReports () : void {
		this.grid.state = 'loading';
		// const cds : ConditionOption = {
		// 	condition : [ { conditionName : 'config_key' , value : 'TIME_FOR_TEST' , condition : OvicQueryCondition.equal } ] ,
		// 	set       : [] ,
		// 	page      : '1'
		// };
		// const conditionsForCourseQuestions : ConditionOption = {
		// 	condition : [
		// 		{ conditionName : 'course_id' , condition : OvicQueryCondition.equal , value : this.menu.selected.id.toString() } ,
		// 		{ conditionName : 'reference' , condition : OvicQueryCondition.equal , value : 'course_plan_activities' , orWhere : 'and' } ,
		// 		{ conditionName : 'status' , condition : OvicQueryCondition.notEqual , value : '-3' , orWhere : 'and' }
		// 	] ,
		// 	set       : [ { label : 'limit' , value : '-1' } , { label : 'select' , value : 'id,cdr,group_id,question_type,reference_id,status' } ] ,
		// 	page      : null
		// };
		// const conditionsForPlanActivities : ConditionOption = {
		// 	condition : [
		// 		{ conditionName : 'type' , condition : OvicQueryCondition.equal , value : 'ACTIVITY_CDR' } ,
		// 		{ conditionName : 'status' , condition : OvicQueryCondition.notEqual , value : '-3' , orWhere : 'and' }
		// 	] ,
		// 	set       : [
		// 		{ label : 'select' , value : 'id,week,parent_id,course_id,kyhieu,ma_cdr,type,cdr_cauhoi' } ,
		// 		{ label : 'paged' , value : '1' } ,
		// 		{ label : 'limit' , value : '-1' } ,
		// 		{ label : 'include_by' , value : 'parent_id' } ,
		// 		{ label : 'include' , value : [ ... new Set( this.menu.selected.courseTesters.map( t => t.coursePlanActivities.id ) ) ].join( ',' ) }
		// 	] ,
		// 	page      : null
		// };
		// forkJoin<[ Configs , CourseTesterSession[] , CourseQuestions[] , CoursePlanActivities[] ]>( [
		// 	this.configsService.getConfigsByPageNew( cds ).pipe( map( ( res ) : Configs => res.data.length ? res.data[ 0 ] : null ) ) ,
		// 	this.courseTesterSessionService.query<CourseTesterSession>( [ { conditionName : 'user_id' , condition : OvicQueryCondition.equal , value : this.auth.user.id.toString( 10 ) } ] , { limit : -1 , paged : 1 , include_by : 'course_id' , include : [ ... new Set( this.menu.selected.courseTesters.map( u => u.course_id ) ) ].join( ',' ) } ) ,
		// 	this.courseQuestionsService.getCourseQuestionsByPageNew( conditionsForCourseQuestions ).pipe( map( ( res ) : CourseQuestions[] => res.data ) ) ,
		// 	this.menu.selected.courseTesters.length ? this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew( conditionsForPlanActivities ).pipe( map( ( res ) : CoursePlanActivities[] => res.data ) ) : of( [] )
		// ] )

		const userID : number                       = this.auth.user.id;
		const courseID : number                     = this.menu.selected.id;
		const courseTesters : CourseTestersExtend[] = this.menu.selected.courseTesters;
		this.notificationService.isProcessing( true );
		forkJoin<{
			config : Observable<Configs>,
			courseTesterSessions : Observable<CourseTesterSession[]>,
			courseQuestions : Observable<CourseQuestions[]>,
			coursePlanActivities : Observable<CoursePlanActivities[]>,
			courseTesterResults : Observable<CourseTesterResults[]>,
		}>( {
			config               : this.getTimeForTestConfig() ,
			courseTesterSessions : this.getCourseTesterSessions( userID , courseID ) ,
			courseQuestions      : this.getCourseQuestionsByCourseID( courseID ) ,
			coursePlanActivities : this.getPlanActivitiesByIDs( courseTesters ) ,
			courseTesterResults  : this.getCorrectResults( courseTesters )
		} ).subscribe( {
			next  : ( { config , courseTesterSessions , courseQuestions , coursePlanActivities , courseTesterResults } : { config : Configs, courseTesterSessions : CourseTesterSession[], courseQuestions : CourseQuestions[], coursePlanActivities : CoursePlanActivities[], courseTesterResults : CourseTesterResults[], } ) : void => {
				this.notificationService.isProcessing( false );
				this.timeForTest = Object.assign( { MONKHAC : {} , PASSED : 0 , TIENGANH : {} } , config.params );
				this.grid.data   = this.menu.selected.courseTesters.reduce( ( reducer : GridSectionCell[] , courseTester : CourseTestersExtend ) : GridSectionCell[] => {
					const sessions : CourseTesterSession[]       = courseTesterSessions.filter( s => s.course_tester_id === courseTester.id );
					// const lastSessions : CourseTesterSession       = sessions.length ? sessions[ sessions.length - 1 ] : null;
					const listCdr : CoursePlanActivities[]       = coursePlanActivities.filter( ( { parent_id , type } : CoursePlanActivities ) : boolean => parent_id === courseTester.coursePlanActivities.id && type === 'ACTIVITY_CDR' );
					const cdrIds : number[]                      = listCdr.map( i => i.id );
					const _weekTestQuestions : CourseQuestions[] = courseQuestions.filter( ( i : CourseQuestions ) : boolean => cdrIds.includes( i.reference_id ) );
					const questions : CourseQuestions[]          = _weekTestQuestions.filter( ( i : CourseQuestions ) : boolean => ( i.group_id === 0 || -1 !== _weekTestQuestions.findIndex( ( _o : CourseQuestions ) : boolean => _o.id === i.group_id ) ) )
					// let nextSession : Partial<CourseTesterSession> = sessions.find( s => s.status === 0 );

					const maxRound : number = sessions.reduce( ( _maxRound : number , _s : CourseTesterSession ) : number => Math.max( _maxRound , _s.round ) , 0 );
					// const allTestQuestion : CourseQuestions[]         = questions.reduce( ( reducer : CourseQuestions[] , question : CourseQuestions ) : CourseQuestions[] => {
					// 	if ( question.group_id === 0 ) {
					// 		reducer.push( question );
					// 		if ( this.menu.selected.av === 1 ) {
					// 			const childQuestion : CourseQuestions[] = arrayShuffle<CourseQuestions>( questions.filter( q => q.group_id === question.id ) );
					// 			// childQuestion.length                    = Math.min( childQuestion.length , 4 );
					// 			reducer.push( ... childQuestion );
					// 		}
					// 		else {
					// 			// 'grouping' | 'drag_drop' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'inputbox' | 'reorder_words' | 'matching';
					// 			if ( [ 'group-input' , 'group-radio' , 'grouping' , 'drag_drop' ].includes( question.question_type ) ) {
					// 				const childQuestion : CourseQuestions[] = arrayShuffle<CourseQuestions>( questions.filter( q => q.group_id === question.id ) );
					// 				// childQuestion.length                    = Math.min( childQuestion.length , 4 );
					// 				reducer.push( ... childQuestion );
					// 			}
					// 		}
					// 	}
					// 	return reducer;
					// } , new Array<CourseQuestions>() );

					const nextSession : Partial<CourseTesterSession> = {
						av                      : this.menu.selected.av ,
						user_id                 : this.auth.user.id ,
						course_tester_id        : courseTester.id ,
						course_plan_activity_id : courseTester.course_plan_activity_id ,
						course_id               : courseTester.course_id ,
						total_questions         : 0 ,
						week                    : courseTester.week ,
						round                   : maxRound + 1 ,
						passing_score           : 100 ,
						passed                  : 0 ,
						score                   : 0 ,
						status                  : 0 ,
						structure               : { map : [] , know : 0 , apply : 0 , analysis : 0 , understand : 0 }
					};

					const testStructure : CourseTesterSessionStructure = courseTesterSessionStructureCounter( questions , this.menu.selected.av )

					const _initSessionTestReport : SessionTestReport = {
						totalQuestions    : [] ,
						answeredQuestions : [] ,
						passedQuestions   : [] ,
						needTestQuestions : [] ,
						testedQuestionIDs : [ ... new Set( sessions.filter( ( _cts : CourseTesterSession ) : boolean => _cts.status === 1 ).reduce( ( _rdc2 : number[] , _cts : CourseTesterSession ) : number[] => {
							_rdc2.push( ... _cts.structure.map );
							return _rdc2;
						} , [] ) ) ]
					};

					const _weekTestReport : SessionTestReport = questions.reduce( ( _weekTestReportReducer : SessionTestReport , _qs : CourseQuestions ) : SessionTestReport => {
						if ( _qs.group_id !== 0 || ( this.menu.selected.av !== 1 && ! [ 'group-input' , 'group-radio' , 'grouping' , 'drag_drop' ].includes( _qs.question_type ) ) ) {
							_weekTestReportReducer.totalQuestions.push( _qs );
							// Check if the current question already exists in the list of correctly answered questions.
							if (
								( -1 !== courseTesterResults.findIndex( ( _anw : CourseTesterResults ) : boolean => _anw.question_id === _qs.id ) )
								|| ( _qs.group_id === 0 && ( _qs.old_status === 1 || _qs.status === 1 ) )
								|| ( _qs.group_id !== 0 && ( questions.find( _n => _n.id === _qs.group_id )?.status === 1 ) || questions.find( _n => _n.id === _qs.group_id )?.old_status === 1 )
							) {
								_weekTestReportReducer.passedQuestions.push( _qs );
								_weekTestReportReducer.answeredQuestions.push( _qs );
							}
							else if ( _weekTestReportReducer.testedQuestionIDs.includes( _qs.id ) ) {
								_weekTestReportReducer.answeredQuestions.push( _qs );
								_weekTestReportReducer.needTestQuestions.push( _qs );
							}
							else {
								_weekTestReportReducer.needTestQuestions.push( _qs );
							}
						}
						return _weekTestReportReducer;
					} , _initSessionTestReport );

					if ( _weekTestReport.needTestQuestions.length ) {
						const _initRetestQuestions : CourseQuestions[]     = JSON.parse( JSON.stringify( _weekTestReport.needTestQuestions ) );
						const totalNeedRetestQuestions : CourseQuestions[] = _initRetestQuestions.reduce( ( _rdcRetestQuestions : CourseQuestions[] , __question : CourseQuestions ) : CourseQuestions[] => {
							const _findParentQuestion : CourseQuestions = __question.group_id ? questions.find( i => i.id === __question.group_id ) : null;
							if ( _findParentQuestion ) {
								_rdcRetestQuestions.push( _findParentQuestion );
							}
							if ( [ 'grouping' , 'drag_drop' ].includes( __question.question_type ) ) {
								_rdcRetestQuestions.push( ... questions.filter( ( __i2 : CourseQuestions ) : boolean => __i2.group_id === __question.group_id ) );
							}
							else {
								_rdcRetestQuestions.push( __question );
							}
							return _rdcRetestQuestions;
						} , [] );

						const __uniqueIds : number[] = [ ... new Set( totalNeedRetestQuestions.map( ( _cq4 : CourseQuestions ) : number => _cq4.id ) ) ];
						nextSession.structure        = courseTesterSessionStructureCounter( questions.filter( ( _cvt5 : CourseQuestions ) : boolean => __uniqueIds.includes( _cvt5.id ) ) , this.menu.selected.av );
						nextSession.structure.map    = arrayShuffle<number>( nextSession.structure.map );
						// nextSession.total_questions                     = nextSession.structure.map.length;
						nextSession.total_questions  = _weekTestReport.needTestQuestions.length;
					}

					// const totalQuestions : number = questions.length;
					//
					// let test_array = [];
					//
					// let number_question = [];
					//
					// sessions.forEach( f => {
					// 	test_array = test_array.concat( f.structure.map );
					// 	if ( f.score >= this.timeForTest.PASSED ) {
					// 		number_question = number_question.concat( f.structure.map );
					// 	}
					// } );
					//
					// const _parent = questions.filter( m => m.group_id === 0 );
					//
					// _parent.forEach( f => {
					// 	if ( f.status === 1 ) {
					// 		test_array.push( f.id );
					// 		number_question.push( f.id );
					// 		const _child = questions.filter( m => m.group_id === f.id )
					// 		if ( f.status === 1 ) {
					// 			_child.forEach( c => {
					// 				test_array.push( c.id );
					// 				number_question.push( f.id );
					// 			} )
					// 		}
					// 	}
					// } )

					// let numberOfTestedQuestion : number = [ ... new Set( test_array ) ].length;
					//
					// let numberOfPendingQuestion : number = Math.max( 0 , ( totalQuestions - numberOfTestedQuestion ) );
					//
					// const check_passed = Math.max( 0 , ( totalQuestions - [ ... new Set( number_question ) ].length ) ) === 0 || questions.filter( m => m.status === 1 && m.group_id === 0 ).length === questions.filter( m => m.group_id === 0 ).length ? true : false;
					//
					// if ( check_passed === true ) {
					// 	numberOfTestedQuestion  = totalQuestions;
					// 	numberOfPendingQuestion = 0;
					// }

					// if ( courseTester.week === 4 ) {
					// 	console.log( '===================== week : ' + courseTester.week + ' =====================' );
					// 	console.log( nextSession );
					// 	console.log( _weekTestReport );
					// 	console.log( _weekTestReport.totalQuestions.length - _weekTestReport.passedQuestions.length );
					// 	console.log( questions.filter( m => m.status === 1 && m.group_id === 0 ).length );
					// 	console.log( questions.filter( m => m.group_id === 0 ).length );
					// 	console.log( questions.filter( m => m.status === 1 && m.group_id === 0 ).length === questions.filter( m => m.group_id === 0 ).length );
					// 	console.log( '_weekTestQuestions : ' , _weekTestQuestions.length );
					// 	console.log( 'questions : ' , questions.length );
					// 	console.log( '===================== end =====================' );
					// }

					const cell : GridSectionCell = {
						questions ,
						sessions ,
						newSession : nextSession ,
						// canDo  : numberOfPendingQuestion > 0 || sessions.filter( ( s : CourseTesterSession ) : boolean => s.status > 0 ).length < courseTester.solan ,
						canDo  : true ,
						verify : listCdr.length ? listCdr.reduce( ( _reducer , cdr ) : boolean => _reducer && !! ( cdr && cdr.cdr_cauhoi && cdr.cdr_cauhoi[ 'status' ] === 1 ) , true ) : false ,
						passed : ( _weekTestReport.totalQuestions.length - _weekTestReport.passedQuestions.length ) === 0 || ( questions.filter( m => m.status === 1 && m.group_id === 0 ).length === questions.filter( m => m.group_id === 0 ).length ) ,
						report : {
							bestResult              : sessions.length ? Math.max( ... sessions.map( t => t.score ) ) : 0 ,
							requirement             : 100 ,
							totalAttempts           : courseTester.solan ,
							tried                   : sessions.filter( ( s : CourseTesterSession ) : boolean => s.status > 0 ).length ,
							totalQuestions          : _weekTestReport.totalQuestions.length ,
							numberOfTestedQuestion  : _weekTestReport.answeredQuestions.length ,
							numberOfPendingQuestion : _weekTestReport.needTestQuestions.length ,
							analysis                : testStructure.analysis ,
							apply                   : testStructure.apply ,
							understand              : testStructure.understand ,
							know                    : testStructure.know
						} ,
						listCdr ,
						courseTester
					};

					reducer.push( cell );
					return reducer;
				} , new Array<GridSectionCell>() ).filter( t => t.verify );
				this.grid.state  = 'success';
			} ,
			error : () : void => {
				this.notificationService.isProcessing( false );
				this.grid.state = 'error';
			}
		} );
	}

	reCollectData () : void {
		this.collectTestReports();
	}

	doTest ( cell : GridSectionCell ) : void {
		if ( ! cell.canDo ) {
			return;
		}
		let request$ : Observable<number>;

		// Kiểm comments 28-Oct-25
		// if ( cell.sessions.filter( ( s : CourseTesterSession ) : boolean => s.status > 0 ).length < cell.report.totalAttempts ) {
		// 	// request$ = cell.newSession.id ? of( cell.newSession.id ) : this.courseTesterSessionService.create( cell.newSession );
		// 	request$ = cell.newSession.id ? of( cell.newSession.id ) : this.getQuestionHaveCheck( cell );
		// }
		// else if ( cell.sessions.length ) {
		// 	const lastSession : Partial<CourseTesterSession> = cell.sessions[ cell.sessions.length - 1 ];
		// 	request$                                         = this.courseTesterSessionService.update( lastSession.id , {
		// 		total_questions : cell.questions.length ,
		// 		status          : 0 ,
		// 		structure       : Object.assign<CourseTesterSessionStructure , any>( cell.newSession.structure , { lastStructure : lastSession.structure } )
		// 	} );
		// }

		// request$ = cell.newSession?.id ? of( cell.newSession.id ) : this.getQuestionHaveCheck( cell );
		request$ = cell.newSession?.id ? of( cell.newSession.id ) : this.courseTesterSessionService.create( cell.newSession );
		if ( request$ ) {
			this.loading = true;
			request$.subscribe( {
				next  : ( id : number ) : void => {
					void this.router.navigate( [ '/kiem-thu-ngan-hang-cau-hoi' , id ] );
					this.loading = false;
				} ,
				error : () : void => {
					this.notificationService.toastError( 'Mất kết nối với máy chủ' );
					this.loading = false;
				}
			} );
		}
	}

	btnReviewTest ( cell : GridSectionCell ) : void {
		this.review.session      = null;
		this.review.cell         = cell;
		this.review.displayModal = true;
	}

	btnReviewTestChooser ( session : CourseTesterSession ) : void {
		this.review.displayModal = false;
		if ( session ) {
			this.review.session = session;
			void this.router.navigate( [ '/kiem-thu-ngan-hang-cau-hoi' , session.id ] , { queryParams : { mode : 'preview' } } );
		}
	}

	private getQuestionHaveCheck ( cell : GridSectionCell ) : Observable<number> {
		const passedSessionIDs : number[]                = cell.sessions.filter( ( s : CourseTesterSession ) : boolean => s.status == 1 ).map( m => m.id );
		let request$ : Observable<CourseTesterResults[]> = of( [] );
		if ( passedSessionIDs.length ) {
			const conditions : OvicConditionParam[] = [ {
				conditionName : 'result' ,
				condition     : OvicQueryCondition.equal ,
				value         : '1'
			} ];
			const queryParams : IctuQueryParams     = {
				limit      : -1 ,
				paged      : 1 ,
				include_by : 'course_tester_session_id' ,
				include    : passedSessionIDs.join( ',' )
			};
			// get all correct answered from test results;
			request$                                = this.courseTesterResultsService.query<CourseTesterResults>( conditions , queryParams );
		}
		return request$.pipe(
			map( ( listCorrectAnswered : CourseTesterResults[] ) : number[] => {
				if ( listCorrectAnswered.length ) {
					// Filter questions that have had incorrect answers
					const correctAnsweredIDs : number[] = [ ... new Set( listCorrectAnswered.map( ( _answered : CourseTesterResults ) : number => _answered.question_id ) ) ];
					return cell.newSession.structure.map.filter( ( _questionID : number ) : boolean => ! correctAnsweredIDs.includes( _questionID ) );
				}
				else {
					return cell.newSession.structure.map;
				}
			} ) ,
			switchMap( ( parentQuestionIDs : number[] ) : Observable<number[]> => {
				// get all child question
				return this.getAllChildQuestionIDs( parentQuestionIDs );
			} ) ,
			switchMap( ( questionIDs : number[] ) : Observable<number> => {
				cell.newSession.structure.map = questionIDs;
				return this.courseTesterSessionService.create( cell.newSession )
			} )
		)
	}

	private getAllChildQuestionIDs ( parentQuestionIDs : number[] ) : Observable<number[]> {
		const conditions : OvicConditionParam[] = [];
		const queryParams : IctuQueryParams     = {
			include    : parentQuestionIDs.join( ',' ) ,
			include_by : 'group_id' ,
			limit      : -1 ,
			paged      : 1 ,
			select     : 'id,group_id'
		}
		return forkJoin<{
			parentQuestionIDs : Observable<number[]>,
			childQuestionIDs : Observable<number[]>,
		}>( {
			parentQuestionIDs : of( parentQuestionIDs ) ,
			childQuestionIDs  : this.courseQuestionsService.query<CourseQuestions>( conditions , queryParams ).pipe(
				map( ( response : CourseQuestions[] ) : number[] => response.map( ( _question : CourseQuestions ) : number => _question.id ) )
			)
		} ).pipe(
			map( ( { parentQuestionIDs , childQuestionIDs } : { parentQuestionIDs : number[], childQuestionIDs : number[] } ) : number[] => {
				return [ ... new Set( [ ... parentQuestionIDs , ... childQuestionIDs ] ) ];
			} )
		)
	}
}
