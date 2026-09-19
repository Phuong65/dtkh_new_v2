import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Classes } from '../models/classes';
import { Dto } from '@core/models/dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

export interface MeetingClass {
    id: number;
    class_id: number;
    password: string;
    title: string;
    meeting_number: string;
    start_time: string;
    time: number;
    student_number: number;
    creator_id: number;
    status: number;
    created_at: Date;
    updated_at: Date;
}

export interface LOPHOCPHAN_ICTU {
    ID_LopHP: number;
    TenHP: string; // tên lớp học phần có dạng "Quản trị hệ thống(4TX CNTT K22C1,G4 HK1)"
    MaLopHP: string; // mã lớp học phần string có dạng NRS131-1-25 (K23.TKĐH.K1.D1.N03) chỉ lấy cái trong ngoặc đơn
    LopTH: string; // "LT" | "TH" | "LT-TH",
    MaGV: string, // mã giảng viên dạy lớp học phần có dạng "emailgv1_magv1;emailgv2_magv2;emailgv3_magv3"
    MaTG: string, // mã trợ giảng dạy lớp học phần có dạng "emailtg1_matg1;emailtg2_matg2;emailtg3_matg3"
    MaMonhoc: string,// mã môn học có dạng "NRS131" tương ứng với maso trong ElnKhoaHoc
    SOTC: number, // số tín chỉ của môn học
    HTT: number,
    Namhoc: string,// năm học có dạng "2025-2026",
    Hocky: number,
    Dot: number,
    Khoa_hoc: string,// khóa học có dạng "22"
}

export interface DanhSachSinhVienLopHocPhan_ICTU {
    MaSV: string;// mã sinh viên có dạng "DTC09M1230033",
    Ho_ten: string;
}

export interface CALENDAR_ICTU {
    IDlophp: number,
    MaLopHP: string// mã lớp học phần string có dạng NRS131-1-25 (K23.TKĐH.K1.D1.N03) chỉ lấy cái trong ngoặc đơn
    Tenlophp: string// tên lớp học phần có dạng "Quản trị hệ thống(4TX CNTT K22C1,G4 HK1)"
    Monhoc: string // tên môn học
    Ngaygiangday: string // dạng "7/7/2025 12:00:00 AM",
    Giangduong: string //phòng học
    Tuanthu: number,// tuần học
    Tietbatdau: number,// tiết bắt đầu học
    Tietketthuc: number,// tiết kết thúc
    MaGV: string, // mã giảng viên
    Hotengv: string // tên giảng viên
}

@Injectable({
    providedIn: 'root'
})

export class ClassesService {
    api = getRoute('class/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    getAllDataClasses(): Observable<Classes[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    getAllDataClassesByUserTeach(user_id: number): Observable<Classes[]> {
        return this.http.get<Dto>(this.api.concat('?condition=manager_ids,like,', user_id.toString())).pipe(
            map(res => res.data)
        );
    }

    createDataClasses(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateDataClasses(id: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(
            map(res => res.data)
        );
    }

    deleteDataClasses(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getDataClassesByCol(col: string, item: any): Observable<Classes[]> {
        const by = new HttpParams().set('include', item).set("include_by", col).set("limit", "-1");
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getDataClassesByColAndLimit(col: string, item: any, start: number, limit: number): Observable<Classes[]> {
        const filter = new HttpParams().set(col, item).set('orderby', 'id').set('order', 'DESC').set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getDataClassesByLimit(start: number, limit: number): Observable<Classes[]> {
        const filter = new HttpParams().set('orderby', 'id').set('order', 'DESC').set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getPluckClassesByCol(): Observable<Classes[]> {
        const filter = new HttpParams().set('pluck', 'hocky,namhoc');
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getTnClassesByItem(item: string, col: string): Observable<Classes[]> {
        const by = new HttpParams().set('include', item).set("include_by", col).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getClassesByCols(condition: HttpParams): Observable<Classes[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getClassPage(start: number, limit: number): Observable<Classes[]> {
        const filter = new HttpParams().set('condition', 'status,<>,-1,and').set('orderby', 'id').set('order', 'DESC').set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getClassPageByCol(start: number, limit: number, col: string, item: any): Observable<Classes[]> {
        const filter = new HttpParams().set('condition', 'status,<>,-1,and').set(col, item).set('orderby', 'id').set('order', 'DESC').set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getClasses(id_classes: string, pluck: string = ''): Observable<Classes[]> {
        const options = pluck ? { params: new HttpParams().set('pluck', pluck) } : {};
        return this.http.get<Dto>(''.concat(this.api, id_classes), options).pipe(map(res => res.data));
    }

    getClassesByPageNew(option: ConditionOption): Observable<{ data: Classes[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getClassesByIctu(Nam_hoc: string, Hoc_ky: number, Dot: string): Observable<LOPHOCPHAN_ICTU[]> {
        return this.http.post<Dto>(this.api.concat('lop-hoc-phan'), { Hoc_ky: Hoc_ky, Nam_hoc: Nam_hoc, Dot: Dot }).pipe(
            map(res => res.Content)
        );
    }

    getStudentClassesByIctu(sync_class_id: number): Observable<DanhSachSinhVienLopHocPhan_ICTU[]> {
        return this.http.post<Dto>(this.api.concat('sv-lop-hoc-phan'), { ID_LopHP: sync_class_id }).pipe(
            map(res => res.Content)
        );
    }

    getCalendarByIctu(Nam_hoc: string, Hoc_ky: number, Dot: string): Observable<CALENDAR_ICTU[]> {
        return this.http.post<Dto>(this.api.concat('lich-giang-day'), { Hoc_ky: Hoc_ky, Nam_hoc: Nam_hoc, Dot: Dot }).pipe(
            map(res => res.Content)
        );
    }
}
