import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicQueryCondition } from '@core/models/dto';
import { ElnBaiHoc } from '../models/elng-bai-hoc';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { NotificationService } from '@core/services/notification.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ElnBaiHocService {

    private readonly api = getRoute('lessons/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private noitify: NotificationService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addElnBaiHoc(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateElnBaiHoc(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }


    getAllElnBaiHoc(): Observable<ElnBaiHoc[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteElnBaiHoc(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getElnBaiHocByCol(col: string, item: any): Observable<ElnBaiHoc[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getElnBaiHocByCols(condition: HttpParams): Observable<ElnBaiHoc[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(map(res => res.data));
    }

    // getElnBaiHocByCols_re(condition: HttpParams, data: ElnBaiHoc[]): Observable<ElnBaiHoc[] | Observable<any>> {
    //     return this.http.get<Dto>(this.api, { params: condition }).pipe(map(res => {
    //         if (res.data.length > 0) {
    //             return this.getElnBaiHocByCols_re(condition, res.data.concat(data))
    //         } else {
    //             return data;
    //         }
    //     }));
    // }

    getLessonsByCourseId(courseId: number, select: string = null): Observable<ElnBaiHoc[]> {
        if (!courseId) {
            this.noitify.toastWarning('Thông tin  truy vấn không chính xác vui lòng kiểm tra lại');
            return of([]);
        }
        const _preSet = select ? new HttpParams().set('select', select) : new HttpParams();
        const params = this.httphelper.paramsConditionBuilder([
            {
                conditionName: 'course_id',
                condition: OvicQueryCondition.equal,
                value: courseId.toString()
            },
            {
                conditionName: 'status',
                condition: OvicQueryCondition.equal,
                value: '1',
                orWhere: 'and'
            }
        ], _preSet).set('orderby', 'ordering').set('order', 'ASC');
        return this.http.get<Dto>(this.api, { params: params }).pipe(
            map(res => res.data)
        );
    }

    deleteLessonsByCol(col: string, ids: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(ids), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getLessonByPageNew(option: ConditionOption): Observable<{ data: ElnBaiHoc[], recordsFiltered: number }> {
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
