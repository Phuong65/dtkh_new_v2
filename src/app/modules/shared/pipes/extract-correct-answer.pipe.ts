import { Pipe , PipeTransform } from '@angular/core';

@Pipe( {
	name       : 'extractCorrectAnswer' ,
	standalone : true
} )
export class ExtractCorrectAnswerPipe implements PipeTransform {

	transform( correctAnswer : string ) : string {
		return correctAnswer.split( '|' ).map( t => t ? t.trim() : '').filter(Boolean).join(';')
	}
}
