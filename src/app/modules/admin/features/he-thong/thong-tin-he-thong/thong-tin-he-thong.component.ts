import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { RippleModule } from 'primeng/ripple';
import { SharedModule } from '@modules/shared/shared.module';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';


@Component( {
	standalone: true,
	imports: [ CommonModule, FormsModule, ButtonModule, SelectModule, RippleModule, SharedModule ],
	selector    : 'app-thong-tin-he-thong' ,
	templateUrl : './thong-tin-he-thong.component.html' ,
	styleUrls   : [ './thong-tin-he-thong.component.css' ]
} )
export class ThongTinHeThongComponent implements OnInit {
	private themeSettingsService = inject(ThemeSettingsService);
	private authService = inject(AuthService);
	private notificationService = inject(NotificationService);

	tabActive = signal<'settings' | 'information' | 'changelog'>('information');

	// routingAnimationOptions : string[] = [ 'No ' , 'moveFromLeft' , 'moveFromRight' , 'moveFromTop' , 'moveFromBottom' , 'moveFromLeftFade' , 'moveFromRightFade' , 'moveFromTopFade' , 'moveFromBottomFade' , 'fromLeftEasing' , 'fromRightEasing' , 'fromTopEasing' , 'fromBottomEasing' , 'scaleDownFromLeft' , 'scaleDownFromRight' , 'scaleDownFromTop' , 'scaleDownFromBottom' , 'scaleDownScaleDown' , 'rotateGlueFromLeft' , 'rotateGlueFromRight' , 'rotateGlueFromTop' , 'rotateGlueFromBottom' , 'rotateFlipToLeft' , 'rotateFlipToRight' , 'rotateFlipToTop' , 'rotateFlipToBottom' , 'rotateNewsPaper' , 'rotateRoomToLeft' , 'rotateRoomToRight' , 'rotateRoomToTop' , 'rotateRoomToBottom' , 'rotateCubeToLeft' , 'rotateCubeToRight' , 'rotateCubeToTop' , 'rotateCubeToBottom' , 'rotateCarouselToLeft' , 'rotateCarouselToRight' , 'rotateCarouselToTop' , 'rotateCarouselToBottom' , 'rotateSides' , 'slide' ];
	routingAnimationOptions = [
		{
			label : 'No Animations' ,
			value : 'noAnimations'
		} ,
		{
			label : 'Move From Left' ,
			value : 'moveFromLeft'
		} ,
		{
			label : 'Move From Right' ,
			value : 'moveFromRight'
		} ,
		{
			label : 'Move From Top' ,
			value : 'moveFromTop'
		} ,
		{
			label : 'Move From Bottom' ,
			value : 'moveFromBottom'
		} ,
		{
			label : 'Move From Left Fade' ,
			value : 'moveFromLeftFade'
		} ,
		{
			label : 'Move From Right Fade' ,
			value : 'moveFromRightFade'
		} ,
		{
			label : 'Move From Top Fade' ,
			value : 'moveFromTopFade'
		} ,
		{
			label : 'Move From Bottom Fade' ,
			value : 'moveFromBottomFade'
		} ,
		{
			label : 'From Left Easing' ,
			value : 'fromLeftEasing'
		} ,
		{
			label : 'From Right Easing' ,
			value : 'fromRightEasing'
		} ,
		{
			label : 'From Top Easing' ,
			value : 'fromTopEasing'
		} ,
		{
			label : 'From Bottom Easing' ,
			value : 'fromBottomEasing'
		} ,
		{
			label : 'Scale Down' ,
			value : 'scaleDownScaleDown'
		} ,
		{
			label : 'Scale Down From Left' ,
			value : 'scaleDownFromLeft'
		} ,
		{
			label : 'Scale Down From Right' ,
			value : 'scaleDownFromRight'
		} ,
		{
			label : 'Scale Down From Top' ,
			value : 'scaleDownFromTop'
		} ,
		{
			label : 'Scale Down From Bottom' ,
			value : 'scaleDownFromBottom'
		} ,
		{
			label : 'Rotate Glue From Left' ,
			value : 'rotateGlueFromLeft'
		} ,
		{
			label : 'Rotate Glue From Right' ,
			value : 'rotateGlueFromRight'
		} ,
		{
			label : 'Rotate Glue From Top' ,
			value : 'rotateGlueFromTop'
		} ,
		{
			label : 'Rotate Glue From Bottom' ,
			value : 'rotateGlueFromBottom'
		} ,
		{
			label : 'Rotate Flip To Left' ,
			value : 'rotateFlipToLeft'
		} ,
		{
			label : 'Rotate Flip To Right' ,
			value : 'rotateFlipToRight'
		} ,
		{
			label : 'Rotate Flip To Top' ,
			value : 'rotateFlipToTop'
		} ,
		{
			label : 'Rotate Flip To Bottom' ,
			value : 'rotateFlipToBottom'
		} ,
		{
			label : 'Rotate News Paper' ,
			value : 'rotateNewsPaper'
		} ,
		{
			label : 'Rotate Room To Left' ,
			value : 'rotateRoomToLeft'
		} ,
		{
			label : 'Rotate Room To Right' ,
			value : 'rotateRoomToRight'
		} ,
		{
			label : 'Rotate Room To Top' ,
			value : 'rotateRoomToTop'
		} ,
		{
			label : 'Rotate Room To Bottom' ,
			value : 'rotateRoomToBottom'
		} ,
		{
			label : 'Rotate Cube To Left' ,
			value : 'rotateCubeToLeft'
		} ,
		{
			label : 'Rotate Cube To Right' ,
			value : 'rotateCubeToRight'
		} ,
		{
			label : 'Rotate Cube To Top' ,
			value : 'rotateCubeToTop'
		} ,
		{
			label : 'Rotate Cube To Bottom' ,
			value : 'rotateCubeToBottom'
		} ,
		{
			label : 'Rotate Carousel To Left' ,
			value : 'rotateCarouselToLeft'
		} ,
		{
			label : 'Rotate Carousel To Right' ,
			value : 'rotateCarouselToRight'
		} ,
		{
			label : 'Rotate Carousel To Top' ,
			value : 'rotateCarouselToTop'
		} ,
		{
			label : 'Rotate Carousel To Bottom' ,
			value : 'rotateCarouselToBottom'
		} ,
		{
			label : 'Rotate Sides' ,
			value : 'rotateSides'
		} ,
		{
			label : 'Slide' ,
			value : 'slide'
		}
	];

