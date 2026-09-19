import { Injectable } from '@angular/core';
import { getRoute } from '@env';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Observable } from 'rxjs';
import { Dto , IctuQueryParams , OvicConditionParam } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { CourseTesterSession } from '@shared/models/course-tester-session';

export interface ScoreReport {
	code : string,
	message : string,
	passed : number,
	score : number,
	data : number[],
	number_of_correct_answers : number,
	total_question : number
}

@Injectable( {
	providedIn : 'root'
} )
export class CourseTesterSessionService {

	private readonly api : string = getRoute( 'course-tester-session/' );

	constructor (
		private http : HttpClient ,
		private httpHelper : HttpParamsHeplerService
	) {
	}

	create ( info : Partial<CourseTesterSession> ) : Observable<number> {
		return this.http.post<Dto>( this.api , info ).pipe( map( ( res : Dto ) => res.data ) );
	}

	get ( id : number , queryParams? : IctuQueryParams ) : Observable<CourseTesterSession> {
		const fromObject : IctuQueryParams = queryParams ? queryParams : {};
		const params : HttpParams          = new HttpParams( { fromObject } );
		return this.http.get<Dto>( ''.concat( this.api , id.toString( 10 ) ) , { params } ).pipe( map( ( res : Dto ) => res.data ) );
	}

	update ( id : number , info : Partial<CourseTesterSession> ) : Observable<number> {
		return this.http.put<Dto>( ''.concat( this.api , id.toString( 10 ) ) , info ).pipe( map( ( res : Dto ) => res.data ) );
	}

	getCourseTesterSessionsByCourseIds ( courseId : number[] , queryParams? : IctuQueryParams ) : Observable<CourseTesterSession[]> {
		const fromObject : IctuQueryParams = Object.assign<IctuQueryParams , IctuQueryParams>(
			{
				include    : courseId.join( ',' ) ,
				include_by : 'course_id' ,
				limit      : -1 ,
				paged      : 1
			} ,
			queryParams
		);
		const params : HttpParams          = new HttpParams( { fromObject } );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( ( res : Dto ) => res.data ) );
	}

	query<T> ( conditions : OvicConditionParam[] , queryParams? : IctuQueryParams ) : Observable<T[]> {
		const params : HttpParams = this.httpHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject : queryParams } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( ( res : Dto ) => res.data ) );
	}

	score ( id : number ) : Observable<ScoreReport> {
		return this.http.post<ScoreReport>( ''.concat( this.api , 'score/' , id.toString( 10 ) ) , {} );
	}
}
