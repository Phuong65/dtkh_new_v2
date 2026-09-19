import { Pipe , PipeTransform } from '@angular/core';

@Pipe( {
	name       : 'isAnswerCorrect' ,
	standalone : true
} )
export class IsAnswerCorrectPipe implements PipeTransform {

	transform( answer : string , correctAnswer : string ) : boolean {
		return answer && correctAnswer ? correctAnswer.split( '|' ).reduce( ( reducer : boolean , t : string ) : boolean => ( t && t.trim() === answer.trim() ) ? true : reducer , false ) : false;
	}
}
