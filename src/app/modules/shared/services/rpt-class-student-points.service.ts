import { Injectable } from '@angular/core';
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { Observable } from "rxjs";
import { Dto, OvicConditionParam, OvicQueryCondition } from "@core/models/dto";
import { map } from "rxjs/operators";
import { ConditionOption } from "@shared/models/condition-option";
import { Classes } from "@shared/models/classes";

export interface RptClassStudentPoints {
    id?: number;
    course_id: number;
    class_id: number;
    student_id: number;
    hodem: string;
    ten: string;
    student_code: string;
    cc: number;
    bttn: number;
    bttn_tp: any;
    bttn_max_tp?: any;
    tx1: number;
    tx2: number;
    tx3: number;
    tx4: number;
    thi: number;
    tyle: any;
    key?: string;
    check_ban?: string;
    nghi_20_pecent?: string;
    chitiet_tx?: string;
    ordering?: number;
    so_buoinghi?: number;
    accept_duthi?: number;// 0
}
@Injectable({
    providedIn: 'root'
})
export class RptClassStudentPointsService {

    api = getRoute('rpt-class-student-points/');

    constructor(
        private http: HttpClient,
        private httpParamsHelper: HttpParamsHeplerService
    ) {
    }

    add(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
    }
    update(id: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(map(res => res.data));
    }
    delelte(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString()));
    }

    getDataByClassid(class_id: number): Observable<RptClassStudentPoints[]> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: class_id.toString(10),
            },
        ];
        const fromObject = {
            paged: 1,
            limit: -1,
            orderby: 'ordering,ten,hodem',
            order: 'ASC'
        };
        const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'profile'));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    checkLeghtByClassId(class_id: number): Observable<number> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: class_id.toString(10),
            },
        ];
        const fromObject = {
            paged: 1,
            limit: 1,
        };
        const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.recordsFiltered));
    }

    getStudentCodeByClass_id(class_id: number): Observable<RptClassStudentPoints[]> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: class_id.toString(10),
            },
        ];
        const fromObject = {
            paged: 1,
            limit: -1,
            groupby: 'student_code',
            select: 'id,student_code,student_id,class_id'

        };
        const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }


    getItemMaxUpdateAtByClassId(class_id: number): Observable<RptClassStudentPoints> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: class_id.toString(10),
            },
        ];
        const fromObject = {
            paged: 1,
            limit: 1,
            order: 'DESC',
            orderby: 'updated_at'

        };
        const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data[0]));
    }

    getDataByPageNew(option: ConditionOption): Observable<{ data: RptClassStudentPoints[], recordsFiltered: number }> {
        let filter = option.page ? this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpParamsHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
