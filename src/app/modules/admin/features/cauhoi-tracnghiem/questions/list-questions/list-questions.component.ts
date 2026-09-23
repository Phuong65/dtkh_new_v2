import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { CourseQuestionCommentService } from '@modules/shared/services/course-question-comment.service';
import { Component , EventEmitter , Input , OnChanges , OnInit , Output , SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateQuestionInfo , TestFormat } from '@modules/admin/features/cauhoi-tracnghiem/questions/create-question/create-question.component';
import { cdrId2Label , cdrId2Name , CdrName , CourseQuestionHierarchy } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';
import { debounceTime , forkJoin , Observable , of , Subject , switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RippleModule } from 'primeng/ripple';
import { Question } from '@shared/models/question';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationService } from '@core/services/notification.service';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { RadioButtonModule } from 'primeng/radiobutton';
import { IsAnswerCorrectPipe } from '@modules/admin/features/cauhoi-tracnghiem/questions/list-questions/is-answer-correct.pipe';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AnswerLabelPipe } from '@modules/admin/features/cauhoi-tracnghiem/questions/list-questions/answer-label.pipe';
import { SharedModule } from '@shared/shared.module';
import { AuthService } from '@core/services/auth.service';
import { CourseQuestions } from '@shared/models/course-questions';
import { NhanxetQuestionComponent } from '../nhanxet-question/nhanxet-question.component';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { MatChipsModule } from '@angular/material/chips';
import { ChipModule } from 'primeng/chip';
import { ExtractCorrectAnswerPipe } from '@modules/shared/pipes/extract-correct-answer.pipe';
import { QuestionPrefixPipe } from '@modules/shared/pipes/question-prefix.pipe';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { SafeHtmlSinglePipe } from '@modules/shared/pipes/safe-html-single.pipe';
import { QuestionTypesModule } from '../../question-types/question-types.module';
import { Router } from '@angular/router';
import { CourseQuestionReport , CourseQuestionReportService } from "@shared/services/course-question-report.service";
import { map } from "rxjs/operators";
import { OrderAnswerOptionsByCorrectAnswerPipe } from "@modules/admin/features/cauhoi-tracnghiem/questions/list-questions/pipes/order-answer-options-by-correct-answer.pipe";
import { OrderChildQuestionPipe } from "@modules/admin/features/cauhoi-tracnghiem/questions/list-questions/pipes/order-child-question.pipe";
import { KatexImgDirective } from "@modules/shared/directives/katex-img.directive";

export interface ReportsListQuestion {
	header : string;
	stats : {
		title : string;
		order : number;
		checkedCount : number;
		total : number;
	}[];
	others : {
		value : string;
		userId : number;
	}[];
}


@Component( {
	selector    : 'app-list-questions' ,
	standalone  : true ,
    imports: [
    NhanxetQuestionComponent,
    CommonModule,
    ButtonModule,
    InputTextModule,
    RippleModule,
    CheckboxModule,
    FormsModule,
    TooltipModule,
    RadioButtonModule,
    IsAnswerCorrectPipe,
    InputTextareaModule,
    AnswerLabelPipe,
    IctuMediaLinkPipe,
    SharedModule,
    QuestionPrefixPipe,
    ExtractCorrectAnswerPipe,
    ChipModule,
    MatChipsModule,
    SafeHtmlSinglePipe,
    LoadMediaOnTextDirective,
    QuestionTypesModule,
    OrderAnswerOptionsByCorrectAnswerPipe,
    OrderChildQuestionPipe,
    KatexImgDirective
] ,
	templateUrl : './list-questions.component.html' ,
	styleUrls   : [ './list-questions.component.css' ]

} )


export class ListQuestionsComponent implements OnInit , OnChanges {

	@Input() data : CreateQuestionInfo;

	@Input() set mode ( cdrName : CdrName | 'total' ) {
		this.cdrName = cdrName;
		this.onLoadInit.next( '' );
	}

	@Input() question_status : number;

	@Input() searchInput : string;

	@Input() testFormat : TestFormat = 'monkhac';

	@Output() openEdit : EventEmitter<CourseQuestionHierarchy | CourseQuestions> = new EventEmitter<CourseQuestionHierarchy | CourseQuestions>();

	cdrName : CdrName | 'total';

	onLoadInit : Subject<any> = new Subject<any>();

	courseQuestions : CourseQuestionHierarchy[];

	token : string = this.auth.accessToken;

	courseSelected : ElnKhoaHoc;

	search_question : string;

	canAdd : boolean = true;

	canDelete : boolean = true;

	canUpdate : boolean = true;

