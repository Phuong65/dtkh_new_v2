import { AfterViewInit, Component, ElementRef, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BUTTON_CLOSED, OvicButton } from '@core/models/buttons';
import { AppSafeHtmlPipe } from '@core/pipes/app-safe-html.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component( {
	standalone  : true ,
	selector    : 'app-confirm' ,
	templateUrl : './confirm.component.html' ,
	styleUrls   : [ './confirm.component.css' ] ,
	imports     : [ AppSafeHtmlPipe , TranslateModule , ButtonModule , RippleModule ]
} )
export class ConfirmComponent implements OnInit, AfterViewInit {

	@Input() head = 'Xác nhận hành động';

	@Input() body = 'Vui lòng xác nhận hành động';

	@Input() buttons : OvicButton[] = [ BUTTON_CLOSED ];

	constructor(
		private ngbActiveModal: NgbActiveModal,
		private elementRef: ElementRef<HTMLElement>
	) {}

	ngOnInit(): void {
	}

	ngAfterViewInit(): void {
		setTimeout(() => this.elementRef.nativeElement
			.querySelector<HTMLElement>('[data-button-name="stay"]')?.focus());
	}

	confirmAction( button: OvicButton ) {
		this.ngbActiveModal.close( button );
	}

	close() {
		this.ngbActiveModal.close( BUTTON_CLOSED );
	}
}
