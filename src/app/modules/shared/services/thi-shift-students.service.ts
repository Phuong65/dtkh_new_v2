import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ThiShiftStudents } from '../models/thi-shift-students';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ThiShiftStudentsService {

    api = getRoute('thi-shift-students/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addThiShiftStudents(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateThiShiftStudents(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllThiShiftStudents(): Observable<ThiShiftStudents[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteThiShiftStudents(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteThiShiftStudentsByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateThiShiftStudentsByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getThiShiftStudentsByPageNew(option: ConditionOption): Observable<{ data: ThiShiftStudents[], recordsFiltered: number }> {
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

    layde(class_plan_activity_id: number, av: number = 0): Observable<any> {
        return this.http.post<Dto>(this.api.concat('layde/', class_plan_activity_id.toString()), {}).pipe(
            map(res => res)
        );
    }

    passCode(shift_id: number, room: string, shift_studnet_id: number = null): Observable<any> {
        let params = new HttpParams().set('room', room);

        if (shift_studnet_id) {
            params = params.set('id', shift_studnet_id.toString());
        }
        return this.http.post<Dto>(this.api.concat('passcode/', shift_id.toString()), {}, { params: params }).pipe(
            map(res => res)
        );
    }

    nopbai(shift_studnet_id: number = null): Observable<any> {
        return this.http.post<Dto>(this.api.concat('nopbai/', shift_studnet_id.toString()), {}).pipe(
            map(res => res)
        );
    }

    nopBaiAll(data: { shift_id: number, room: string }): Observable<any> {
        return this.http.post<Dto>(this.api.concat('nopbai'), data).pipe(
            map(res => res)
        );
    }

    lockLogin(data: { shift_id: number, room: string, shift_student_id?: number, expires: number }) {
        let params = new HttpParams().set('room', data.room);

        if (data.shift_student_id) {
            params = params.set('id', data.shift_student_id.toString());
        }
        return this.http.post<Dto>(this.api.concat('khoa-dang-nhap/', data.shift_id.toString()), { expires: data.expires }, { params: params }).pipe(
            map(res => res)
        );
    }

    unLockLogin(shift_id: number, room: string, shift_studnet_id: number = null) {
        let params = new HttpParams().set('room', room);

        if (shift_studnet_id) {
            params = params.set('id', shift_studnet_id.toString());
        }
        return this.http.post<Dto>(this.api.concat('mo-dang-nhap/', shift_id.toString()), {}, { params: params }).pipe(
            map(res => res)
        );
    }

    // https://apps.ictu.edu.vn:9087/ionline/api/thi-shift-students/khoa-dang-nhap/:shift_id
    // https://apps.ictu.edu.vn:9087/ionline/api/thi-shift-students/mo-dang-nhap/:shift_id
}
