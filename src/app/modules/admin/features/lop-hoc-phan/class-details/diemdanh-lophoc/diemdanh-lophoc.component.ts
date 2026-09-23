import { ExportDiemthuongxuyenService } from '@shared/services/export-diemthuongxuyen.service';
import { CalendarService } from '@modules/shared/services/calendar.service';
import { NotificationService } from '@core/services/notification.service';
import { ClassStudentDiemdanhService } from '@shared/services/class-student-diemdanh.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Classes } from '@modules/shared/models/classes';
import { ClassStudent } from '@modules/shared/models/class-student';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin, filter } from 'rxjs';
import { ClassCalendar } from '@modules/shared/models/class-calendar';
import { ClassStudentDiemdanh } from '@modules/shared/models/class-student-diemdanh';
import { ExportExcelDiemdanhService } from '@modules/shared/services/export-excel-diemdanh';
import { APP_CONFIGS } from '@env';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { MatButtonModule } from '@angular/material/button';
import { TieredMenu, TieredMenuModule } from 'primeng/tieredmenu';
import { MenuItem } from 'primeng/api';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, PaginatorModule, TableModule, MatButtonModule, TieredMenuModule],
    selector: 'app-diemdanh-lophoc',
    templateUrl: './diemdanh-lophoc.component.html',
    styleUrls: ['./diemdanh-lophoc.component.css']
})
export class DiemdanhLophocComponent implements OnInit {
    @Input() classSelected: Classes;

    list_student: ClassStudent[];

    total_student: number = 0;

    limit_student: number = 20;

    search_student: string;

    search_student_html: string;

    cols_student: any[];

    list_calendar: ClassCalendar[];

    list_diemdanh: ClassStudentDiemdanh[];

    items: MenuItem[] = [
        { label: 'Phép', id: 'P' },
        { label: 'Muộn', id: 'M' },
        { label: 'Không phép', id: 'K' }
    ];

    insideMenu = false;

    selectB: ClassCalendar;

    tongsv: number = 0;

    pageIndex: number = 0;

    constructor(
        private classStudentDiemdanhService: ClassStudentDiemdanhService,
        private classStudentService: ClassStudentService,
        private notificationService: NotificationService,
        private calendarService: CalendarService,
        private exportExcelDiemdanhService: ExportExcelDiemdanhService
    ) {
        this.cols_student = [
            { label: '#', class: 'ovic-w-80px text-center', key: 'index_' },
            { label: 'Họ tên', class: 'ovic-w-200px text-left', key: 'full_name' },
        ];
    }



    ngOnInit(): void {
        this.initLoad();
    }

