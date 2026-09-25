import { Injectable } from '@angular/core';
import { getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Dto } from '@core/models/dto';
import { OvicZoom } from '../../shared/models/ovic-zoom';
import { map } from 'rxjs/operators';

const DEFAULT_ZOOM = { api: '' , apiSecret: '' , host_id: '' , user_id: '' };

const ZOOM_NOT_CONFIGURED = 'Zoom client integration requires backend configuration.';

@Injectable ( {
	providedIn : 'root'
} )
export class OvicZoomService {
	defaultZoom = DEFAULT_ZOOM;

	api = getRoute( 'class-zoom/' );

	/** Configure via backend — not from environment */
	apiZoomUser = '';

	/** Configure via backend — not from environment */
	apiZoomMeeting = '';

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

	getZoomToken ( _api?: string , _apisecret?: string ): string {
		throw new Error( ZOOM_NOT_CONFIGURED );
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

	getUserByZoom ( _api : string , _apisecret : string ) : Observable<any> {
		return throwError( () => new Error( ZOOM_NOT_CONFIGURED ) );
	}

	createMeeting ( _api : string , _apisecret : string , _hostId : string , _startTime : any , _time : number , _title : string , _userId : string ) : Observable<any> {
		return throwError( () => new Error( ZOOM_NOT_CONFIGURED ) );
	}
}
