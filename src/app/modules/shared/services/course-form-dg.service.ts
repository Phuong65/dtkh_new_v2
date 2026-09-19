import { Injectable } from '@angular/core';
import { ConditionOption } from "@shared/models/condition-option";
import { Observable } from "rxjs";
import { Dto } from "@core/models/dto";
import { map } from "rxjs/operators";
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";

export interface CourseFormDg {
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
    private?: number;
}

export interface SINHDEDG {
    course_id: number;
    week: number;
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})

export class CourseFormDgService {
    api = getRoute('course-form-dg/');
    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {

    }

    addCourseFormDg(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    deleteCourseFormDg(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }


    deleteCourseFormDgByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    sinhde(data: SINHDEDG): Observable<any> {
        return this.http.post<Dto>(this.api.concat('sinhde'), data).pipe(
            map(res => res)
        );
    }

    getCourseFormDgByPage(option: ConditionOption): Observable<{ data: CourseFormDg[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }


    getCoursePlansByPageNew(option: ConditionOption): Observable<{ data: CourseFormDg[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

}
