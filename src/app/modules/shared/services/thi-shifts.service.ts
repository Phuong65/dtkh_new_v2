import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { Injectable } from '@angular/core';
import { environment, getRoute, key_server } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ThiShifts } from '../models/thi-shifts';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

export interface CathiNV { // ca thi lấy từ hệ thống Nam việt
    ID_thi: string; // id của hệ thống nam việt tương ứng với sync_cathi_id ở ThiShifts
    Hoc_ky: number; // tương ứng với hocky ở ThiShifts
    Nam_hoc: string; // tương ứng với namhoc ở ThiShifts
    Dot_thi: number; // tương ứng với dotthi ở ThiShifts 
    Mo_ta: string; // tương ứng vơi name ở ThiShifts
    Ngay_thi: string; // utc + 7
    Ky_hieu: string; // tương ứng vơi maso ở ElnKhoaHoc
    Hinh_thuc_thi: string; // hình thức thi
    TimeStart: string;// Ngay_thi + TimeStart = time_start ở ThiShifts,
    ID_hinh_thuc: number; // id của hệ thống nam việt tương ứng với hình thức thi
    kyhieu_cathi: string; // ký hiệu của ca thi
}

export interface CathiDetailNV { // thông tin thí sinh trong ca thi đó được lấy từ hệ thống Nam việt 
    ID_thi: string; // id của hệ thống nam việt tương ứng với sync_cathi_id ở ThiShifts
    Ma_sv: string; // tương ứng với student_code của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    Ho_ten: string;// tương ứng với full_name của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    Ten: string;// tương ứng với name của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    So_bao_danh: string;// tương ứng với sbd trong ThiShiftStudents
    So_phong: string; // tương ứng với room trong ThiShiftStudents
    Gioi_tinh?: string; // 
    Ngay_sinh?: string;  // utc + 7
    Ten_lop?: string;
}

export interface CathiRoomNV { // thông tin về phòng thi trong ca thi được lấy từ hệ thống Nam việt 
    ID_thi: string; // id của hệ thống nam việt tương ứng với sync_cathi_id ở ThiShifts
    So_phong: string; // tương ứng với room trong ThiShiftStudents
    Ma_cb_coi_thi1: string;  // tương ứng với student_code của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    Ma_cb_coi_thi2: string; // tương ứng với student_code của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    Email_coi_thi1: string;// tương ứng với email của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    Email_coi_thi2: string;// tương ứng với email của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    Giao_vien_coi_thi1: string; // tương ứng với full_name của  ElngUserProfile  from '../../shared/models/elng-user-profile';
    Giao_vien_coi_thi2: string;  // tương ứng với full_name của  ElngUserProfile  from '../../shared/models/elng-user-profile';
}

export interface CathiHinhthucthiNV { // thông tin về hình thức thi trong ca thi được lấy từ hệ thống Nam việt
    ID_hinh_thuc: number; // id của hệ thống nam việt tương ứng với hình thức thi
    Ky_hieu: string; // ký hiệu của hình thức thi
    Ten_hinh_thuc: string; // tên của hình thức thi
}

@Injectable({
    providedIn: 'root'
})

export class ThiShiftsService {

    api = getRoute('thi-shifts/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addThiShifts(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateThiShifts(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllThiShifts(): Observable<ThiShifts[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteThiShifts(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteThiShiftsByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateThiShiftsByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getThiShiftsByPageNew(option: ConditionOption): Observable<{ data: ThiShifts[], recordsFiltered: number }> {
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

    sinhdethuchanh(thi_shift: number, course_id: number, num_of_test: number): Observable<any> {
        let body: any = { course_id: course_id, num_of_test: num_of_test };
        return this.http.post<Dto>(this.api.concat('sinh-de-thuc-hanh/', thi_shift.toString()), body).pipe(
            map(res => res)
        );
    }

    dongBoCaThiIctu(hocky: number, namhoc: string, mamon: string): Observable<CathiNV[]> {
        return this.http.post<Dto>(this.api.concat('dong-bo-ca-thi'), { Hoc_ky: hocky, Nam_hoc: namhoc, Ky_hieu: mamon }).pipe(
            map(res => res.Content)
        );
    }

    dongBoCaThiIctuDetail(sync_cathi_id: string): Observable<CathiDetailNV[]> {
        return this.http.post<Dto>(this.api.concat('dong-bo-ca-thi-detail'), { ID_thi: sync_cathi_id }).pipe(
            map(res => res.Content)
        );
    }

    dongBoPhongthiIctuDetail(sync_cathi_id: string): Observable<CathiRoomNV[]> {
        return this.http.post<Dto>(this.api.concat('dong-bo-ca-thi-phong'), { ID_thi: sync_cathi_id }).pipe(
            map(res => res.Content)
        );
    }

    dongBohinhthucthiIctu(): Observable<any> {
        return this.http.post<Dto>(this.api.concat('dm-hinh-thuc-thi'), {}).pipe(
            map(res => res.Content)
        );
    }
}