	routingAnimationActive : string = this.themeSettingsService.settings.routingAnimation;

	rowsOptions = [
		{ label : '10 dòng / bảng' , value : 10 } ,
		{ label : '20 dòng / bảng' , value : 20 } ,
		{ label : '30 dòng / bảng' , value : 30 } ,
		{ label : '40 dòng / bảng' , value : 40 } ,
		{ label : '50 dòng / bảng' , value : 50 } ,
		{ label : '60 dòng / bảng' , value : 60 } ,
		{ label : '70 dòng / bảng' , value : 70 } ,
		{ label : '80 dòng / bảng' , value : 80 } ,
		{ label : '90 dòng / bảng' , value : 90 } ,
		{ label : '100 dòng / bảng' , value : 100 }
	];

	rowActive : number = this.themeSettingsService.settings.rows;

	isLoading = signal(false);

	ngOnInit() : void {

	}

	changeTabActive( tabActive : 'settings' | 'information' | 'changelog' ) {
		this.tabActive.set(tabActive);
	}

	// changeRoutingAnimation() {
	// 	this.themeSettingsService.changeThemeSetting( 'routingAnimation' , this.routingAnimationActive.trim() );
	// }

	saveSettings() {
		const settings = [
			{ item : 'routingAnimation' , value : this.routingAnimationActive.trim() } ,
			{ item : 'rows' , value : this.rowActive }
		];
		this.isLoading.set(true);
		this.themeSettingsService.changeThemeSettings( settings ).pipe( tap( () => this.authService.syncUserMeta() ) ).subscribe( {
			next  : () => {
				this.isLoading.set(false);
				this.notificationService.toastSuccess( 'Lưu thành công' , 'Thông báo' );
			} ,
			error : () => {
				this.isLoading.set(false);
				this.notificationService.toastError( 'Lưu thất bại' , 'Thông báo' );
			}
		} );
	}

	resetSettings() {
		this.rowActive              = this.themeSettingsService.defaultSettings.rows;
		this.routingAnimationActive = this.themeSettingsService.defaultSettings.routingAnimation;
	}

}
