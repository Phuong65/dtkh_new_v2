import { Injectable } from '@angular/core';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { HttpClient , HttpParams } from '@angular/common/http';
import { getRoute } from '@env';
import { Observable } from 'rxjs';
import { CourseTesters } from '@shared/models/course-testers';
import { Dto , IctuQueryParams , OvicConditionParam , OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';

@Injectable( {
	providedIn : 'root'
} )
export class CourseTestersService {

	private readonly api : string = getRoute( 'course-testers/' );

	constructor(
		private http : HttpClient ,
		private httpHelper : HttpParamsHeplerService
	) {}

	get( id : number , queryParams? : IctuQueryParams ) : Observable<CourseTesters> {
		const params : HttpParams = new HttpParams( { fromObject : queryParams } );
		return this.http.get<Dto>( ''.concat( this.api , id.toString( 10 ) ) , { params } ).pipe( map( ( res : Dto ) => res.data ) );
	}

	update( id : number , info : Partial<CourseTesters> ) : Observable<number> {
		return this.http.put<Dto>( this.api , info ).pipe( map( ( res : Dto ) => res.data ) );
	}

	delete( id : number ) : Observable<number> {
		return this.http.delete<Dto>( ''.concat( this.api , id.toString( 10 ) ) ).pipe( map( ( res : Dto ) => res.data ) );
	}

	receiveAssignedTest( user_id : number , byCourse_id? : number , byWeek? : number , queryParams? : IctuQueryParams ) : Observable<CourseTesters[]> {
		const conditions : OvicConditionParam[] = [
			{ conditionName : 'user_id' , condition : OvicQueryCondition.equal , value : user_id.toString( 10 ) }
		];
		if ( byCourse_id ) {
			conditions.push( { conditionName : 'course_id' , condition : OvicQueryCondition.equal , value : byCourse_id.toString( 10 ) , orWhere : 'and' } );
		}
		if ( byWeek ) {
			conditions.push( { conditionName : 'week' , condition : OvicQueryCondition.equal , value : byWeek.toString( 10 ) , orWhere : 'and' } );
		}
		const fromObject : IctuQueryParams = Object.assign( {
			limit : '-1' ,
			paged : 1
		} , queryParams );
		const params : HttpParams          = this.httpHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( ( res ) => res.data ) );
	}
}
