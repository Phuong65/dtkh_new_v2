import { Pipe , PipeTransform } from '@angular/core';
import { CourseTesterResultExtend } from '@modules/kiem-thu-ngan-hang-cau-hoi/kiem-thu-ngan-hang-cau-hoi.component';

@Pipe( {
	name       : 'ictuQuestionDirection' ,
	standalone : true
} )
export class IctuQuestionDirectionPipe implements PipeTransform {
	transform( question : CourseTesterResultExtend , prefix : string = 'Question' , excepts : string[] = [ 'inputbox' ] ) : string {
		const questionName : string = question.courseQuestion.question_number ? `<b class="ictu-question-number">${ prefix } ${ question.courseQuestion.question_number } : </b>` : '';
		const direction : string    = excepts && excepts.length ? excepts.includes( question.courseQuestion.question_type ) ? '' : question.courseQuestion.question_direction : question.courseQuestion.question_direction;
		return questionName + direction;
	}
}
