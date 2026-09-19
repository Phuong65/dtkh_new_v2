import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {Observable} from "rxjs";
import {Dto} from "@core/models/dto";
import {map} from "rxjs/operators";
import {ConditionOption} from "@shared/models/condition-option";

export interface PartnerStudents {
    id?: number;
    doitac_id:number;
    student_id:number;
    full_name:string;
    student_code:string;
    khoadaotao:number;
}
@Injectable({
  providedIn: 'root'
})
export class DoitacSinhvienService {
    api = getRoute('partner-students/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService,
    ) {
    }

    add(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    update(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }


    delete(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getDataByPageNew(option: ConditionOption): Observable<{ data: PartnerStudents[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    partnerCtdt(option: ConditionOption): Observable<any> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api +'ctdt-student/', { params: filter })
        ;


    }



}
// student_id:this._studentSelect.student_id,
//     doitac_id:this._studentSelect.doitac_id,
//     ctdt_id: this._studentSelect['_student']['ctdt_id']
