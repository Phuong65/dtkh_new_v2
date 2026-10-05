import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmComponent } from '@core/components/confirm/confirm.component';
import { PopupComponent } from '@core/components/popup/popup.component';
import { AppSafeHtmlPipe } from '@core/pipes/app-safe-html.pipe';
import { InterceptorsService } from '@core/services/interceptors.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgbActiveOffcanvas  } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmRoundedComponent } from '@core/components/confirm-rounded/confirm-rounded.component';
import { ConfirmDeleteComponent } from '@core/components/confirm-delete/confirm-delete.component';
import { TranslateLoader , TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { getSaver , SAVER } from '@core/providers/saver.provider';
import { AlertComponent } from '@core/components/alert/alert.component';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';
import { AppTranslateButtonPipe } from '@core/pipes/app-translate-button.pipe';

// AoT requires an exported function for factories
export function HttpLoaderFactory( httpClient : HttpClient ) {
	return new TranslateHttpLoader( httpClient );
}

@NgModule( {
	declarations : [
		
	] ,
	imports      : [
		BrowserModule ,
		ToastModule ,
		AppRoutingModule ,
		NgApexchartsModule ,


		ConfirmComponent ,
		PopupComponent ,
		AppSafeHtmlPipe ,
		ConfirmRoundedComponent ,
		ConfirmDeleteComponent ,
		AlertComponent ,
		AppTranslateButtonPipe ,
		TranslateModule.forRoot( {
			loader : {
				provide    : TranslateLoader ,
				useFactory : HttpLoaderFactory ,
				deps       : [ HttpClient ]
			}
		} )
	] ,
	providers    : [
		NgbActiveOffcanvas ,
		MessageService ,
		{ provide : SAVER , useFactory : getSaver } ,
		provideHttpClient(withInterceptorsFromDi()),
		{ provide : HTTP_INTERCEPTORS , useClass : InterceptorsService , multi : true },
		providePrimeNG({
			theme: {
				preset: Lara,
				options: { darkModeSelector: false }
			},
			ripple: true
		})
	] ,
	exports      : [] ,
	bootstrap    : [ AppComponent ]
} )
export class AppModule { }
