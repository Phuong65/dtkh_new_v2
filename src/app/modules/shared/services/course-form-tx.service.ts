import { Injectable } from '@angular/core';
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { Observable } from "rxjs";
import { ConditionOption } from "@shared/models/condition-option";
import { Dto } from "@core/models/dto";
import { map } from "rxjs/operators";

export interface CourseFormTx {
    id?: number;
    course_id: number;
    part: string;
    course_plan_activity_id: string;
    week: number;
    cdr: number;
    question_take: number;
    child_question_take: number;
    av: number;
    point: number;
    scan: number;
    ordering?: number;
    private?: number;
}

export interface SINHDETX {
    course_id: number;
    ordering: number;
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})
export class CourseFormTxService {
    api = getRoute('course-form-tx/');
    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addCourseFormTx(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    deleteCourseFormTx(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteCourseFormTxByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getCourseFormTxByPage(option: ConditionOption): Observable<{ data: CourseFormTx[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getCoursePlansByPageNew(option: ConditionOption): Observable<{ data: CourseFormTx[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    sinhde(data: SINHDETX): Observable<any> {
        return this.http.post<Dto>(this.api.concat('sinhde'), data).pipe(
            map(res => res)
        );
    }
}
