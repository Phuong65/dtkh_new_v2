import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ClassPlanActivities } from '../models/class-plan-activities';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ClassPlanActivitiesService {

    api = getRoute('class-plan-activities/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addClassPlanActivities(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivities(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassPlanActivities(): Observable<ClassPlanActivities[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivities(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivitiesByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivitiesByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getClassPlanActivitiesByPageNew(option: ConditionOption): Observable<{ data: ClassPlanActivities[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    lockLogin(data: { class_id: number, student_id?: number, expires: number }) {
        let params = new HttpParams();
        if (data.student_id) {
            params = params.set('student_id', data.student_id.toString());
        }
        return this.http.post<Dto>(this.api.concat('khoa-dang-nhap/', data.class_id.toString()), { expires: data.expires }, { params: params }).pipe(
            map(res => res)
        );
    }

    unLockLogin(class_id: number, student_id: number = null) {
        let params = new HttpParams();
        if (student_id) {
            params = params.set('student_id', student_id.toString());
        }
        return this.http.post<Dto>(this.api.concat('mo-dang-nhap/', class_id.toString()), {}, { params: params }).pipe(
            map(res => res)
        );
    }

    passCode(class_plan_test_id: number, student_id: number = null): Observable<any> {
        let params = new HttpParams();

        if (student_id) {
            params = params.set('student_id', student_id.toString());
        }
        return this.http.post<Dto>(this.api.concat('passcode/', class_plan_test_id.toString()), {}, { params: params }).pipe(
            map(res => res)
        );
    }

    nopbai(class_plan_activity_id: number, student_id: number = null): Observable<any> {
        let params = new HttpParams();

        if (student_id) {
            params = params.set('student_id', student_id.toString());
        }

        return this.http.post<Dto>(this.api.concat('nopbai/', class_plan_activity_id.toString()), {}, { params: params }).pipe(
            map(res => res)
        );
    }
}
