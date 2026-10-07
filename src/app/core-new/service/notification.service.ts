import { inject , Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject , distinctUntilChanged , map , Observable , Subject , take } from 'rxjs';
import { MessageService } from 'primeng/api';
import { NotificationService as CoreNotificationService } from '@core/services/notification.service';
import { ButtonBase } from '@core-new/models/button';
import { ConfirmComponent , ConfirmDialogData } from '@core-new/components/confirm/confirm.component';
import { ConfirmDeleteComponent } from '@core-new/components/confirm-delete/confirm-delete.component';
import { ConfirmDelete2Component , ConfirmDelete2Data } from '@core-new/components/confirm-delete-2/confirm-delete-2.component';
import { IctuDeletingAnimationComponent } from '@core-new/components/ictu-deleting-animation/ictu-deleting-animation.component';
import { IctuProgressComponent } from '@core-new/components/ictu-progress/ictu-progress.component';

export interface ProgressAnimationConfig {
	disabled : boolean;
	heading : string;
	percent : number;
}

export type ProgressAnimationEvent = Partial<ProgressAnimationConfig>;
export type ProgressAnimationControl = Observable<ProgressAnimationEvent>;

@Injectable( {
	providedIn : 'root'
} )
export class NotificationService {
	private readonly messageService = inject( MessageService );
	private readonly dialog = inject( MatDialog );

	// AppComponent already subscribes to this loading stream; do not create a second one.
	private readonly coreNotification = inject( CoreNotificationService );

	private readonly systemAsynchronous$ = new Subject<string>();
	private readonly remeasureDeviceScreen$ = new Subject<string>();
	private readonly devtoolOpened$ = new BehaviorSubject<boolean>( false );
	private readonly signOut$ = new Subject<string>();
	private readonly sessionExpired$ = new Subject<string>();

	private readonly dataConfirmSignOut : ConfirmDialogData = {
		heading : 'Bạn có chắc chắn muốn đăng xuất không?' ,
		buttons : [
			{ name : 'yes' , label : 'Có' , icon : 'ti ti-check' , class : 'p-button-primary p-button-rounded' } ,
			{ name : 'no' , label : 'Không' , icon : 'ti ti-x' , class : 'p-button-secondary p-button-rounded' }
		]
	};

	get matDialog() : MatDialog {
		return this.dialog;
	}

	get onAppLoading() : Observable<boolean> {
		return this.coreNotification.onAppLoading;
	}

	get onSessionExpired() : Observable<string> {
		return this.sessionExpired$.asObservable();
	}

	get onSignOut() : Observable<string> {
		return this.signOut$.asObservable();
	}

	get onRemeasureDeviceScreen() : Observable<string> {
		return this.remeasureDeviceScreen$.asObservable();
	}

	get onDevtoolOpened() : Observable<boolean> {
		return this.devtoolOpened$.asObservable().pipe( distinctUntilChanged() );
	}

	get isSystemAsynchronousInTime() : Observable<string> {
		return this.systemAsynchronous$.asObservable();
	}

	toastSuccess( body : string , heading : string = 'Thông báo' ) : void {
		this.messageService.add( { severity : 'success' , summary : heading || 'Thông báo' , detail : body , closable : true } );
	}

	toastWarning( body : string , heading : string = 'Cảnh báo' ) : void {
		this.messageService.add( { severity : 'warn' , summary : heading || 'Cảnh báo' , detail : body , closable : true } );
	}

	toastInfo( body : string , heading : string = 'Thông báo' ) : void {
		this.messageService.add( { severity : 'info' , summary : heading || 'Thông báo' , detail : body , closable : true } );
	}

	toastError( body : string , heading : string = 'Cảnh báo' ) : void {
		this.messageService.add( { severity : 'error' , summary : heading || 'Cảnh báo' , detail : body , closable : true } );
	}

	clearToast() : void {
		this.messageService.clear();
	}

	confirm( data : ConfirmDialogData ) : Observable<ButtonBase | undefined> {
		return this.dialog.open<ConfirmComponent , ConfirmDialogData , ButtonBase>( ConfirmComponent , {
			data ,
			disableClose : true ,
			panelClass : 'ictu-app-notification'
		} ).afterClosed();
	}

	confirmDelete( amount : number ) : Observable<boolean> {
		return this.dialog.open<ConfirmDeleteComponent , { amount : number } , boolean>( ConfirmDeleteComponent , {
			data : { amount } ,
			disableClose : true ,
			panelClass : [ 'ictu-app-notification' , 'ictu-app-confirm-delete' ]
		} ).afterClosed().pipe( map( result => result === true ) );
	}

	confirmDelete2( config? : Partial<ConfirmDelete2Data> ) : Observable<boolean> {
		return this.dialog.open<ConfirmDelete2Component , ConfirmDelete2Data , boolean>( ConfirmDelete2Component , {
			data : config ,
			disableClose : true ,
			panelClass : [ 'ictu-app-notification' , 'ictu-app-confirm-delete' ]
		} ).afterClosed().pipe( map( result => result === true ) );
	}

	startProgressAnimation( eventControl : ProgressAnimationControl , heading : string ) : Observable<void> {
		return this.dialog.open<IctuProgressComponent , { eventControl : ProgressAnimationControl; heading : string } , void>( IctuProgressComponent , {
			data : { eventControl , heading } ,
			disableClose : true ,
			panelClass : [ 'ictu-app-notification' , 'ictu-app-deleting-animation' ]
		} ).afterClosed();
	}

	startDeleting( observer : Observable<number> ) : Observable<boolean> {
		return this.progressBarWithPercent( observer , 'Đang xóa dữ liệu...' );
	}

	progressBarWithPercent( observer : Observable<number> , heading : string ) : Observable<boolean> {
		return this.dialog.open<IctuDeletingAnimationComponent , { observer : Observable<number>; heading : string } , boolean>( IctuDeletingAnimationComponent , {
			data : { observer , heading } ,
			disableClose : true ,
			panelClass : [ 'ictu-app-notification' , 'ictu-app-deleting-animation' ]
		} ).afterClosed().pipe( map( result => result === true ) );
	}

	confirmSignOut() : void {
		this.confirm( this.dataConfirmSignOut ).pipe( take( 1 ) ).subscribe( button => {
			if ( button?.name === 'yes' ) {
				this.signOut$.next( 'logout' );
			}
		} );
	}

	sessionExpired( message? : string ) : void {
		this.sessionExpired$.next( message || '' );
	}

	isProcessing( isLoading = true ) : void {
		this.coreNotification.isProcessing( isLoading );
	}

	startLoading() : void {
		this.isProcessing( true );
	}

	stopLoading() : void {
		this.isProcessing( false );
	}

	remeasureDeviceScreen() : void {
		this.remeasureDeviceScreen$.next( 'remeasureDeviceScreen' );
	}

	noticeDevtoolOpened() : void {
		this.devtoolOpened$.next( true );
	}

	reportSystemAsynchronousInTime() : void {
		this.systemAsynchronous$.next( 'report' );
	}
}
