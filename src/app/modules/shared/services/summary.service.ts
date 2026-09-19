import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {Dto} from "@core/models/dto";
import {ClassManagementGvcn} from "@shared/services/class-management-gvcn.service";
import {ClassManagement} from "@shared/services/class-management.service";
import {TnStudent} from "@shared/models/tn-student";
import {ElngUserProfile} from "@shared/models/elng-user-profile";
import {Courses} from "@shared/services/courses.service";
import {Classes} from "@shared/models/classes";

export interface SummaryDasboadGiangvien {
    cham_tien_do:number;
    lop_hoc_phan:number;
    qua_so_buoi:number;
    tong_so_mon:number;
    tong_so_sv:number;
    tong_so_tiet:number;
}


export interface Smr_cn_nghi{
    class_id: number, student_id: number, tong: number
}
export interface Smr_cn_kodat{
    class_id: number, student_id: number, tong: number
}

export interface SummaryDasboadGVCN {
    management_gvcn:ClassManagementGvcn[];
    managements:ClassManagement[];
    students:ElngUserProfile[];
    buoinghi:Smr_cn_nghi[];
    khongdat: Smr_cn_kodat[],
}

export interface SummaryDashboadKhaothi {
    totalCourse: number,
    totalClass: number,
    totalStudents: number,
    totalShift: number,
    listCamthi: ElngUserProfile[]
    listBothi: ElngUserProfile[],
    listVipham: ElngUserProfile[]
    listDinhchi: ElngUserProfile[]
}

@Injectable({
  providedIn: 'root'
})
export class SummaryService {
    private readonly api = getRoute('summary/');


    constructor(
        private http: HttpClient,
        private httpParamsHelper: HttpParamsHeplerService,
        private themeSettingsService: ThemeSettingsService
    ) {
    }

    getDasboarhGiangvien(namhoc:string,hocky: number ): Observable<SummaryDasboadGiangvien> {
        const fromObject = {
            namhoc: namhoc,
            hocky: hocky,
        }
        const params = this.httpParamsHelper.paramsConditionBuilder([], new HttpParams({fromObject}));
        return this.http.get<Dto>(this.api +'dashboard-teacher', {params}).pipe(map(res => res.data));

    }
    getDasboarhGvcn(namhoc:string,hocky: number ): Observable<SummaryDasboadGVCN> {
        const fromObject = {
            namhoc: namhoc,
            hocky: hocky,
        }
        const params = this.httpParamsHelper.paramsConditionBuilder([], new HttpParams({fromObject}));
        return this.http.get<Dto>(this.api +'dashboard-chunhiem', {params}).pipe(map(res => res.data));

    }
    getDasboarhkhaothi(namhoc:string,hocky: number ): Observable<SummaryDashboadKhaothi> {
        const fromObject = {
            namhoc: namhoc,
            hocky: hocky,
        }
        const params = this.httpParamsHelper.paramsConditionBuilder([], new HttpParams({fromObject}));
        return this.http.get<Dto>(this.api +'dashboard-khaothi', {params}).pipe(map(res => res.data));

    }
    getKhaothiKetquathi(namhoc:string,hocky: number,donvi_id?:number,parent_id?:number ): Observable<Courses[]> {
        const object = {
            namhoc: namhoc,
            hocky: hocky,
        }

        const fromObject = {...object,donvi_id,parent_id};
        const params = this.httpParamsHelper.paramsConditionBuilder([], new HttpParams({fromObject}));
        return this.http.get<Dto>(this.api +'khaothi-ketquathi', {params}).pipe(map(res => res.data));
    }

    getBietdoPhodiem(object:any ): Observable<Classes[]> {
        const fromObject = object

        const params = this.httpParamsHelper.paramsConditionBuilder([], new HttpParams({fromObject}));
        return this.http.get<Dto>(this.api +'khaothi-bieudo-phodiem', {params}).pipe(map(res => res.data));
    }
}
