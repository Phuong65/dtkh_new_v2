import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { OvicZoom } from '../../shared/models/ovic-zoom';
import { map } from 'rxjs/operators';
import { DEFAULT_ZOOM } from '../../shared/utils/syscat';
import createHmac from 'create-hmac';
import * as CryptoJS from 'crypto-js';
import base64url from 'base64url';

@Injectable ( {
	providedIn : 'root'
} )
export class OvicZoomService {
	defaultZoom = DEFAULT_ZOOM;

	api = getRoute( 'class-zoom/' );

	apiZoomUser = ''.concat ( environment.server.apiZoom , 'users' );

	apiZoomMeeting = ''.concat ( environment.server.apiZoom , 'mettings' );

	constructor (
		private http : HttpClient
	) {
	}

	addOvicZoom ( data : any ) : Observable<any> {
		return this.http.post<Dto> ( this.api , data ).pipe (
			map ( res => res.data )
		);
	}

	updateOvicZoom ( deXuatId : number , data : any ) : Observable<any> {
		return this.http.put<Dto> ( this.api.concat ( deXuatId.toString () ) , data ).pipe (
			map ( res => res.data )
		);
	}


	getAllOvicZoom () : Observable<OvicZoom[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto> ( this.api ).pipe (
			map ( res => res.data )
		);
	}

	deleteOvicZoom ( ids : string ) : Observable<any> {
		return this.http.delete<Dto> ( this.api.concat ( ids ) ).pipe (
			map ( res => res.data )
		);
	}

	getOvicZoomByCol ( col : string , item : any ) : Observable<OvicZoom[]> {
		const filter = new HttpParams ().set ( 'condition' , col.concat ( ',=,' , item ) );
		return this.http.get<Dto> ( this.api , { params : filter } ).pipe (
			map ( res => res.data )
		);
	}

	getZoomToken ( api , apisecret ) {
		let newApi = null;
		let newApisecret = null;
		if ( ! api ) {
			newApi = this.defaultZoom.api;
		} else {
			newApi = api;
		}
		if ( ! apisecret ) {
			newApisecret = this.defaultZoom.apiSecret;
		} else {
			newApisecret = apisecret;
        }
		const d = new Date ();
		const tmpd = d.setMinutes ( d.getMinutes () + 90 );
		const exp = new Date ( tmpd );
		const apiSecret = newApisecret.trim ();
		const payload = { 'iss' : newApi.trim () , 'exp' : exp.getTime () };
		const header = { 'alg' : 'HS256' , 'typ' : 'JWT' };
		const headerBase64 = base64url ( JSON.stringify ( header ) );
		const payloadBase64 = base64url ( JSON.stringify ( payload ) );
		const sig = CryptoJS.HmacSHA256 ( headerBase64 + '.' + payloadBase64 , apiSecret );
		const signature = CryptoJS.enc.Base64.stringify ( sig );
        const token = headerBase64 + '.' + payloadBase64 + '.' + signature;
		return token;
	}

	getBody ( hostId : string , startTime : any , time : number , title : string ) {
		const body = {
			'duration' : time ,
			'host_id' : hostId ? hostId : this.defaultZoom.host_id ,
			'id' : 1100000 ,
			'join_url' : 'https://zoom.us/j/1100000' ,
			'settings' : {
				'alternative_hosts' : '' ,
				'approval_type' : 2 ,
				'audio' : 'both' ,
				'auto_recording' : 'local' ,
				'close_registration' : false ,
				'cn_meeting' : false ,
				'enforce_login' : false ,
				'enforce_login_domains' : '' ,
				/*"global_dial_in_numbers": [
					  {
						"city": "New York",
						"country": "US",
						"country_name": "US",
						"number": "+1 1000200200",
						"type": "toll"
					  },
					  {
						"city": "San Jose",
						"country": "US",
						"country_name": "US",
						"number": "+1 6699006833",
						"type": "toll"
					  },
					  {
						"city": "San Jose",
						   "country": "US",
						"country_name": "US",
						"number": "+1 408000000",
						"type": "toll"
					  }
				],*/
				'host_video' : false ,
				'in_meeting' : false ,
				'join_before_host' : true ,
				'mute_upon_entry' : false ,
				'participant_video' : false ,
				'registrants_confirmation_email' : true ,
				'use_pmi' : false ,
				'waiting_room' : true ,
				'watermark' : false ,
				'registrants_email_notification' : true
			} ,
			'start_time' : startTime ,
			'start_url' : 'https://zoom.us/s/1100000?iIifQ.wfY2ldlb82SWo3TsR77lBiJjR53TNeFUiKbLyCvZZjw' ,
			'status' : 'waiting' ,
			'topic' : title ,
			'type' : 2 ,
			//"uuid": "ng1MzyWNQaObxcf3+Gfm6A=="
		};
		return body;
	}

	getUserByZoom ( api : string , apisecret : string ) : Observable<any> {
		const token = this.getZoomToken ( api , apisecret );
        const headers = { 'token_zoom' : 'Bearer ' + token , 'Content-Type' : 'application/json' };
		return this.http.get<Dto> ( this.apiZoomUser , { headers } ).pipe (
			map ( res => res )
		);
	}

	createMeeting ( api : string , apisecret : string , hostId : string , startTime : any , time : number , title : string , userId : string ) : Observable<any> {
        const token = this.getZoomToken(api, apisecret);
		const body = this.getBody ( hostId , startTime , time , title );
        const headers = { 'token_zoom': 'Bearer '+ token, 'Content-Type': 'application/json', 'user_id': userId ? userId : this.defaultZoom.user_id };
		return this.http.post<Dto> ( this.apiZoomMeeting , body , { headers } ).pipe (
			map ( res => res )
		);
	}
}
