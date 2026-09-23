import { Component , Input , OnInit } from '@angular/core';
import { Question } from '@shared/models/question';
import { Answers } from '@shared/models/question';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NotificationService } from '@core/services/notification.service';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { arrayShuffle } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';

export interface DragAndDropAnswer {
	question : Question,
	answer : Answers
}

@Component({
	standalone: false,
	selector    : 'drag-and-drop-question' ,
	templateUrl : './drag-and-drop-question.component.html' ,
	styleUrls   : [ './drag-and-drop-question.component.css' ]
} ) 
export class DragAndDropQuestionComponent implements OnInit {

	@Input() set question( question : Question ) {
		this._question = question;
		this.setAnswers();
		const idAnswersOptionUsed : string[] = this.answers.map( i => i.answer.id );
		this.disturbedAnswers                = question.answer_option.reduce( ( reducer : string[] , a : Answers ) : string[] => {
			if ( !idAnswersOptionUsed.includes( a.id ) ) {
				reducer.push( a.value );
			}
			return reducer;
		} , new Array<string>() ).join( ';' );
	}

	@Input() enableQuestionNumber : boolean = false;

	@Input() confirmOnDelete : boolean = false;

	private _question : Question;

	get question() : Question {
		return this._question;
	}

	answers : DragAndDropAnswer[] = [];

	disturbedAnswers : string;

	private observeOnChangesAnswer$ : Subject<DragAndDropAnswer> = new Subject<DragAndDropAnswer>();

	private observeOnChangesDisturbedAnswers$ : Subject<string> = new Subject<string>();

	constructor(
		private notificationService : NotificationService ,
		private courseQuestionsService : CourseQuestionsService
	) { }

	ngOnInit() : void {
		this.observeOnChangesAnswer$.subscribe( ( answerOption : DragAndDropAnswer ) => this._changesAnswers( answerOption ) );
		this.observeOnChangesDisturbedAnswers$.pipe( debounceTime( 1000 ) ).subscribe( () => this._changesDisturbedAnswers() );
	}

	private setAnswers() : void {
		this.answers = this.question.children.reduce( ( reducer : DragAndDropAnswer[] , child : Question ) : DragAndDropAnswer[] => {
			// const _arrCorrectAnswers : string[] = child.answer_correct ? child.answer_correct.split( ';' ).map( ( t : string ) : string => t ? t.replace( '|' , '' ).trim() : '' ).filter( Boolean ) : [];
			let _rawAnswer : string = child.answer_correct ? child.answer_correct.replace( /\|/gmi , '' ).trim() : '';
			let _answer : Answers   = _rawAnswer ? this.question.answer_option.find( a => a.id === _rawAnswer ) : null;
			reducer.push( {
				question : child ,
				answer   : _answer ? _answer : { id : '' , value : '' }
			} );
			return reducer;
		} , new Array<DragAndDropAnswer>() );
	}

	private _changesAnswers( answerOption : DragAndDropAnswer ) : void {
		if ( answerOption.answer ) {
			if ( answerOption.answer.id ) {
				this.updateAnswer( answerOption );
			} else {
				this.addNewAnswer( answerOption );
			}
		} else {
			this.addNewAnswer( answerOption );
		}
	}

	private addNewAnswer( answerOption : DragAndDropAnswer ) : void {
		const maxAnswerId : number           = this.question.answer_option.reduce( ( reducer : number , a : Answers ) : number => !Number.isNaN( parseInt( a.id , 10 ) ) ? Math.max( reducer , parseInt( a.id , 10 ) ) : reducer , 0 );
		answerOption.answer.id               = ( 1 + maxAnswerId ).toString( 10 );
		answerOption.question.answer_correct = '|' + answerOption.answer.id + '|';
		this.question.answer_option.push( answerOption.answer );
		this.question.answer_option = arrayShuffle( this.question.answer_option );
	}

