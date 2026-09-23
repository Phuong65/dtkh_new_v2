import { Component , OnInit , Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OvicButton } from '@core/models/buttons';
import { AppSafeHtmlPipe } from '@core/pipes/app-safe-html.pipe';
import { TranslateModule } from '@ngx-translate/core';

@Component( {
	standalone  : true ,
	selector    : 'app-popup' ,
	templateUrl : './popup.component.html' ,
	styleUrls   : [ './popup.component.css' ] ,
	imports     : [ AppSafeHtmlPipe , TranslateModule ]
} )
export class PopupComponent implements OnInit {

	@Input() textHead = 'Thông báo';

	@Input() htmlBody = '';

	@Input() button : OvicButton = {
		label : 'Đóng' ,
		name  : 'close' ,
		class : 'btn-primary' ,
		icon  : ''
	};

	constructor( private activeModal : NgbActiveModal ) { }

	ngOnInit() : void {

	}

	confirmAction( btn : OvicButton ) {
		this.activeModal.close( btn );
	}
}
