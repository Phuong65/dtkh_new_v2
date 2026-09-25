import { Component , Input , OnInit } from '@angular/core';
import { Question } from '@shared/models/question';
import { formatAnswerCorrect , SelectOptions } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';
import { NotificationService } from '@core/services/notification.service';
import { CourseQuestionsService } from '@shared/services/course-questions.service';

interface GroupInputQuestion {
	question : Question,
	answer : string
}

@Component({
	standalone: false,
	selector    : 'group-input-question' ,
	templateUrl : './group-input-question.component.html' ,
	styleUrls   : [ './group-input-question.component.css' ]
} )
export class GroupInputQuestionComponent implements OnInit {

	@Input() set question( question : Question ) {
		if ( question ) {
			this.childQuestion = this.questionToGroupInputQuestion( question );
			this._question     = question;
		} else {
			this._question     = null;
			this.childQuestion = [];
		}
		this.isPresent = false;
	}

	@Input() set present( question : Question | any ) {
		if ( question ) {
			this.childQuestion = this.questionToGroupInputQuestion( question );
			this._question     = question;
		} else {
			this._question     = null;
			this.childQuestion = [];
		}
		this.isPresent = true;
	}

	@Input() confirmOnDelete : boolean = false;

	isPresent : boolean = false;

	private _question : Question;

	get question() : Question {
		return this._question;
	}

	childQuestion : GroupInputQuestion[];

	colOptions : SelectOptions<number>[] = [
		{ value : 2 , label : 'Hiển thị 2 phương án / dòng' , disable : false } ,
		{ value : 4 , label : 'Hiển thị 4 phương án / dòng' , disable : false }
	];

	loading : boolean = false;

	constructor(
		private notificationService : NotificationService ,
		private courseQuestionsService : CourseQuestionsService
	) { }

	ngOnInit() : void {}

	private questionToGroupInputQuestion( question : Question ) : GroupInputQuestion[] {
		return question.children.reduce( ( reducer : GroupInputQuestion[] , q : Question ) : GroupInputQuestion[] => {
			reducer.push( {
				question : q ,
				answer   : q.answer_correct ? q.answer_correct.split( '|' ).map( ( i : string ) : string => i ? i.trim() : '' ).filter( Boolean ).join( ';' ) : ''
			} );
			return reducer;
		} , new Array<GroupInputQuestion>() );
	}

	async deleteAnswer( index : number ) : Promise<void> {
		if ( this.confirmOnDelete ) {
			try {
				const confirm : boolean = await this.notificationService.confirmDelete();
				if ( confirm ) {
					this.delete( index );
				}
			} catch ( e ) {

			}
		} else {
			this.delete( index );
		}
	}

	private delete( index : number ) : void {
		if ( this.childQuestion[ index ].question[ 'id' ] ) {
			this.loading = true;
			this.courseQuestionsService.deleteCourseQuestions( [ this.childQuestion[ index ].question[ 'id' ] ] ).subscribe( {
				next  : () : void => {
					this.loading           = false;
					this.question.children = this.question.children.filter( c => c[ 'id' ] !== this.childQuestion[ index ].question[ 'id' ] );
					this.childQuestion     = this.questionToGroupInputQuestion( this.question );
				} ,
				error : () : void => {
					this.loading = false;
					this.notificationService.toastError( 'Mất kết nối với máy chủ' );
				}
			} );
		} else {
			this.question.children = this.question.children.filter( ( _ , i ) : boolean => i !== index );
			this.childQuestion     = this.questionToGroupInputQuestion( this.question );
		}
	}

	addMoreAnswerOption() : void {
		if ( this.question ) {
			const cloneQuestion: Question = Object.assign( JSON.parse( JSON.stringify( this.question ) ), {children: [], question_direction: '', question_number: 0, media: null, answer_option: [], answer_correct: '', group_id: 0} );
						
			if ( cloneQuestion[ 'id' ] ) {
				delete cloneQuestion[ 'id' ];
			}
			
			this.question.children.push( cloneQuestion );
			
			this.childQuestion.push( {
				question : cloneQuestion ,
				answer   : ''
			} );
		}
	}

	updateAnswer( q : GroupInputQuestion ) : void {
		const _rawAnswerCorrect : string[] = q.answer.split( ';' ).map( ( t : string ) : string => t ? formatAnswerCorrect( t ).toLowerCase() : '' ).filter( Boolean );
		q.question.answer_correct          = _rawAnswerCorrect.length ? ( '|' + _rawAnswerCorrect.join( '|' ) + '|' ) : '';
	}

}
