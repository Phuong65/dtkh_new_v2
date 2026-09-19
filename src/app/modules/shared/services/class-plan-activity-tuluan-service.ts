import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ClassPlanActivityTuluan } from '../models/class-plan-activity-tuluan';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ClassPlanActivityTuluanService {

    api = getRoute('class-plan-activity-tuluan/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addClassPlanActivityTuluan(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivityTuluan(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassPlanActivityTuluan(): Observable<ClassPlanActivityTuluan[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivityTuluan(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivityTuluanByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivityTuluanByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getClassPlanActivityTuluanByPageNew(option: ConditionOption): Observable<{ data: ClassPlanActivityTuluan[], recordsFiltered: number }> {
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

    sinhdetructiep(class_plan_activity_id: number, av: number = 0): Observable<any> {
        return this.http.post<Dto>(this.api.concat('sinhde-tructiep/', class_plan_activity_id.toString(), '?av=', av.toString()), {}).pipe(
            map(res => res)
        );
    }
}
