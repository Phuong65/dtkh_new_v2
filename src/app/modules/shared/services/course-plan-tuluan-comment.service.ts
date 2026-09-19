import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { CoursePlanTuluanComment } from '../models/course-plan-tuluan-comment';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable( {
    providedIn: 'root'
} )
export class CoursePlanTuluanCommentService {

    api = getRoute( 'course-plan-tuluan-comment/' );

    constructor (
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addCoursePlanTuluanComment ( data: any ): Observable<any> {
        return this.http.post<Dto>( this.api, data ).pipe(
            map( res => res.data )
        );
    }

    updateCoursePlanTuluanComment ( deXuatId: any, data: any ): Observable<any> {
        return this.http.put<Dto>( this.api.concat( deXuatId.toString() ), data ).pipe(
            map( res => res.data )
        );
    }

    getAllCoursePlanTuluanComment (): Observable<CoursePlanTuluanComment[]> {
        return this.http.get<Dto>( this.api ).pipe(
            map( res => res.data )
        );
    }

    deleteCoursePlanTuluanComment ( id: any ): Observable<any> {
        return this.http.delete<Dto>( this.api.concat( id.toString() ) ).pipe(
            map( res => res.data )
        );
    }

    deleteCoursePlanTuluanCommentByCol ( item: string, col: string ): Observable<any> {
        const by = new HttpParams().set( 'by', col );
        return this.http.delete<Dto>( this.api.concat( item.toString() ), { params: by } ).pipe(
            map( res => res.data )
        );
    }

    updateCoursePlanTuluanCommentByCol ( deXuatId: any, data: any, col: string ): Observable<any> {
        const by = new HttpParams().set( 'by', col );
        return this.http.put<Dto>( this.api.concat( deXuatId.toString() ), data, { params: by } ).pipe(
            map( res => res.data )
        );
    }

    getCoursePlanTuluanCommentByPageNew ( option: ConditionOption ): Observable<{ data: CoursePlanTuluanComment[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder( option.condition ).set( "paged", option.page ) : this.httphelper.paramsConditionBuilder( option.condition );
        if ( option.set && option.set.length )
            option.set.forEach( f => {
                filter = filter.set( f.label, f.value );
            } )
        return this.http.get<Dto>( this.api, { params: filter } ).pipe(
            map( res => { return { data: res.data, recordsFiltered: res.recordsFiltered } } )
        );
    }

    getCoursePlanTuluanCommentByCourse_idAndCourse_plan_activity_id ( course_id: number, plan_activity_id: number ): Observable<CoursePlanTuluanComment[]> {
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
        const fromObject = {
            limit: -1,
        }
        const params = this.httphelper.paramsConditionBuilder( conditions, new HttpParams( { fromObject } ) );
        return this.http.get<Dto>( this.api, { params } ).pipe( map( res => res.data ) );
    }
}
