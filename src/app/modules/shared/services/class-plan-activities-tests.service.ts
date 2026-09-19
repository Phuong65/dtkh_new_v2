import { Injectable } from '@angular/core';
import { getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ClassPlanActivitiesTests } from '../models/class-plan-activities-tests';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ClassPlanActivitiesTestsService {

    api = getRoute('class-plan-activities-tests/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addClassPlanActivitiesTests(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivitiesTests(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassPlanActivitiesTests(): Observable<ClassPlanActivitiesTests[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivitiesTests(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivitiesTestsByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivitiesTestsByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getClassPlanActivitiesTestsByPageNew(option: ConditionOption): Observable<{ data: ClassPlanActivitiesTests[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    sinhde(class_plan_activity_id: number, av: number = 0): Observable<any> {
        return this.http.post<Dto>(this.api.concat('sinhde/', class_plan_activity_id.toString(), '?av=', av.toString()), {}).pipe(
            map(res => res)
        );
    }

    getDataByClassIdAndStudentIds(class_id: number, student_ids: number[], select?: string): Observable<ClassPlanActivitiesTests[]> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: class_id.toString()
            }
        ];
        const fromObject = {
            limit: -1,
            paged: 1,
            include: student_ids.join(','),
            include_by: 'student_id',
            select: select ? select : null
        }
        const params = this.httphelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res ? res.data : []));

    }


    sinhdetructiep(class_plan_activity_id: number, av: number = 0): Observable<any> {
        return this.http.post<Dto>(this.api.concat('sinhde-tructiep/', class_plan_activity_id.toString(), '?av=', av.toString()), {}).pipe(
            map(res => res)
        );
    }

}
