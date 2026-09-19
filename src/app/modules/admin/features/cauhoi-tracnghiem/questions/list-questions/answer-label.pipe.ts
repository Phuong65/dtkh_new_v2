import { Pipe , PipeTransform } from '@angular/core';
import { Answers } from '@shared/models/question';

@Pipe( {
	name       : 'answerLabel' ,
	standalone : true
} )
export class AnswerLabelPipe implements PipeTransform {

	transform( answer : string , answer_option : Answers[] ) : string {
		return answer ? answer.replace( /\|/g , '' ).split( ';' ).map( ( t : string ) : string => {
			const a = t ? answer_option.find( i => i.id === t.trim() ) : null;
			return a ? a.value : '';
		} ).filter( Boolean ).join( '; ' ) : '';
	}

}
