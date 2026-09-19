import { Pipe , PipeTransform } from '@angular/core';
import { AnswerOptionClassTestQuestion } from '@modules/kiem-thu-ngan-hang-cau-hoi/models/class';

@Pipe( {
	name       : 'ictuQuestionValue' ,
	standalone : true
} )
export class IctuQuestionValuePipe implements PipeTransform {

	transform( optionId : string , allAnswerOption : AnswerOptionClassTestQuestion[] ) : string {
		return optionId && allAnswerOption ? allAnswerOption.find( ( t : AnswerOptionClassTestQuestion ) : boolean => t.id === optionId )?.value : '';
	}

}
