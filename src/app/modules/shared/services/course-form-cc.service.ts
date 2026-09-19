import { Injectable } from '@angular/core';
import { ConditionOption } from "@shared/models/condition-option";
import { Observable } from "rxjs";
import { Dto } from "@core/models/dto";
import { map } from "rxjs/operators";
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";

export interface CourseFormCc {
    id?: number;
    course_id: number;
    part: string;
    course_plan_activity_id: number;
    week: number;
    cdr: number;
    question_take: number;
    child_question_take: number;
    av: number;
    point: number;
    scan: number;
}

export interface SINHDECC {
    course_id: number;
    week: number;
    limit?: number;
}

@Injectable( {
    providedIn: 'root'
} )
export class CourseFormCcService {
    api = getRoute( 'course-form-cc/' );
    constructor (
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {

    }

    addCourseFormCc ( data: any ): Observable<any> {
        return this.http.post<Dto>( this.api, data ).pipe(
            map( res => res.data )
        );
    }

    deleteCourseFormCcByCol ( item: string, col: string ): Observable<any> {
        const by = new HttpParams().set( 'by', col );
        return this.http.delete<Dto>( this.api.concat( item.toString() ), { params: by } ).pipe(
            map( res => res.data )
        );
    }

    sinhde ( data: SINHDECC ): Observable<any> {
        return this.http.post<Dto>( this.api.concat( 'sinhde' ), data ).pipe(
            map( res => res )
        );
    }

    getCourseFormCcByPage ( option: ConditionOption ): Observable<{ data: CourseFormCc[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder( option.condition ).set( "paged", option.page ) : this.httpHelper.paramsConditionBuilder( option.condition );
        if ( option.set && option.set.length )
            option.set.forEach( f => {
                filter = filter.set( f.label, f.value );
            } )
        return this.http.get<Dto>( this.api, { params: filter } ).pipe(
            map( res => { return { data: res.data, recordsFiltered: res.recordsFiltered } } )
        );
    }


    getCoursePlansByPageNew ( option: ConditionOption ): Observable<{ data: CourseFormCc[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder( option.condition ).set( "paged", option.page ) : this.httpHelper.paramsConditionBuilder( option.condition );
        if ( option.set && option.set.length )
            option.set.forEach( f => {
                filter = filter.set( f.label, f.value );
            } )
        return this.http.get<Dto>( this.api, { params: filter } ).pipe(
            map( res => { return { data: res.data, recordsFiltered: res.recordsFiltered } } )
        );
    }

}
