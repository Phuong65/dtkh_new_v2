import { Injectable } from '@angular/core';
import { ConditionOption } from "@shared/models/condition-option";
import { Observable } from "rxjs";
import { Dto } from "@core/models/dto";
import { map } from "rxjs/operators";
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { CourseFormDuyet } from '../models/course-form-duyet';

@Injectable({
    providedIn: 'root'
})

export class CourseFormDuyetService {
    api = getRoute('course-form-duyet/');
    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {

    }

    addCourseFormDuyet(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateCourseFormDuyet(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    deleteCourseFormDuyet(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }


    deleteCourseFormDuyetByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }


    getCourseFormDuyetByPage(option: ConditionOption): Observable<{ data: CourseFormDuyet[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }


    getCourseFormDuyetByPageNew(option: ConditionOption): Observable<{ data: CourseFormDuyet[], recordsFiltered: number }> {
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
