import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { CoursePlanComment } from '../models/course-plan-comment';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable( {
    providedIn: 'root'
} )
export class CoursePlanCommentService {

    api = getRoute( 'course-plan-comment/' );

    constructor (
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addCoursePlanComment ( data: any ): Observable<any> {
        return this.http.post<Dto>( this.api, data ).pipe(
            map( res => res.data )
        );
    }

    updateCoursePlanComment ( deXuatId: any, data: any ): Observable<any> {
        return this.http.put<Dto>( this.api.concat( deXuatId.toString() ), data ).pipe(
            map( res => res.data )
        );
    }

    getAllCoursePlanComment (): Observable<CoursePlanComment[]> {
        return this.http.get<Dto>( this.api ).pipe(
            map( res => res.data )
        );
    }

    deleteCoursePlanComment ( id: any ): Observable<any> {
        return this.http.delete<Dto>( this.api.concat( id.toString() ) ).pipe(
            map( res => res.data )
        );
    }

    deleteCoursePlanCommentByCol ( item: string, col: string ): Observable<any> {
        const by = new HttpParams().set( 'by', col );
        return this.http.delete<Dto>( this.api.concat( item.toString() ), { params: by } ).pipe(
            map( res => res.data )
        );
    }

    updateCoursePlanCommentByCol ( deXuatId: any, data: any, col: string ): Observable<any> {
        const by = new HttpParams().set( 'by', col );
        return this.http.put<Dto>( this.api.concat( deXuatId.toString() ), data, { params: by } ).pipe(
            map( res => res.data )
        );
    }

    getCoursePlanCommentByPageNew ( option: ConditionOption ): Observable<{ data: CoursePlanComment[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder( option.condition ).set( "paged", option.page ) : this.httphelper.paramsConditionBuilder( option.condition );
        if ( option.set && option.set.length )
            option.set.forEach( f => {
                filter = filter.set( f.label, f.value );
            } )
        return this.http.get<Dto>( this.api, { params: filter } ).pipe(
            map( res => { return { data: res.data, recordsFiltered: res.recordsFiltered } } )
        );
    }

    getCoursePlanCommentByCourse_idAndCourse_plan_activity_id ( course_id: number, plan_activity_id: number, captruong: boolean = false ): Observable<CoursePlanComment[]> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'course_id',
                condition: OvicQueryCondition.equal,
                value: course_id.toString(),
            },
            {
                conditionName: 'parent_id',
                condition: OvicQueryCondition.equal,
                value: '0',
                orWhere: 'and'
            },
        ];

        if ( captruong ) {
            conditions.push( {
                conditionName: 'cap_hoidong',
                condition: OvicQueryCondition.equal,
                value: 'cap_truong',
                orWhere: 'and'
            }, )
        } else {
            conditions.push( {
                conditionName: 'cap_hoidong',
                condition: OvicQueryCondition.equal,
                value: 'cap_khoa',
                orWhere: 'and'
            }, )
        }

        const fromObject = {
            limit: -1,
        }
        const params = this.httphelper.paramsConditionBuilder( conditions, new HttpParams( { fromObject } ) );
        return this.http.get<Dto>( this.api, { params } ).pipe( map( res => res.data ) );
    }
}