	constructor (
		private auth : AuthService ,
		private notificationService : NotificationService ,
		private courseQuestionsService : CourseQuestionsService ,
		private courseQuestionCommentService : CourseQuestionCommentService ,
		private elnKhoaHocService : ElnKhoaHocService ,
		private router : Router ,
		private courseQuestionReportService : CourseQuestionReportService
	) {

		const url = this.router.url.substring( 7 ).split( '?' )[ 0 ];

		this.canAdd = this.auth.userCanAdd( url );

		this.canDelete = this.auth.userCanDelete( url );

		this.canUpdate = this.auth.userCanEdit( url );

		this.onLoadInit.asObservable().pipe( debounceTime( 500 ) ).subscribe( () => this.loadData() );

	}

	ngOnChanges ( changes : SimpleChanges ) : void {
		if ( changes[ 'question_status' ] ) {
			this.search_question = this.question_status || this.question_status === 0 ? this.question_status.toString() : null;
		}

		if ( changes[ 'searchInput' ] ) {
			this.search_question = this.searchInput ? "#".concat( this.searchInput.toString() ) : null;
		}
	}

	ngOnInit () : void {
		this.onLoadInit.next( '' );
	}

	loadData () : void {
		if ( this.cdrName ) {
			if ( this.cdrName === 'total' ) {
				this.courseQuestions = [
					... this.data.cdr.group.know.questions ,
					... this.data.cdr.group.understand.questions ,
					... this.data.cdr.group.apply.questions ,
					... this.data.cdr.group.analysis.questions ,
					... this.data.cdr.group.evaluate.questions ,
					... this.data.cdr.group.invent.questions
				];
			}
			else {
				this.courseQuestions = this.data.cdr.group[ this.cdrName as CdrName ].questions;
			}

			this.loadQuestionComment();
		}
	}

	loadQuestionComment () {
		const question_id = [];
		this.courseQuestions.forEach( f => {
			question_id.push( f.id );
			f[ 'id_code' ] = "#".concat( f.id.toString() );
		} )

		if ( question_id.length && this.courseQuestions && this.courseQuestions.length && this.courseQuestions[ 0 ] && this.courseQuestions[ 0 ].course_id ) {
			const condition_comment : ConditionOption = {
				condition : [
					{ conditionName : 'parent_id' , condition : OvicQueryCondition.equal , value : '0' , orWhere : 'and' }
				] ,

				set  : [
					{ label : 'limit' , value : '-1' } ,
					{ label : 'include' , value : question_id.toString() } ,
					{ label : 'include_by' , value : 'course_question_id' }
				] ,
				page : null
			}

			const condition_reply_comment : ConditionOption   = {
				condition : [
					{ conditionName : 'parent_id' , condition : OvicQueryCondition.notEqual , value : '0' , orWhere : 'and' }
				] ,
				set       : [
					{ label : 'limit' , value : '-1' } ,
					{ label : 'select' , value : 'id, parent_id' } ,
					{ label : 'include' , value : question_id.toString() } ,
					{ label : 'include_by' , value : 'course_question_id' }
				] ,
				page      : null
			}
			const condition_question_report : ConditionOption = {
				condition : [
					{
						conditionName : 'question_id' ,
						condition     : OvicQueryCondition.equal ,
						value         : question_id.toString() ,
						orWhere       : 'in'
					}
				] ,
				set       : [
					{ label : 'limit' , value : '-1' }
					// { label: 'select', value: 'id, parent_id' },

				] ,
				page      : null
			}

			this.notificationService.isProcessing( true );


			forkJoin( [
				this.courseQuestionCommentService.getCourseQuestionCommentByPageNew( condition_comment ) ,
				this.courseQuestionCommentService.getCourseQuestionCommentByPageNew( condition_reply_comment ) ,
				this.elnKhoaHocService.getElnKhoaHocByCol( 'id' , this.courseQuestions[ 0 ].course_id.toString() ) ,
				this.courseQuestionReportService.getDataByPageNew( condition_question_report ).pipe( map( m => m.data ) )
			] ).subscribe( {
				next  : ( [ _comment , _comment_child , _course , _courseQuestionReport ] ) => {
					this.courseSelected = _course[ 0 ];
					this.courseQuestions.forEach( f => {
						const comments       = _comment.data.filter( m => m.course_question_id === f.id );
						const object_comment = {};
						comments.forEach( t => {
							const count_reply  = _comment_child.data.filter( m => m.parent_id === t.id ).length;
							t[ 'count_reply' ] = count_reply
							if ( ! object_comment[ t.user_id ] ) {
								object_comment[ t.user_id ] = [];
								object_comment[ t.user_id ].push( t );
							}
							else {
								object_comment[ t.user_id ].push( t )
							}
						} )

						f[ 'comments' ] = [];

						Object.keys( object_comment ).forEach( o => {
							f[ 'comments' ].push( { user_id : o , children : object_comment[ o ] } )
						} )
						f[ '_reportQuestions' ] = this.mapListReduceQuestionReport( _courseQuestionReport.filter( rp => rp.question_id == f.id ) )
					} )
					this.notificationService.isProcessing( false );
				} ,
				error : () => {
					this.notificationService.isProcessing( false );
				}
			} )
		}
	}

