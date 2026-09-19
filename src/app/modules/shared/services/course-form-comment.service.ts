import { Injectable } from '@angular/core';
import { ConditionOption } from "@shared/models/condition-option";
import { Observable } from "rxjs";
import { Dto } from "@core/models/dto";
import { map } from "rxjs/operators";
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { CourseFormComment } from '../models/course-form-comment';

@Injectable({
    providedIn: 'root'
})

export class CourseFormCommentService {
    api = getRoute('course-form-comment/');
    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {

    }

    addCourseFormComment(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    deleteCourseFormComment(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }


    deleteCourseFormCommentByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }


    getCourseFormCommentByPage(option: ConditionOption): Observable<{ data: CourseFormComment[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }


    getCourseFormCommentByPageNew(option: ConditionOption): Observable<{ data: CourseFormComment[], recordsFiltered: number }> {
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
