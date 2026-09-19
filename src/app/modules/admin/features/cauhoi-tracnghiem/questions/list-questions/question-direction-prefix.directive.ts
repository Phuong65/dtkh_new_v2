import { Directive } from '@angular/core';

@Directive( {
	selector   : '[appQuestionDirectionPrefix]' ,
	standalone : true
} )
export class QuestionDirectionPrefixDirective {

	constructor() { }

}
