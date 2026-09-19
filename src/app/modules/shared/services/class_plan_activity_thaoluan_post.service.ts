import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';
import { OvicFile } from '@core/models/file';
import { ClassPlanActivityThaoLuanPostReply } from './class_plan_activity_thaoluan_post_reply.service';

export interface ClassPlanActivityThaoLuanPost {
    id?: number;
    class_id: number;
    course_id: number;
    title: string;
    class_plan_activity_id: number;
    student_id: number;
    files: OvicFile[];
    noidung: string;
    reply?: ClassPlanActivityThaoLuanPostReply;
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by: number;
}

@Injectable({
    providedIn: 'root'
})

export class ClassPlanActivityThaoLuanPostService {

    api = getRoute('class-plan-activity-thaoluan-post/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addClassPlanActivityThaoLuanPost(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivityThaoLuanPost(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassPlanActivityThaoLuanPost(): Observable<ClassPlanActivityThaoLuanPost[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivityThaoLuanPost(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivityThaoLuanPostByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivityThaoLuanPostByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getClassPlanActivityThaoLuanPostByPageNew(option: ConditionOption): Observable<{ data: ClassPlanActivityThaoLuanPost[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
