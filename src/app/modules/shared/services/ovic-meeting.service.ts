import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { OvicMeeting } from '../../shared/models/ovic-meeting';
import { map } from 'rxjs/operators';

@Injectable ( {
	providedIn : 'root'
} )
export class OvicMeetingService {

	api = getRoute( 'class-meeting/' );


	constructor (
		private http : HttpClient
	) {
	}

	addOvicMeeting ( data : any ) : Observable<any> {
		return this.http.post<Dto> ( this.api , data ).pipe (
			map ( res => res.data )
		);
	}

	updateOvicMeeting ( deXuatId : number , data : any ) : Observable<any> {
		return this.http.put<Dto> ( this.api.concat ( deXuatId.toString () ) , data ).pipe (
			map ( res => res.data )
		);
	}


	getAllOvicMeeting () : Observable<OvicMeeting[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto> ( this.api ).pipe (
			map ( res => res.data )
		);
	}

	deleteOvicMeeting ( ids : string ) : Observable<any> {
		return this.http.delete<Dto> ( this.api.concat ( ids ) ).pipe (
			map ( res => res.data )
		);
	}

	getOvicMeetingByCol ( col : string , item : any ) : Observable<OvicMeeting[]> {
		const filter = new HttpParams ().set ( 'condition' , col.concat ( ',=,' , item ) );
		return this.http.get<Dto> ( this.api , { params : filter } ).pipe (
			map ( res => res.data )
		);
    }
    
    getOvicMeetingByCols(condition: HttpParams): Observable<OvicMeeting[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }


}