	showCdrLabel ( q : CourseQuestionHierarchy | Question | CourseQuestions ) : string {
		return q.cdr ? cdrId2Label( q.cdr ) : '';
	}

	btnEdit ( q : CourseQuestionHierarchy | CourseQuestions ) : void {
		this.openEdit.emit( q );
	}

	async btnDelete ( q : CourseQuestionHierarchy | CourseQuestions ) : Promise<void> {
		const confirm : boolean = await this.notificationService.confirmDelete();
		if ( confirm ) {
			const deleteChildrenFirst : Observable<any> = q[ 'children' ].length ? this.courseQuestionsService.deleteCourseQuestionsBy( 'group_id' , q.id.toString( 10 ) ) : of( [] );
			this.notificationService.startLoading();
			deleteChildrenFirst.pipe( switchMap( () : Observable<number> => this.courseQuestionsService.deleteCourseQuestions( [ q.id ] ) ) ).subscribe( {
				next  : () : void => {
					this.data.cdr.group[ cdrId2Name( q.cdr ) ].questions        = this.data.cdr.group[ cdrId2Name( q.cdr ) ].questions.filter( ( p : CourseQuestionHierarchy ) : boolean => p.id !== q.id );
					this.data.cdr.group[ cdrId2Name( q.cdr ) ].reachRequirement = this.data.cdr.group[ cdrId2Name( q.cdr ) ].questions.length === this.data.cdr.group[ cdrId2Name( q.cdr ) ].require;
					this.loadData();
					this.notificationService.stopLoading();
				} ,
				error : () : void => {
					this.notificationService.stopLoading();
					this.notificationService.toastError( 'Mất kết nối với máy chủ' );
				}
			} );
		}
	}

	private mapListReduceQuestionReport ( data : CourseQuestionReport[] ) : ReportsListQuestion[] {
		if ( data.length == 0 ) {
			return [];
		}

		const resultMap = new Map<string , Map<number , { title : string; checkedCount : number; total : number }>>();
		const othersMap = new Map<string , { value : string; userId : number }[]>();

		for ( const userEntry of data ) {
			const userId = userEntry.user_id;

			for ( const section of userEntry.content ) {
				const header = section.header;
				if ( ! resultMap.has( header ) ) resultMap.set( header , new Map() );
				if ( ! othersMap.has( header ) ) othersMap.set( header , [] );

				for ( const item of section.items ) {
					const isOrder4   = item.title.trim().toLowerCase() === 'khác';
					const hasContent = item.value?.trim() || item.check;

					// Nếu order = 4 → đưa vào others nếu có nội dung hoặc được chọn
					if ( isOrder4 && hasContent ) {
						othersMap.get( header )!.push( {
							value : item.value?.trim() || "(được chọn)" ,
							userId
						} );
						continue; // Không đưa vào stats
					}

					// Nếu KHÔNG phải order = 4, và có order thì xử lý stats
					if ( typeof item.order === "number" && item.title.trim().toLowerCase() !== 'khác' ) {
						const itemMap = resultMap.get( header )!;
						if ( ! itemMap.has( item.order ) ) {
							itemMap.set( item.order , {
								title        : item.title ,
								checkedCount : 0 ,
								total        : 0
							} );
						}

						const stat = itemMap.get( item.order )!;
						stat.total += 1;
						if ( item.check ) stat.checkedCount += 1;
					}
				}
			}
		}

		// Convert Map to array
		const result : ReportsListQuestion[] = [];
		for ( const [ header , itemsMap ] of resultMap.entries() ) {
			const stats = Array.from( itemsMap.entries() ).map( ( [ order , stat ] ) => ( {
				order ,
				title        : stat.title ,
				checkedCount : stat.checkedCount ,
				total        : stat.total
			} ) ).sort( ( a , b ) => a.order - b.order );

			result.push( {
				header ,
				stats ,
				others : othersMap.get( header ) || []
			} );
		}

		return result;
	}


}