	private updateAnswer( answerOption : DragAndDropAnswer ) : void {
		if ( answerOption.answer.value ) {
			const o : Answers = this.question.answer_option.find( ( a : Answers ) : boolean => a.id === answerOption.answer.id );
			if ( o ) {
				o.value = answerOption.answer.value;
			}
			answerOption.question.answer_correct = '|' + answerOption.answer.id + '|';
		} else {
			answerOption.question.answer_correct = '';
			this.question.answer_option          = this.question.answer_option.filter( ( q : Answers ) : boolean => q.id !== answerOption.answer.id );
			answerOption.answer.id               = '';
			this.fillAnswerOptions();
		}
	}

	private fillAnswerOptions() {
		const allAnswers : Answers[] = this.answers.reduce( ( reducer : Answers[] , child : DragAndDropAnswer ) : Answers[] => {
			if ( child.answer.value ) {
				reducer.push( child.answer );
			}
			return reducer;
		} , new Array<Answers>() );
		if ( this.disturbedAnswers ) {
			const maxAnswerId : number         = this.question.answer_option.reduce( ( reducer : number , a : Answers ) : number => !Number.isNaN( parseInt( a.id , 10 ) ) ? Math.max( reducer , parseInt( a.id , 10 ) ) : reducer , 0 );
			const disturbedAnswers : Answers[] = this.disturbedAnswers.split( ';' ).map( ( t : string , index : number ) : Answers => t ? ( {
				id    : ( 1 + index + maxAnswerId ).toString( 10 ) ,
				value : t.trim()
			} ) : null ).filter( Boolean );
			allAnswers.push( ... disturbedAnswers );
		}
		this.question.answer_option = arrayShuffle( allAnswers );
	}

	private _changesDisturbedAnswers() : void {
		this.fillAnswerOptions();
	}

	onChangesAnswers( answerOption : DragAndDropAnswer ) : void {
		this.observeOnChangesAnswer$.next( answerOption );
	}

	onChangesDisturbedAnswers() : void {
		this.observeOnChangesDisturbedAnswers$.next( 'changed' );
	}

	addMoreQuestion() : void {
		const cloneQuestion: Question = Object.assign( JSON.parse( JSON.stringify( this.question ) ), {children: [], question_direction: '', question_number: 0, media: null, answer_option: [], answer_correct: '', group_id: 0} );
		
		if ( cloneQuestion[ 'id' ] ) {
			delete cloneQuestion[ 'id' ];
		}
		
		this.question.children.push( cloneQuestion );
		this.setAnswers();
	}

	async deleteQuestion( index : number ) : Promise<void> {
		if ( this.confirmOnDelete ) {
			try {
				const confirm : boolean = await this.notificationService.confirmDelete();
				if ( confirm ) {
					this._delete( index );
				}
			} catch ( e ) {

			}
		} else {
			this._delete( index );
		}
	}

	private _delete( index : number ) : void {
		if ( this.answers[ index ].question[ 'id' ] ) {
			this.notificationService.startLoading();
			this.courseQuestionsService.deleteCourseQuestions( [ this.answers[ index ].question[ 'id' ] ] ).subscribe( {
				next  : () : void => {
					this._removeQuestionFromLayout( index );
					this.notificationService.stopLoading();
				} ,
				error : () : void => {
					this.notificationService.stopLoading();
					this.notificationService.toastError( 'Mất kết nối với máy chủ' );
				}
			} );
		} else {
			this._removeQuestionFromLayout( index );
		}
	}

	private _removeQuestionFromLayout( index : number ) : void {
		const answerOption : DragAndDropAnswer = this.answers[ index ];
		this.question.children                 = this.question.children.filter( ( _ , i ) : boolean => i !== index );
		this.answers                           = this.answers.filter( ( _ , i ) : boolean => i !== index );
		if ( answerOption.answer.id ) {
			this.question.answer_option = this.question.answer_option.filter( ( q : Answers ) : boolean => q.id !== answerOption.answer.id );
		}
	}
}
