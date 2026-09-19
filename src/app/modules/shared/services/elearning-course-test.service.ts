import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ElnCourseTest } from '../../shared/models/elng-course-test';
import { map } from 'rxjs/operators'; 

@Injectable( {
	providedIn : 'root'
} )
export class ElnCourseTestService {
	
	api = getRoute( 'user-course-test/' );
	
	constructor (
		private http : HttpClient
	) {
	}
	
	addElnCourseTest ( data : any ) : Observable<any> {
		return this.http.post<Dto>( this.api , data ).pipe(
			map( res => res.data )
		);
	}
	
	updateElnCourseTest ( deXuatId : number , data : any ) : Observable<any> {
		return this.http.put<Dto>( this.api.concat( deXuatId.toString() ) , data ).pipe(
			map( res => res.data )
		);
	}
	
	getAllElnCourseTestByUserCreate ( user_id : number ) : Observable<ElnCourseTest[]> {
		return this.http.get<Dto>( this.api.concat( '?condition=creator_id,=,' , user_id.toString() ) ).pipe(
			map( res => res.data )
		);
	}
		
	getAllElnCourseTest () : Observable<ElnCourseTest[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto>( this.api).pipe(
			map( res => res.data )
		);
	}
	
	deleteElnCourseTest ( id : number ) : Observable<any> {
		return this.http.delete<Dto>( this.api.concat( id.toString() ) ).pipe(
			map( res => res.data )
		);
	}

	getElnCourseTestByCol ( col:string, item:string ) : Observable<ElnCourseTest[]> {
		const filter = new HttpParams().set( col , item ); 
		return this.http.get<Dto>( this.api, { params : filter } ).pipe(
			map( res => res.data )
		);
	}
	getElnCourseTestByCols( condition: HttpParams ):Observable<ElnCourseTest[]> {		
		return this.http.get<Dto>( this.api, { params : condition } ).pipe(
			map( res => res.data )
		);
	}

	getElnCourseTestByColCondition ( col:string, item:any ) : Observable<ElnCourseTest[]> {
		const filter = new HttpParams().set( 'condition', col.concat(',=,',item) ); 
		return this.http.get<Dto>( this.api, { params : filter } ).pipe(
			map( res => res.data )
		);
	}			
}
