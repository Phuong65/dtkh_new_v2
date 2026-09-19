import { Pipe , PipeTransform } from '@angular/core';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { Answers , BaseQuestion } from "@shared/models/question";

@Pipe( {
	name       : 'orderAnswerOptionsByCorrectAnswer' ,
	standalone : true
} )
export class OrderAnswerOptionsByCorrectAnswerPipe implements PipeTransform {

	transform ( question : BaseQuestion | CourseQuestions , separator : string | RegExp = ',' ) : Answers[] {
		if ( ! question ) {
			return [];
		}
		let results : Answers[] = question.answer_option;
		const ids : string[]    = question.answer_correct ? question.answer_correct.replace( /\|/gmi , '' ).split( separator ) : [];
		if ( ids.length ) {
			results = ids.reduce( ( reducer : Answers[] , id : string ) : Answers[] => {
				reducer.push( question.answer_option.find( ( ans : Answers ) : boolean => id === ans.id ) );
				return reducer;
			} , [] );
		}

		return results
	}

}
