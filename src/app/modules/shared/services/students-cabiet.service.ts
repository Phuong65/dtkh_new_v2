import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HelperService} from "@core/services/helper.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {Observable} from "rxjs";
import {Dto} from "@core/models/dto";
import {map} from "rxjs/operators";
import {ThongBao} from "@shared/models/thong-bao";
import {ConditionOption} from "@shared/models/condition-option";
import {ElngUserProfile} from "@shared/models/elng-user-profile";

export interface StudentCabiet {
    id?:number;
    student_id:number;
    class_management_id:number;
    student_info: ElngUserProfile;
    status:number;
    user_id:number;
}
@Injectable({
  providedIn: 'root'
})
export class StudentsCabietService {


    api = getRoute('students-cabiet/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    add(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    update(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAll(): Observable<StudentCabiet[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    delete(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getDataByPageNew(option: ConditionOption): Observable<{ data: StudentCabiet[], recordsFiltered: number }> {
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
