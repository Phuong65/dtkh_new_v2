import { Pipe , PipeTransform } from '@angular/core';
import { questionPrefix } from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';

@Pipe( {
	name       : 'questionPrefix' ,
	standalone : true
} )
export class QuestionPrefixPipe implements PipeTransform {

	transform( index : number ) : string {
		return questionPrefix( index );
	}
}
