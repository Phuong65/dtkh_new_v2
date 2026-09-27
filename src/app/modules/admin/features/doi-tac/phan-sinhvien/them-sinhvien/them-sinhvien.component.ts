import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {User} from "@core/models/user";
import {InputTextModule} from "primeng/inputtext";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";
import {DoitacSinhvienService, PartnerStudents} from "@shared/services/doitac-sinhvien.service";
import {NotificationService} from "@core/services/notification.service";
import {forkJoin, Observable, of, switchMap} from "rxjs";
import {ElngUserProfile} from "@shared/models/elng-user-profile";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {TableModule} from "primeng/table";
import {SharedModule} from "@shared/shared.module";
import {PaginatorModule} from "primeng/paginator";
import {BUTTON_CANCEL, BUTTON_CONFIRMED, BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import * as XLSX from "xlsx";
import {MatTooltipModule} from "@angular/material/tooltip";
import {map} from "rxjs/operators";
import {CheckboxModule} from "primeng/checkbox";
import {TooltipModule} from "primeng/tooltip";

type AOA = any[][];

@Component({
    selector: 'app-them-sinhvien',
    standalone: true,
    imports: [CommonModule, FormsModule, RippleModule, ButtonModule, InputTextModule, MatProgressBarModule, SharedModule, TableModule, PaginatorModule, MatTooltipModule, CheckboxModule, TooltipModule],
    templateUrl: './them-sinhvien.component.html',
    styleUrls: ['./them-sinhvien.component.css']
})
export class ThemSinhvienComponent implements OnInit {

    @Input() set doitac(item: User) {
        this.doitacSelect = item;

        this.getKhoaDaotao()

        this.dataImport = [];
        this.file_name = '';
    }


    typeAdd: 'search' | 'import' = 'search';
    doitacSelect: User;

    // search_page:number = 1;
    // search_dataView :ElngUserProfile[];

    objectSearch: {
        dataView: ElngUserProfile[],
        dataSelect: ElngUserProfile[],
        recordTotal: number,
        khoadaotao_select: string,
        textSearch: string,
        page: number
    } = {
        dataView: [],
        dataSelect: [],
        recordTotal: 0,
        khoadaotao_select: '',
        textSearch: '',
        page: 1
    }

    limit: number = 20;

    typeView: 'loading' | 'waiting' | 'viewSearch' | 'viewImport' | 'error' = 'waiting';

    listKhoadaotao: ElngUserProfile[] = [];

    file_name: string = ''


    constructor(
        private elngUserProfileService: ElngUserProfileService,
        private doitacSinhvienService: DoitacSinhvienService,
        private notifi: NotificationService
    ) {
    }

    ngOnInit(): void {
    }

    reload() {
        this.getKhoaDaotao()
    }


    changeObjectType(type: 'search' | 'import') {
        this.typeView = type == 'search' ? "viewSearch" : "viewImport";
        this.typeAdd = type;

        this.objectSearch = {
            dataView: [],
            dataSelect: [],
            recordTotal: 0,
            khoadaotao_select: '',
            textSearch: '',
            page: 1
        }
    }

    getKhoaDaotao() {
        this.notifi.isProcessing(true);
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'teacher',
                    condition: OvicQueryCondition.notEqual,
                    value: '1'
                }
            ],
            page: '1',
            set: [
                {label: 'limit', value: '-1'},
                {label: 'groupby', value: 'khoadaotao'},
                {label: 'select', value: 'id,khoadaotao'},
                {label: 'orderby', value: 'khoadaotao'},
                {label: 'order', value: 'DESC'},
            ]
        }

        this.elngUserProfileService.getUserProfileByPageNewV2(condition).subscribe({
            next: ({data}) => {
                this.listKhoadaotao = data;
                this.changeObjectType('search');
                this.notifi.isProcessing(false);
            },
            error: () => {
                this.notifi.isProcessing(false);
                this.notifi.toastError('Load dữ liệu ko thành công');
            }
        })
    }

    onChangedrdKhoa(event) {
        this.objectSearch.dataSelect = [];

        this.objectSearch.khoadaotao_select = event['khoadaotao'];
        this.objectSearch.page = 1;
        this.objectSearch.recordTotal = 0;


        this.getDataByTypeSearch()
    }

    onchangePageBySearch(page) {
        this.objectSearch.dataSelect = [];
        this.objectSearch.page = page + 1;
        this.objectSearch.recordTotal = 0;

        this.getDataByTypeSearch()
    }

    searchByinput(event) {
        this.objectSearch.textSearch = event;
        this.objectSearch.page = 1;
        this.getDataByTypeSearch()
    }

    getDataByTypeSearch() {

        this.typeView = 'loading';

        const condi: ConditionOption = {
            condition: [],
            page: this.objectSearch.page.toString(),
            set: [
                {label: 'limit', value: '20'},
                {label: 'partner', value: this.objectSearch.textSearch},
            ]

        };
        condi.condition.push(
            {
                conditionName: 'teacher',
                condition: OvicQueryCondition.notEqual,
                value: '1',
                orWhere: 'and'
            })
        if (this.objectSearch.khoadaotao_select) {
            condi.condition.push(
                {
                    conditionName: 'khoadaotao',
                    condition: OvicQueryCondition.equal,
                    value: this.objectSearch.khoadaotao_select,
                    orWhere: 'and'
                }
            )
        }
        // if(this.objectSearch.textSearch){
        //     condi.condition.push(
        //         {
        //             conditionName:'student_code',
        //             condition:OvicQueryCondition.like,
        //             value: `%${this.objectSearch.textSearch}%`,
        //             orWhere:'or'
        //         },
        //         {
        //             conditionName:'full_name',
        //             condition:OvicQueryCondition.like,
        //             value: `%${this.objectSearch.textSearch}%`,
        //             orWhere:'or'
        //         },)
        // }

        this.elngUserProfileService.getUserProfileByPageNewV2(condi).pipe(switchMap(m => {
            if (m.data.length == 0) {
                return forkJoin([of(m), of([])])
            }
            const student_ids = m.data.map(a => a.student_code);

            return forkJoin([of(m), this.loopGetDoitacThisinh(1, 20, student_ids, [])])

        })).subscribe({
            next: ([students, studentBydoitac]) => {

                const notIdUser = studentBydoitac.map(m => m['student_id'])
                this.objectSearch.recordTotal = students.recordsFiltered;
                this.objectSearch.dataView = students.data.length > 0 ? students.data.map(m => {
                    m['checkByPartner'] = notIdUser.includes(m.id);
                    return m;
                }) : students.data;
                this.typeView = "viewSearch";
            }, error: () => {
                this.notifi.toastError('Load dữ liệu không thành công');
                this.typeView = "error";

            }
        })
    }

    private loopGetDoitacThisinh(page: number, limit: number, ids: any[], data: PartnerStudents[]): Observable<PartnerStudents[]> {
        const start = (page - 1) * limit;
        const end = start + limit

        if ((page == 0 ? limit : limit * page) < ids.length) {
            const ids_select = ids.slice(start, end);
            const conditionDm: ConditionOption = {
                condition: [
                    {
                        conditionName: 'student_code',
                        condition: OvicQueryCondition.equal,
                        value: ids_select.toString(),
                        orWhere: 'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value: ids_select.length.toString(),}
                ]
            }
            return this.doitacSinhvienService.getDataByPageNew(conditionDm).pipe(switchMap(a => {
                return this.loopGetDoitacThisinh(page + 1, limit, ids, data.concat(a.data))
            }))

        } else {
            const ids_select = ids.slice(start, end);
            const conditionDm: ConditionOption = {
                condition: [
                    {
                        conditionName: 'student_code',
                        condition: OvicQueryCondition.equal,
                        value: ids_select.toString(),
                        orWhere: 'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value: ids_select.length.toString(),}
                ]
            }
            return this.doitacSinhvienService.getDataByPageNew(conditionDm).pipe(switchMap(a => {
                return of(data.concat(a.data))
            }))
        }
    }

    changeallBySearch(event) {

        if (event.checked === true) {
            this.objectSearch.dataSelect = this.objectSearch.dataView.filter(f => !f['checkByPartner']);
        } else {
            this.objectSearch.dataSelect = [];
        }
        // this.objectSearch.dataSelect = this.objectSearch.dataView.filter(f=>f['checkByPartner'] );
    }

    async btnViewAddBySearch() {

        if (this.objectSearch.dataSelect.length == 0) {
            return this.notifi.toastWarning('Vui lòng chọn sinh viên');
        }

        const html = `Xác nhận thêm ${this.objectSearch.dataSelect.length} sinh viên quản lý cho ${this.doitacSelect.display_name} ?`;
        const btn = await this.notifi.confirm(html, 'Thông báo', [BUTTON_YES, BUTTON_NO]);

        if (btn.name == 'yes') {
            const step: number = 100 / this.objectSearch.dataSelect.length;

            this.notifi.loadingAnimationV2({process: {percent: 0}});
            this.loopAddBySearch(this.objectSearch.dataSelect, step, 0).subscribe({
                next: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.disableLoadingAnimationV2();

                    this.notifi.toastSuccess('Thao tác thành công');
                    this.typeView = "viewSearch";
                    this.objectSearch = {
                        dataView: [],
                        page: 1,
                        textSearch: '',
                        khoadaotao_select: '',
                        dataSelect: [],
                        recordTotal: 0
                    }
                }, error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.disableLoadingAnimationV2();
                    this.notifi.toastError('Thao tác không thành công, mất kết nối với máy chủ');
                }
            })
        }

    }

    private loopAddBySearch(data: any[], step: number, percent: number) {

        const index = data.findIndex(f => !f['isAdd']);
        if (index !== -1) {

            const item = {
                doitac_id: this.doitacSelect.id,
                student_id: data[index].id,
                full_name: data[index]['full_name'],
                student_code: data[index]['student_code'],
                khoadaotao: data[index]['khoadaotao']
            }
            const newPercent: number = percent + step;
            return this.doitacSinhvienService.add(item).pipe(switchMap(m => {

                    data[index]['isAdd'] = true;
                    this.notifi.loadingAnimationV2({process: {percent: newPercent}})
                    return this.loopAddBySearch(data, step, newPercent);
                }
            ))
        } else {
            return of('comple');
        }

    }

    //------------------------ import sinhvien------------------------

    dataImport: any[] = [];
    dataImportClone: any[] = [];
    errorFileType: boolean = false;
    loading: boolean = false;

    inputFile() {
        const inputFile: HTMLInputElement = Object.assign(document.createElement('input'), {
            type: 'file',
            accept: '.xlsx',
            multiple: false,
            onchange: () => {
                this.onDroppedFiles(inputFile.files);


                setTimeout(() => inputFile.remove(), 1000)
            }
        });
        inputFile.click();

    }

    onDroppedFiles(fileList: FileList) {
        const file: File = fileList.item(0);
        this.file_name = file.name;
        this.errorFileType = !(file && this.validateExcelFile(file));
        if (!this.errorFileType) {
            this.loading = true;

            const reader: FileReader = new FileReader();
            reader.onload = (e: any) => {
                /* read workbook */
                const wb: XLSX.WorkBook = XLSX.read(e.target.result, {type: 'binary'});

                let arrData = [];
                for (let i = 0; i < 6; i++) {
                    const sheetNameSelect = wb.SheetNames[i];
                    const ws: XLSX.WorkSheet = wb.Sheets[sheetNameSelect];
                    const rawData: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1, raw: true}));
                    const filterData = rawData.filter(u => !!(Array.isArray(u) && u.length));
                    filterData.shift();

                    if (filterData.length > 0) {
                        const arr = this.covertDataExport(filterData);
                        arrData = [].concat(...arrData, arr);
                    }
                }
                this.dataImport = arrData;

                if (this.dataImport.length > 0) {
                    this.notifi.isProcessing(true);

                    this.loopCheckDataImport(this.dataImport, 50, 1, []).pipe(
                        switchMap(dataCheck => {
                            // Khi hàm đầu tiên chạy xong, mới chạy hàm thứ 2
                            return this.loopCheckDataPartnerImport(this.dataImport, 50, 1, []).pipe(
                                map(dataPartner => {
                                    // Trả về cả 2 kết quả để dùng ở subscribe
                                    return {dataCheck, dataPartner};
                                })
                            );
                        })
                    ).subscribe({
                        next: ({dataCheck, dataPartner}) => {

                            this.dataImport = this.dataImport.map(m => {
                                m['checkByPartner'] = dataPartner.length === 0
                                    ? false
                                    : !!dataPartner.some(f => f.student_code === m['student_code']);

                                m['_infoStudent'] = dataCheck.find(f => f.student_code === m['student_code']) || null;

                                return m;
                            });

                            this.notifi.isProcessing(false);
                        },
                        error: (err) => {
                            console.error('Lỗi khi kiểm tra dữ liệu:', err);
                            this.notifi.isProcessing(false);
                            this.notifi.toastError('Kiểm tra dữ liệu không thành công');
                        }
                    });
                }


            };
            reader.readAsBinaryString(file);
        } else {
            this.errorFileType = true;
            this.loading = false;
        }

    }

    covertDataExport(datafile: any,) {
        const data: any[] = [];

        datafile.forEach(row => {
            const cell = {
                stt: row[0],
                student_code: row[1].trim(),
                full_name: row[2],
                birthday: row[3],
                gender: row[4],
                khoadaotao: row[5],

            }

            data.push(cell)
        })

        return data;


    }

    validateExcelFile(file: File): boolean {
        const ext = file.name?.split('.').pop()?.toLowerCase();
        return ['xlsx', 'xls'].includes(ext || '');
    }

    convertDateByXlsx(excelDate: number): string {
        const date = XLSX.SSF.parse_date_code(excelDate);
        return date.y + '-' + (date.m < 10 ? '0' + date.m : date.m) + '-' + (date.d < 10 ? '0' + date.d : date.d)
            ;
    }


    private loopCheckDataImport(data: any[], limit: number, page: number, arrOut: ElngUserProfile[]): Observable<ElngUserProfile[]> {

        const start = (page - 1) * limit;
        const end = start + limit

        if ((page == 0 ? limit : limit * page) < data.length) {
            const studentCode_get = data.map(m => m.student_code).slice(start, end);
            const conditionDm: ConditionOption = {
                condition: [
                    {
                        conditionName: 'student_code',
                        condition: OvicQueryCondition.like,
                        value: studentCode_get.toString(),
                        orWhere: 'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value: studentCode_get.length.toString(),},
                    {label: 'select', value: 'id,full_name,student_code,khoadaotao',}
                ]
            }
            return this.elngUserProfileService.getUserProfileByPageNewV2(conditionDm).pipe(switchMap(a => {
                return this.loopCheckDataImport(data, limit, page + 1, arrOut.concat(a.data))
            }))

        } else {
            const studentCode_get = data.map(m => m.student_code).slice(start, end);
            const conditionDm: ConditionOption = {
                condition: [
                    {
                        conditionName: 'student_code',
                        condition: OvicQueryCondition.like,
                        value: studentCode_get.toString(),
                        orWhere: 'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value: studentCode_get.length.toString()},
                    {label: 'select', value: 'id,student_code,full_name,khoadaotao'},
                ]
            }

            return this.elngUserProfileService.getUserProfileByPageNewV2(conditionDm).pipe(switchMap(a => {
                return of(arrOut.concat(a.data))
            }))
        }

    }

    private loopCheckDataPartnerImport(data: any[], limit: number, page: number, arrOut: PartnerStudents[]): Observable<PartnerStudents[]> {

        const start = (page - 1) * limit;
        const end = start + limit

        if ((page == 0 ? limit : limit * page) < data.length) {
            const studentCode_get = data.map(m => m.student_code).slice(start, end);
            const conditionDm: ConditionOption = {
                condition: [
                    {
                        conditionName: 'student_code',
                        condition: OvicQueryCondition.equal,
                        value: studentCode_get.toString(),
                        orWhere: 'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value: studentCode_get.length.toString(),},
                    {label: 'select', value: 'id,student_code,full_name'},

                ]
            }
            return this.doitacSinhvienService.getDataByPageNew(conditionDm).pipe(switchMap(a => {
                return this.loopCheckDataPartnerImport(data, limit, page + 1, arrOut.concat(a.data))
            }))

        } else {
            const studentCode_get = data.map(m => m.student_code).slice(start, end);
            const conditionDm: ConditionOption = {
                condition: [
                    {
                        conditionName: 'student_code',
                        condition: OvicQueryCondition.like,
                        value: studentCode_get.toString(),
                        orWhere: 'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value: studentCode_get.length.toString(),},
                    {label: 'select', value: 'id,student_code,full_name'},
                ]
            }

            return this.doitacSinhvienService.getDataByPageNew(conditionDm).pipe(switchMap(a => {
                return of(arrOut.concat(a.data))
            }))
        }

    }


    async btnSubmitImport() {
        if (this.dataImport.length === 0) {
            return this.notifi.toastError('Không có danh sách sinh viên hợp lệ');
        }


        const html = `<p>Xác nhận tải lên danh sách sinh viên do ${this.doitacSelect.display_name} quản lý ?</p>
            <p>- danh sách sinh viên có <span style="color:#0caa30; font-weight: 500">${this.dataImport.filter(f => !f['checkByPartner']).length}</span> hợp lệ </p>
            <p>- danh sách sinh viên có <span style="color:red; font-weight: 500">${this.dataImport.filter(f => f['checkByPartner']).length}</span> không hợp lệ </p>
        `
        const btn = await this.notifi.confirm(html, 'Xác nhận tải lên ', [BUTTON_YES, BUTTON_CANCEL])

        if (btn.name == 'yes') {

            const step: number = 100 / this.dataImport.filter(f => !f['checkByPartner'] && f['_infoStudent'] !== null).length;

            this.notifi.loadingAnimationV2({process: {percent: 0}});
            this.loopAddByImport(this.dataImport.filter(f => !f['checkByPartner'] && f['_infoStudent'] !== null), step, 0).subscribe({
                next: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.disableLoadingAnimationV2();

                    this.notifi.toastSuccess('Thao tác thành công');
                    this.dataImport = [];
                    this.file_name = '';
                }, error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.disableLoadingAnimationV2();
                    this.notifi.toastError('Thao tác không thành công, mất kết nối với máy chủ');
                }
            })

        }


    }


    private loopAddByImport(data: any[], step: number, percent: number): Observable<any> {

        const index = data.findIndex(f => !f['isAdd']);
        if (index !== -1) {
            const item = {
                doitac_id: this.doitacSelect.id,
                student_id: data[index]['_infoStudent']['id'],
                full_name: data[index]['_infoStudent']['full_name'],
                student_code: data[index]['_infoStudent']['student_code'],
                khoadaotao: data[index]['_infoStudent']['khoadaotao']
            }
            return this.doitacSinhvienService.add(item).pipe(switchMap(m => {
                    const newPercent: number = percent + step;

                    data[index]['isAdd'] = true;
                    this.notifi.loadingAnimationV2({process: {percent: newPercent}})
                    return this.loopAddByImport(data, step, newPercent);
                }
            ))
        } else {
            return of('comple');
        }

    }

    btnResetForm() {
        this.dataImport = [];
        this.file_name = '';
    }

}
