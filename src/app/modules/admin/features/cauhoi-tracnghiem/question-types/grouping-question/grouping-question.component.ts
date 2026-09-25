import { Component , Input , OnInit } from '@angular/core';
import { Answers , GroupingAnswer , Question } from '@shared/models/question';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { arrayShuffle } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';

export const DRAG_DROP_ANSWERS_SEPARATOR : string = ';';

export const DRAG_DROP_ANSWERS_SPLITTER : string = ';';

// export const DRAG_DROP_ANSWERS_SPLITTER : RegExp = /[;,]/g;

@Component({
	standalone: false,
	selector    : 'grouping-question' ,
	templateUrl : './grouping-question.component.html' ,
	styleUrls   : [ './grouping-question.component.css' ]
} )
export class GroupingQuestionComponent implements OnInit {

	@Input() set question ( question : Question ) {
		if ( question.children && Array.isArray( question.children ) && question.children.length ) {
			if ( question.children.length > 2 ) {
				question.children.length = 2;
			}
			else if ( question.children.length < 2 ) {
				question.children.push( {
					question_direction : '' ,
					question_type      : 'grouping' ,
					answer_option      : [] ,
					answer_correct     : '' ,
					group_id           : 0 ,
					media              : null ,
					part               : 0 ,
					cdr                : 0 ,
					question_number    : 0 ,
					code               : '' ,
					config             : {
						cols           : 1 ,
						invertedAnswer : false
					} ,
					children           : []
				} );
			}

		}
		else {
			question.children = [
				{
					question_direction : '' ,
					question_type      : 'grouping' ,
					answer_option      : [] ,
					answer_correct     : '' ,
					group_id           : 0 ,
					media              : null ,
					part               : 0 ,
					cdr                : question.cdr ,
					question_number    : 0 ,
					code               : '' ,
					config             : {
						cols           : 1 ,
						invertedAnswer : false
					} ,
					children           : []
				} ,
				{
					question_direction : '' ,
					question_type      : 'grouping' ,
					answer_option      : [] ,
					answer_correct     : '' ,
					group_id           : 0 ,
					media              : null ,
					part               : 0 ,
					cdr                : question.cdr ,
					question_number    : 0 ,
					code               : '' ,
					config             : {
						cols           : 1 ,
						invertedAnswer : false
					} ,
					children           : []
				}
			];
		}
		this._question = question;

		const selected_one : string[] = question.children[ 0 ].answer_correct ? question.children[ 0 ].answer_correct.replace( /\|/g , '' ).split( DRAG_DROP_ANSWERS_SPLITTER ).map( ( t : string ) : string => t ? t.trim() : '' ).filter( Boolean ) : [];
		const selected_two : string[] = question.children[ 1 ].answer_correct ? question.children[ 1 ].answer_correct.replace( /\|/g , '' ).split( DRAG_DROP_ANSWERS_SPLITTER ).map( ( t : string ) : string => t ? t.trim() : '' ).filter( Boolean ) : [];
		question.answer_option.forEach( ( a : Answers ) : void => {
			if ( selected_one.includes( a.id ) ) {
				this.answerFirst.collect.push( a );
			}
			else if ( selected_two.includes( a.id ) ) {
				this.answerSecond.collect.push( a );
			}
			else {
				this.disturbedAnswers.collect.push( a );
			}
		} );

		this.answerFirst.text      = this.answerFirst.collect.map( a => a.value ).join( DRAG_DROP_ANSWERS_SEPARATOR );
		this.answerSecond.text     = this.answerSecond.collect.map( a => a.value ).join( DRAG_DROP_ANSWERS_SEPARATOR );
		this.disturbedAnswers.text = this.disturbedAnswers.collect.map( a => a.value ).join( DRAG_DROP_ANSWERS_SEPARATOR );
	}

	private _question : Question;

	get question () : Question {
		return this._question;
	}

	answerFirst : GroupingAnswer = {
		text    : '' ,
		collect : []
	};

	answerSecond : GroupingAnswer = {
		text    : '' ,
		collect : []
	};

	disturbedAnswers : GroupingAnswer = {
		text    : '' ,
		collect : []
	};

	private observeUpdateAnswerOptions$ : Subject<string> = new Subject<string>();

	ngOnInit () : void {
		this.observeUpdateAnswerOptions$.pipe( debounceTime( 1000 ) ).subscribe( () => this._generateAnswerOptions() );
	}

	private _generateAnswerOptions () : void {
		this.question.answer_option                = arrayShuffle( [ this.answerFirst , this.answerSecond , this.disturbedAnswers ].reduce( ( reducer : Answers[] , group : GroupingAnswer ) : Answers[] => {
			if ( group.text ) {
				group.collect = group.text.split( DRAG_DROP_ANSWERS_SPLITTER ).map( ( t : string ) : string => t ? t.trim() : '' ).filter( Boolean ).map( ( value : string ) : Answers => {
					return { id : '' , value };
				} );
				reducer.push( ... group.collect );
			}
			else {
				group.collect = [];
			}
			return reducer;
		} , new Array<Answers>() ) ).map( ( answer : Answers , index : number ) : Answers => {
			answer.id = ( 1 + index ).toString( 10 );
			return answer;
		} );
		this.question.children[ 0 ].answer_correct = '|' + this.answerFirst.collect.sort( ( a : Answers , b : Answers ) : number => parseInt( a.id ) - parseInt( b.id ) ).map( ( o : Answers ) : string => o.id ).join( DRAG_DROP_ANSWERS_SEPARATOR ) + '|';
		this.question.children[ 1 ].answer_correct = '|' + this.answerSecond.collect.sort( ( a : Answers , b : Answers ) : number => parseInt( a.id ) - parseInt( b.id ) ).map( ( o : Answers ) : string => o.id ).join( DRAG_DROP_ANSWERS_SEPARATOR ) + '|';
	}

	changesAnswerOptions () : void {
		this.observeUpdateAnswerOptions$.next( 'changed' );
	}
}
