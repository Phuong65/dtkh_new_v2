import { Component , Input , OnInit } from '@angular/core';
import { Answers , Question } from "@shared/models/question";
import { CdkDragDrop , moveItemInArray } from "@angular/cdk/drag-drop";
import { shuffleArray } from "@core/services/helper.service";
import { ActivatedRoute } from "@angular/router";

const maxOptionId : ( options : Answers[] ) => number = ( options : Answers[] ) : number => {
	return options.reduce( ( reducer : number , a : Answers ) : number => ! Number.isNaN( parseInt( a.id , 10 ) ) ? Math.max( reducer , parseInt( a.id , 10 ) ) : reducer , 0 );
};

export type QuestionTypeArrangeParagraphsLayout = 'english' | 'normal';

@Component({
	standalone: false,
	selector    : 'question-type-arrange-paragraphs' ,
	templateUrl : './question-type-arrange-paragraphs.component.html' ,
	styleUrls   : [ './question-type-arrange-paragraphs.component.css' ]
} )
export class QuestionTypeArrangeParagraphsComponent implements OnInit {

	@Input() layout : QuestionTypeArrangeParagraphsLayout = 'english';

	@Input() set question ( question : Question ) {
		this._question = question;
		this.fillAnswerOptions();
	}

	private _question : Question;

	get question () : Question {
		return this._question;
	}

	protected answerOptions : Answers[];

	protected devMode : boolean = false;

	protected uniqueCode : number = Date.now();

	constructor (
		private activatedRoute : ActivatedRoute
	) {
	}

	ngOnInit () : void {
		this.devMode = this.activatedRoute.snapshot.queryParamMap.has( 'devMode' ) && this.activatedRoute.snapshot.queryParamMap.get( 'devMode' ) === 'on';
	}

	protected btnAddNewOption () : void {
		let newAnswer : Answers = { id : '1' , value : '' };
		if ( this.answerOptions.length ) {
			newAnswer.id = ( 1 + maxOptionId( this.answerOptions ) ).toString( 10 );
		}
		this.answerOptions.push( newAnswer );
		this.shuffleCorrectAnswerIds();
		this.updateQuestionInfo();
	}

	/** shuffle the identifiers of the correct answers
	 * Shuffle the identifiers of the correct answers without changing the order.
	 * @return  void
	 * */
	private shuffleCorrectAnswerIds () : void {
		const orderedIds : string[] = shuffleArray<string>( this.answerOptions.map( ( ans : Answers ) : string => ans.id ) );
		this.answerOptions          = this.answerOptions.map( ( { value } : Answers , index : number ) : Answers => ( { id : orderedIds[ index ] , value } ) );
	}

	protected btnDeleteAnswer ( answer : Answers ) : void {
		this.answerOptions = this.answerOptions.filter( ( o : Answers ) : boolean => o.id !== answer.id );
		this.updateQuestionInfo();
	}

	protected drop ( event : CdkDragDrop<Answers[]> ) : void {
		moveItemInArray( this.answerOptions , event.previousIndex , event.currentIndex );
		this.updateQuestionInfo();
	}

	private updateQuestionInfo () : void {
		this.question.answer_correct = '|' + this.answerOptions.map( ( anw : Answers ) : string => anw.id ).join( ',' ) + '|';
		this.question.answer_option  = shuffleArray<Answers>( this.answerOptions );
	}

	private fillAnswerOptions () : void {
		const ids : string[] = this.question?.answer_correct ? this.question.answer_correct.replace( /\|/gmi , '' ).split( ',' ) : []
		if ( ids.length ) {
			this.answerOptions = ids.reduce( ( reducer : Answers[] , id : string ) : Answers[] => {
				reducer.push( this.question.answer_option.find( ( o : Answers ) : boolean => o.id === id ) );
				return reducer;
			} , [] )
		}
		else {
			this.answerOptions = [];
		}
	}

}
