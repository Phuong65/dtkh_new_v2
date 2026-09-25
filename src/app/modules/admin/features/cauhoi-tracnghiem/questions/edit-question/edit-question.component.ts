import { Component , Input , OnInit } from '@angular/core';

import { CreateQuestionInfo } from '@modules/admin/features/nganhang-cauhoi/questions/create-question/create-question.component';

@Component( {
	selector    : 'app-edit-question' ,
	standalone  : true ,
	imports: [] ,
	templateUrl : './edit-question.component.html' ,
	styleUrls   : [ './edit-question.component.css' ]
} )
export class EditQuestionComponent implements OnInit {
	
	@Input() set data( info : CreateQuestionInfo ) {
		if ( info ) {
			this.info = info;
			console.log( info );
		}
	}

	info : CreateQuestionInfo;

	constructor() { }

	ngOnInit() : void {
	}

}
