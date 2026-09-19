import { Injectable } from '@angular/core';
import { getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ClassPlanActivityStudentTests } from '../models/class-plan-activity-student-tests';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ClassPlanActivityStudentTestsService {

    api = getRoute('class-plan-activity-student-tests/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addClassPlanActivityStudentTests(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivityStudentTests(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassPlanActivityStudentTests(): Observable<ClassPlanActivityStudentTests[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivityStudentTests(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteClassPlanActivityStudentTestsByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateClassPlanActivityStudentTestsByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getClassPlanActivityStudentTestsByPageNew(option: ConditionOption): Observable<{ data: ClassPlanActivityStudentTests[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }


    getDataByClassIdAndStudentIds(class_id: number, student_ids: number[], select?: string, type?: string): Observable<ClassPlanActivityStudentTests[]> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: class_id.toString(),
                orWhere: 'and'
            },
            {
                conditionName: 'status',
                condition: OvicQueryCondition.equal,
                value: '1',
                orWhere: 'and'
            },
            {
                conditionName: 'student_id',
                condition: OvicQueryCondition.equal,
                value: student_ids.join(','),
                orWhere: 'in'
            },

        ];

        if (type) {
            conditions.push({
                conditionName: 'type',
                condition: OvicQueryCondition.equal,
                value: type
            },)
        }
        const fromObject = {
            limit: -1,
            paged: 1,
            // include: student_ids.join(','),
            // include_by: 'student_id',
            select: select ? select : null,
            order: 'ASC',
            orderby: 'id'
        }
        const params = this.httphelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res ? res.data : []));

    }
    getDataByClassIdAndStudentIdsNotType(class_id: number, student_ids: number[], select?: string, type?: string): Observable<ClassPlanActivityStudentTests[]> {
        const conditions: OvicConditionParam[] = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: class_id.toString(),
                orWhere: 'and'
            },
            {
                conditionName: 'passed',
                condition: OvicQueryCondition.equal,
                value: '1',
                orWhere: 'and'
            },
            {
                conditionName: 'student_id',
                condition: OvicQueryCondition.equal,
                value: student_ids.join(','),
                orWhere: 'in'
            },

        ];

        if (type) {
            conditions.push({
                conditionName: 'type',
                condition: OvicQueryCondition.notEqual,
                value: type
            },)
        }
        const fromObject = {
            limit: -1,
            paged: 1,
            // include: student_ids.join(','),
            // include_by: 'student_id',
            select: select ? select : null,
            order: 'ASC',
            orderby: 'id'
        }
        const params = this.httphelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res ? res.data : []));

    }

    closedAllTest(data: { class_id: number, week: number }): Observable<any> {
        return this.http.post<Dto>(this.api.concat('dong-bai-kiem-tra'), data).pipe(
            map(res => res.data)
        );
    }

    phanBodeKtDaugio(data: { course_id: number, class_id: number, week: number, av: number, student_id?: number }): Observable<any> {
        return this.http.post<Dto>(this.api.concat('kiem-tra-dau-gio'), data).pipe(
            map(res => res.data)
        );
    }

    openAllTest(data: { class_id: number, week: number }): Observable<any> {
        return this.http.post<Dto>(this.api.concat('mo-bai-kiem-tra'), data).pipe(
            map(res => res.data)
        );
    }

    nopBaiAllTest(data: { class_id: number, week: number }): Observable<any> {
        return this.http.post<Dto>(this.api.concat('nopbai-all'), data).pipe(
            map(res => res.data)
        );
    }

    nopBaiOne(id: number): Observable<any> {
        return this.http.post<Dto>(this.api.concat('yeu-cau-nop-bai/', id.toString()), {}).pipe(
            map(res => res.data)
        );
    }

    replaceKtDaugioToKtTuan(class_id: number, week: number, created_by: number): Observable<any> {


        const fromObject = {
            class_id: class_id,
            created_by: created_by,
            week: week,
        }
        const params = this.httphelper.paramsConditionBuilder([], new HttpParams({ fromObject }));
        return this.http.delete<Dto>(this.api + 'kiem-tra-dau-gio', { params }).pipe(map(res => res.data));
    }

    sinhdeTuluan15P(data: { course_id: number, class_id: number, week: number, av: number, student_id?: number }): Observable<any> {
        return this.http.post<Dto>(this.api.concat('sinhde-tuluan-15'), data).pipe(
            map(res => res.data)
        );
    }

    chamBaiTuluan(id: number, data: { point_tuluan: number, max_tracnghiem: number }): Observable<any> {
        return this.http.post<Dto>(this.api.concat('cham-bai-tu-luan/', id.toString()), data).pipe(
            map(res => res.data)
        );
    }
}