    initLoad() {
        const condition_diemdanh: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        const condition_calendar: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ngay' }
            ],
            page: null
        }


        const condition_class: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'limit', value: '1' },
            ],
            page: null,
        };

        this.notificationService.isProcessing(true);

        forkJoin([
            this.classStudentDiemdanhService.getClassStudentDiemdanhByPageNew(condition_diemdanh),
            this.calendarService.getCalendarByPageNew(condition_calendar),
            this.classStudentService.getClassStudentByPageNew(condition_class)
        ]).subscribe({
            next: ([_diemdanh, _calendar, _class]) => {
                this.notificationService.isProcessing(false);

                this.list_calendar = _calendar.data;

                this.list_diemdanh = _diemdanh.data;

                this.tongsv = _class.recordsFiltered;

                this.loadStudentClass_v2(1, this.limit_student);
            },
            error: () => {

            }
        })
    }

    loadStudentClass_v2(page, limit) {
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'limit', value: limit },
            ],
            page: page,
        };

        if (this.search_student) {
            condition.condition.push({
                conditionName: 'user_info',
                condition: OvicQueryCondition.like,
                value: '%' + this.search_student.trim() + '%',
                orWhere: 'and',
            });
        }

        this.notificationService.isProcessing(true);

        this.classStudentService.getClassStudentByPageNew(condition).subscribe({
            next: (_resStudent) => {
                this.total_student = _resStudent.recordsFiltered;
                if (_resStudent.data) {
                    const tmp = [];
                    // this.objectClassStudent = {};
                    const _index_start = (page - 1) * Number(limit);
                    _resStudent.data.forEach((f, key) => {
                        f['index_'] = _index_start + key + 1;
                        f['name'] = f.user_info['name'];
                        f['full_name'] = f.user_info['full_name'];
                        f['birthday'] = f.user_info['birthday'] ? f.user_info['birthday'] : 'Không có';
                        f['email'] = f.user_info['email'];
                        f['student_code'] = f.user_info['student_code'];
                        f['student_diemdanh_object'] = {}
                        this.list_diemdanh.filter(m => m.student_id === f.student_id).forEach(d => {
                            if (!f['student_diemdanh_object'][d['calendar_id']]) {
                                f['student_diemdanh_object'][d['calendar_id']] = d.loaiphep;
                            }
                        });
                        f['count_diemdanh'] = {
                            M: this.list_diemdanh.filter(m => m.loaiphep === 'M' && m.student_id === f.student_id).length,
                            P: this.list_diemdanh.filter(m => m.loaiphep === 'P' && m.student_id === f.student_id).length,
                            K: this.list_diemdanh.filter(m => m.loaiphep === 'K' && m.student_id === f.student_id).length
                        }
                        tmp.push(f);
                    });
                    this.list_student = tmp;
                } else {
                    this.list_student = [];
                }
                this.notificationService.isProcessing(false);
            },
            error: (e) => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        });
    }

    changePage_student(event) {
        if (event.rows !== this.limit_student) {
            this.search_student = null;
            this.search_student_html = null;
            this.limit_student = event.rows;
        }
        this.loadStudentClass_v2(event.page + 1, this.limit_student);
    }

    onSearchStudent(event) {
        this.search_student = null;
        this.search_student_html = null;
        if (this.limit_student >= this.tongsv) {
            if (event.target.value && event.target.value.trim()) {
                if (event.code === "Enter") {
                    this.search_student = null;
                    this.search_student_html = event.target.value;
                }
            } else {
                this.search_student_html = null;
            }
        } else {
            this.search_student_html = null;
            if (event.target.value && event.target.value.trim()) {
                this.search_student = event.target.value;
                if (event.code === "Enter") {
                    this.notificationService.isProcessing(true);
                    this.loadStudentClass_v2(1, this.limit_student);
                }
            } else {
                this.search_student = null;
                this.notificationService.isProcessing(true);
                this.loadStudentClass_v2(1, this.limit_student);
            }
        }
    }

    loadForExportDataDiemdanh() {
        this.notificationService.isProcessing(true);
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'limit', value: '-1' },
            ],
            page: null,
        };
        this.classStudentService.getClassStudentByPageNew(condition).subscribe({
            next: (_student) => {
                this.notificationService.isProcessing(false);
                _student.data.forEach((f, key) => {
                    f['name'] = f.user_info['name'];
                    f['full_name'] = f.user_info['full_name'];
                    f['birthday'] = f.user_info['birthday'] ? f.user_info['birthday'] : 'Không có';
                    f['email'] = f.user_info['email'];
                    f['student_code'] = f.user_info['student_code'];
                    f['student_diemdanh_object'] = {}
                    this.list_diemdanh.filter(m => m.student_id === f.student_id).forEach(d => {
                        if (!f['student_diemdanh_object'][d['calendar_id']]) {
                            f['student_diemdanh_object'][d['calendar_id']] = d.loaiphep;
                        }
                    });
                    f['count_diemdanh'] = {
                        M: this.list_diemdanh.filter(m => m.loaiphep === 'M' && m.student_id === f.student_id).length,
                        P: this.list_diemdanh.filter(m => m.loaiphep === 'P' && m.student_id === f.student_id).length,
                        K: this.list_diemdanh.filter(m => m.loaiphep === 'K' && m.student_id === f.student_id).length
                    }
                });
                this.convertDataToExportExcel(_student.data, APP_CONFIGS.donviquanly);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    convertDataToExportExcel(data, tenDonvi: string) {
        const dataExport = [];
        const header = ['STT', 'Mã sinh viên', 'Họ và tên'];
        this.list_calendar.forEach((cal, key) => {
            header.push('Buổi '.concat((key + 1).toString()))
        })
        header.push('K');
        header.push('P');
        header.push('M');

        data.forEach((f, key) => {
            const d = [
                key + 1,
                f['student_code'],
                f['full_name'],
            ]

            this.list_calendar.forEach(cal => {
                if (f['student_diemdanh_object'][cal.id.toString()]) {
                    d.push(f['student_diemdanh_object'][cal.id.toString()])
                } else {
                    d.push('-');
                }

            })

            d.push(f['count_diemdanh']['K']);
            d.push(f['count_diemdanh']['P']);
            d.push(f['count_diemdanh']['M'])

            dataExport.push(d);
        });
        const titleFont = { name: 'Times New Roman', family: 1, size: 18, bold: true };
        const rowFont = { name: 'Times New Roman', family: 1, size: 11 };
        const donviFont = { name: 'Times New Roman', family: 1, size: 11, bold: true };
        const headerFont = { name: 'Times New Roman', family: 1, size: 11, bold: true };
        this.exportExcelDiemdanhService.exportExcel(
            dataExport,
            header,
            'Bảng điểm danh: '.concat(this.classSelected.name),
            titleFont,
            'E1:O2',
            rowFont,
            headerFont,
            donviFont,
            'Bảng điểm danh_'.concat(this.classSelected.name.replace(/\/|\./gi, '_'))
        );
    }
}
