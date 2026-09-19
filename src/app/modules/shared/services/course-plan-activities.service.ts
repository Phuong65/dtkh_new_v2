import { Injectable } from '@angular/core';
import { getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto , IctuQueryParams , OvicConditionParam , OvicQueryCondition } from '@core/models/dto';
import { CoursePlanActivities } from '../models/course-plan-activities';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

export interface SINHDE {
	course_id : number;
	week : number;
	type : 'CC' | 'TX';
}


@Injectable( {
	providedIn : 'root'
} )
export class CoursePlanActivitiesService {

	api = getRoute( 'course-plan-activities/' );

	constructor (
		private http : HttpClient ,
		private httpHelper : HttpParamsHeplerService
	) {
	}

	addCoursePlanActivities ( data : any ) : Observable<any> {
		return this.http.post<Dto>( this.api , data ).pipe(
			map( res => res.data )
		);
	}

	updateCoursePlanActivities ( deXuatId : any , data : any ) : Observable<any> {
		return this.http.put<Dto>( this.api.concat( deXuatId.toString() ) , data ).pipe(
			map( res => res.data )
		);
	}

	updateCoursePlanActivitiesByCol ( deXuatId : any , data : any , col : string ) : Observable<any> {
		const by = new HttpParams().set( 'by' , col );
		return this.http.put<Dto>( this.api.concat( deXuatId.toString() ) , data , { params : by } ).pipe(
			map( res => res.data )
		);
	}

	getAllCoursePlanActivities () : Observable<CoursePlanActivities[]> {
		return this.http.get<Dto>( this.api ).pipe(
			map( res => res.data )
		);
	}


	deleteCoursePlanActivities ( id : any ) : Observable<any> {
		return this.http.delete<Dto>( this.api.concat( id.toString() ) ).pipe(
			map( res => res.data )
		);
	}

	deleteCoursePlanActivitiesByCol ( id : string , col : string ) : Observable<any> {
		const by = new HttpParams().set( 'by' , col );
		return this.http.delete<Dto>( this.api.concat( id.toString() ) , { params : by } );
	}


	getCoursePlanActivitiesByPageNew ( option : ConditionOption ) : Observable<{ data : CoursePlanActivities[], recordsFiltered : number }> {
		let filter = option.page ? this.httpHelper.paramsConditionBuilder( option.condition ).set( "paged" , option.page ) : this.httpHelper.paramsConditionBuilder( option.condition );
		if ( option.set && option.set.length )
			option.set.forEach( f => {
				filter = filter.set( f.label , f.value );
			} )
		return this.http.get<Dto>( this.api , { params : filter } ).pipe(
			map( res => {
				return { data : res.data , recordsFiltered : res.recordsFiltered }
			} )
		);
	}


	getCoursePlanActivityBycourseId ( course_id : number , type? : string ) : Observable<CoursePlanActivities[]> {
		const conditions : OvicConditionParam[] = [
			{
				conditionName : 'course_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : course_id.toString()
			} ,
			{
				conditionName : 'week' ,
				condition     : OvicQueryCondition.notEqual ,
				value         : '0'
			}


		];
		if ( type ) {
			conditions.push(
				{
					conditionName : 'type' ,
					condition     : OvicQueryCondition.equal ,
					value         : type
				}
			)
		}
		const fromObject = {
			limit   : -1 ,
			orderby : 'ordering' ,
			order   : 'ASC'
		}
		const params     = this.httpHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.data ) );
	}

	getCoursePlanActivitiesByparendIdAndType ( parent_id : number , type? : string , select? : string ) : Observable<CoursePlanActivities[]> {
		const conditions : OvicConditionParam[] = [
			{
				conditionName : 'parent_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : parent_id.toString()
			} ,
			{
				conditionName : 'status' ,
				condition     : OvicQueryCondition.notEqual ,
				value         : '-3' ,
				orWhere       : 'and'
			}
		];
		if ( type ) {
			conditions.push(
				{
					conditionName : 'type' ,
					condition     : OvicQueryCondition.equal ,
					value         : type
				}
			)
		}
		const fromObject = {
			limit   : -1 ,
			orderby : 'ordering' ,
			order   : 'ASC' ,
			select  : select ? select : ''
		}
		const params     = this.httpHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.data ) );
	}

	sinhde ( data : SINHDE ) : Observable<any> {
		return this.http.post<Dto>( this.api.concat( 'sinhde' ) , data ).pipe(
			map( res => res )
		);
	}

	query<T> ( conditions : OvicConditionParam[] , queryParams? : IctuQueryParams ) : Observable<T[]> {
		const params : HttpParams = this.httpHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject : queryParams } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( ( res : Dto ) => res.data ) );
	}
}
