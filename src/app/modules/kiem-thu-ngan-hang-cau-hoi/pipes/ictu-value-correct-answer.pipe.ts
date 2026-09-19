import { Pipe , PipeTransform } from '@angular/core';
import { DomSanitizer , SafeHtml } from '@angular/platform-browser';

@Pipe( {
	name       : 'ictuValueCorrectAnswer' ,
	standalone : true
} )
export class IctuValueCorrectAnswerPipe implements PipeTransform {
	constructor( private domSanitizer : DomSanitizer ) {}

	transform(
		question : { answer_option : { id : string, value : string }[], answer_correct : string, question_type : string | 'grouping' | 'drag_drop' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'inputbox' | 'reorder_words' | 'selectbox', } ,
		parentQuestion : { answer_option : { id : string, value : string }[], answer_correct : string, question_type : string | 'grouping' | 'drag_drop' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'inputbox' | 'reorder_words' | 'selectbox', }
	) : SafeHtml {
		if ( !question ) {
			return '';
		}

		let results : string = question.answer_correct;

		switch ( question.question_type ) {
			case 'group-input' :
			case 'inputbox':
			case 'reorder_words':
				results = question.answer_correct;
				break;
			case 'radio':
			case 'group-radio':
				const arrCorrectAnswers : string[] = question.answer_correct ? question.answer_correct.split( '|' ).map( i => i ? i.trim() : null ).filter( Boolean ) : [];
				results                            = question.answer_option.reduce( ( reducer : string[] , option ) : string[] => {
					if ( arrCorrectAnswers.includes( option.id ) ) {
						reducer.push( option.value );
					}
					return reducer;
				} , new Array<string>() ).join( ';' );
				break;
			case 'grouping':
				break;
			default :
				results = question.answer_correct;
				break;
		}
		return results ? this.domSanitizer.bypassSecurityTrustHtml( results ) : '';
	}
}
