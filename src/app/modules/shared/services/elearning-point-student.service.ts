import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ElngPointStudent } from '../../shared/models/elng-point-student';
import { map } from 'rxjs/operators';

@Injectable ( {
	providedIn : 'root'
} )
export class ElngPointStudentService {

	api = getRoute( 'class-point-students/' );

	constructor (
		private http : HttpClient
	) {
	}

	addElngPointStudent ( data : any ) : Observable<any> {
		return this.http.post<Dto> ( this.api , data ).pipe (
			map ( res => res.data )
		);
	}

	updateElngPointStudent ( deXuatId : number , data : any ) : Observable<any> {
		return this.http.put<Dto> ( this.api.concat ( deXuatId.toString () ) , data ).pipe (
			map ( res => res.data )
		);
	}

	getAllElngPointStudentByUserCreate ( user_id : number ) : Observable<ElngPointStudent[]> {
		return this.http.get<Dto> ( this.api.concat ( '?condition=creator_id,=,' , user_id.toString () ) ).pipe (
			map ( res => res.data )
		);
	}

	getAllElngPointStudent () : Observable<ElngPointStudent[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto> ( this.api ).pipe (
			map ( res => res.data )
		);
	}

	deleteElngPointStudent ( id : number ) : Observable<any> {
		return this.http.delete<Dto> ( this.api.concat ( id.toString () ) ).pipe (
			map ( res => res.data )
		);
	}

	getElngPointStudentByCol ( col : string , item : string ) : Observable<ElngPointStudent[]> {
		const filter = new HttpParams ().set ( 'condition' , col.concat ( ',=,' , item ) );
		return this.http.get<Dto> ( this.api , { params : filter } ).pipe (
			map ( res => res.data )
		);
	}
}
