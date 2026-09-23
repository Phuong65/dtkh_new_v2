import { Component , Input , OnInit } from '@angular/core';
import { Answers , Question } from '@shared/models/question';
import { maxAnswerOptionId , SelectOptions } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';
import { OpenFileManagerService } from '@shared/services/open-file-manager.service';
import { OvicFile } from '@core/models/file';

interface RadioAnswerOption {
	answer : Answers,
	type : 'text' | 'media'
}

@Component({
	standalone: false,
	selector    : 'question-type-radio' ,
	templateUrl : './question-type-radio.component.html' ,
	styleUrls   : [ './question-type-radio.component.css' ]
} )
export class QuestionTypeRadioComponent implements OnInit {

	@Input() set question ( question : Question ) {
		if ( question ) {
			this._question = question;
			this.options   = question.answer_option.reduce( ( reducer : RadioAnswerOption[] , answer : Answers ) : RadioAnswerOption[] => {
				reducer.push( {
					answer ,
					type : answer.value && answer.value.trim().toLowerCase().startsWith( '<img' ) ? 'media' : 'text'
				} );
				return reducer;
			} , new Array<RadioAnswerOption>() );
			this.change++;
			this.isPresent = false;
		}
	}

	@Input() multiple : boolean = false; // checkbox if = true;

	@Input() set present ( question : Question | any ) {
		if ( question ) {
			this._question = question;
			this.options   = question.answer_option.reduce( ( reducer : RadioAnswerOption[] , answer : Answers ) : RadioAnswerOption[] => {
				reducer.push( {
					answer ,
					type : answer.value && answer.value.trim().toLowerCase().startsWith( '<img' ) ? 'media' : 'text'
				} );
				return reducer;
			} , new Array<RadioAnswerOption>() );
			this.change++;
			this.isPresent = true;
		}
	}

	isPresent : boolean = false;

	private _question : Question;

	get question () : Question {
		return this._question;
	}

	options : RadioAnswerOption[];

	colOptions : SelectOptions<number>[] = [
		{ value : 1 , label : 'Hiển thị 1 phương án / dòng' , disable : false } ,
		{ value : 2 , label : 'Hiển thị 2 phương án / dòng' , disable : false } ,
		{ value : 3 , label : 'Hiển thị 3 phương án / dòng' , disable : false } ,
		{ value : 4 , label : 'Hiển thị 4 phương án / dòng' , disable : false }
	];

	change : number = 0;

	constructor ( private openFileManagerService : OpenFileManagerService ) {
	}

	ngOnInit () : void {
	}

	addMoreAnswerOption () : void {
		if ( this.question ) {
			if ( ! this.question.answer_option || ! Array.isArray( this.question.answer_option ) ) {
				this.question.answer_option = [];
			}
			const maxId : number   = maxAnswerOptionId( this.question );
			const answer : Answers = { id : ( 1 + maxId ).toString( 10 ) , value : '' };
			this.question.answer_option.push( answer );
			this.options.push( { answer , type : 'text' } );
		}
	}

	isCorrectAnswer ( a : Answers ) : boolean {
		return this.question.answer_correct ? this.question.answer_correct.replace( /\|/gmi , '' ).split( ',' ).filter( Boolean ).map( ( t : string ) : string => t.trim() ).includes( a.id ) : false;
	}

	markCorrectAnswer ( a : Answers ) : void {
		if ( this.multiple ) {
			const arrCorrect : string[]     = this.question.answer_correct.replace( /\|/gmi , '' ).split( ',' ).filter( Boolean ).map( ( t : string ) : string => t.trim() );
			const _newArrCorrect : string[] = arrCorrect.includes( a.id ) ? arrCorrect.filter( ( o : string ) : boolean => o !== a.id ) : [ ... arrCorrect , a.id ];
			if ( _newArrCorrect.length ) {
				this.question.answer_correct = '|' + _newArrCorrect.sort().join( ',' ) + '|';
			}
			else {
				this.question.answer_correct = '';
			}
		}
		else {
			this.question.answer_correct = '|' + a.id + '|';
		}
	}

	deleteAnswer ( option : RadioAnswerOption ) : void {
		this.options                = this.options.filter( ( o : RadioAnswerOption ) : boolean => o.answer.id !== option.answer.id );
		this.question.answer_option = this.question.answer_option.filter( ( q : Answers ) : boolean => q.id !== option.answer.id );
		// const arrCorrect : string[]  = this.question.answer_correct.replace( /\|/gmi , '' ).split( ',' ).filter( Boolean ).map( ( t : string ) : string => t.trim() ).filter( ( a : string ) : boolean => a !== option.answer.id );
		// this.question.answer_correct = arrCorrect.length ? '|' + arrCorrect.join( ';' ) + '|' : '';
		const _newArrCorrect : string[] = this.question.answer_correct.replace( /\|/gmi , '' ).split( ',' ).filter( Boolean ).map( ( t : string ) : string => t.trim() ).filter( ( a : string ) : boolean => a !== option.answer.id );
		this.question.answer_correct    = _newArrCorrect.length ? ( '|' + _newArrCorrect.sort().join( ',' ) + '|' ) : '';
	}

	async uploadFile ( option : RadioAnswerOption ) : Promise<void> {
		try {
			const file : OvicFile[] = await this.openFileManagerService.openFileManagerNew( { isMultipleMode : true , ext : 'jpeg,png,jpg' , tag : 'question' } );
			if ( [ 'serverAws' , 'serverFile' ].includes( file[ 0 ].source ) ) {
				option.answer.value = `<img alt="" data-org="${ file[ 0 ].source }" src="${ file[ 0 ].id.toString( 10 ) }" />`;
				option.type         = 'media';
			}
			this.change++;
		}
		catch ( e ) {

		}
	}
}
