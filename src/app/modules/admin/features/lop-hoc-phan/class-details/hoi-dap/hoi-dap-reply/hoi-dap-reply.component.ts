import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ClassPlanActivityTickets } from "@shared/models/class-plan-activity-tickets";
import { Observable, of, switchMap } from "rxjs";
import { OvicQueryCondition } from "@core/models/dto";
import { ClassPlanActivityTicketsService } from "@shared/services/class-plan-activity-tickets.service";
import { NotificationService } from "@core/services/notification.service";
import { ConditionOption } from "@shared/models/condition-option";
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "@core/services/auth.service";
import { MomentService } from "@modules/kiem-thu-ngan-hang-cau-hoi/test/services/moment.service";
import { OpenFileManagerService } from "@shared/services/open-file-manager.service";
import { OvicFile } from "@core/models/file";
import { FileType, TYPE_FILE_LIST } from "@shared/utils/syscat";
import { FileService } from "@core/services/file.service";
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { HoiDapFilesComponent } from '../hoi-dap-files/hoi-dap-files.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    standalone: true,
    imports: [CommonModule, DialogModule, SharedModule, MatMenuModule, MatIconModule, ButtonModule, HoiDapFilesComponent, FormsModule, ReactiveFormsModule, TooltipModule],
    selector: 'app-hoi-dap-reply',
    templateUrl: './hoi-dap-reply.component.html',
    styleUrls: ['./hoi-dap-reply.component.css']
})
export class HoiDapReplyComponent implements OnInit {
    @ViewChild('fileChooser') fileChooser!: ElementRef<HTMLInputElement>;

    @Input() set dataParam(data: ClassPlanActivityTickets) {

        this.load(data);
    }

    formCreateChild: FormGroup;
    ticketParam: ClassPlanActivityTickets;
    loadding: boolean = false;
    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private notifi: NotificationService,
        private classPlansActivityTicketsServices: ClassPlanActivityTicketsService,
        private momentService: MomentService,
        private openFileManagerService: OpenFileManagerService,
        private fileService: FileService
    ) {
        this.formCreateChild = this.fb.group({
            content: ['', Validators.required],
            course_id: [0, Validators.required],
            class_id: [null, Validators.required],
            is_student: [0, Validators.required],
            status: [0, Validators.required],
            parent_id: [0, Validators.required],
            teacher_id: ['', Validators.required],
            files: [[]]
        })
    }

    ngOnInit(): void {
    }
    get e(): { [key: string]: AbstractControl<any> } {
        return this.formCreateChild.controls;
    }


    load(item: ClassPlanActivityTickets) {

        this.ticketParam = item ? item : null;
        this.formCreateChild.reset({
            content: '',
            class_id: item.class_id,
            is_student: 0,
            status: 0,
            parent_id: item.id,
            teacher_id: item.teacher_id,
            course_id: item.course_id,
            files: []
        })
    }

    btnCreateChild() {
        if (this.formCreateChild.valid) {
            this.loadding = true;
            this.classPlansActivityTicketsServices.addClassPlanActivityTickets(this.formCreateChild.value).pipe(switchMap(m => {
                const condition: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'id',
                            condition: OvicQueryCondition.equal,
                            value: m.toString()
                        }
                    ],
                    page: '1',
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'with', value: "student,teacher" },
                    ]
                }

                return this.classPlansActivityTicketsServices.getClassPlanActivityTicketsByPageNew(condition).pipe(switchMap(m => m.data))
            })).subscribe({
                next: (data) => {
                    data['__created_coverted'] = this.convertDateToFomat(data['created_at']);
                    data['__who_ansewr'] = data.is_student === 1 ? data['student']['full_name'] : (data['teacher'].find(b => b.id === data['created_by']) ? data['teacher'].find(b => b.id === data['created_by'])['display_name'] : '');
                    data['__avatar'] = data.is_student === 1 ? data['student']['avatar'] : (data['teacher'].find(b => b.id === data['created_by']) ? data['teacher'].find(b => b.id === data['created_by'])['avatar'] : 'assets/images/a_none.jpg');
                    data['__created_at'] = this.formatSQLDateTimeDMY(new Date(data['created_at']));
                    this.ticketParam['__children'].push(data);
                    this.notifi.toastSuccess('Gửi tin nhắn thành công');
                    this.load(this.ticketParam);
                    this.loadding = false;
                    this.resetForm();
                    // this.btnselectViewById(data.id)
                    this.fileSelectImport = [];
                }, error: () => {
                    this.notifi.toastError('Gửi tin nhắn không thành công');
                    this.resetForm();

                    this.loadding = false;
                    this.fileSelectImport = [];

                }
            })
        } else {
            this.notifi.toastWarning('Vui lòng nhập câu trả lời');
        }
    }
    convertDateToFomat(startDate) {
        const now: Date = new Date();
        const start: Date = new Date(startDate);
        if (!(start instanceof Date) || !(now instanceof Date)) {
        }

        const timeDifference = now.getTime() - start.getTime();
        const oneDay = 24 * 60 * 60 * 1000; // Số mili giây trong một ngày
        const mininusElapsed = Math.floor(timeDifference / (60 * 1000));
        const houseElapsed = Math.floor(timeDifference / (60 * 60 * 1000));
        const daysElapsed = Math.floor(timeDifference / oneDay);
        const weeksElapsed = Math.floor(daysElapsed / 7);
        const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        if (mininusElapsed < 60) {
            return `${mininusElapsed} phút trước`;
        } else if (houseElapsed < 24) {
            return `${houseElapsed} giờ trước`;
        } else if (daysElapsed < 30) {
            return `${daysElapsed} ngày trước`;
        } else if (daysElapsed < 365) {
            return `${weeksElapsed} tuần trước`;
        } else {
            return `${monthsElapsed} tháng trước`;
        }
    }
    formatSQLDateTimeDMY(date: Date): string {
        const y: string = date.getFullYear().toString();
        const m: string = (date.getMonth() + 1).toString().padStart(2, '0');
        const d: string = date.getDate().toString().padStart(2, '0');
        const h: string = date.getHours().toString().padStart(2, '0');
        const min: string = date.getMinutes().toString().padStart(2, '0');
        const sec: string = date.getSeconds().toString().padStart(2, '0');
        return `${d}-${m}-${y} ${h}:${min}:${sec}`;
    }

    resetForm() {
        this.formCreateChild.reset({
            content: '',
            class_id: this.ticketParam.class_id,
            student_id: 0,
            is_student: 0,
            status: 0,
            parent_id: this.ticketParam.id,
            teacher_id: this.ticketParam.teacher_id,
            course_id: this.ticketParam.course_id,
            files: []
        })
    }

    acceptFile: string = '';
    fileSelectImport: OvicFile[] = [];
    async selectFileInReply(fileType: 'img' | 'video' | 'files') {

        this.acceptFile = fileType;
        this.fileChooser.nativeElement.click();

    }
    onSelectFile(event, fileChooser: HTMLInputElement, index: number) {

        if (fileChooser.files && fileChooser.files.length) {
            const data = Array.from(fileChooser.files).map(m => {
                m['_acceptFile'] = this.coventExt(m)
                m['_select'] = this.fileType.has(m.type)
                return m
            });
            if (this.acceptFile === 'img' || this.acceptFile === 'video') {
                const file = data.filter(f => f['_acceptFile'] === this.acceptFile);
                if (file.length > 0) {
                    this.lookCreated(file).subscribe({
                        next: (datacheck) => {
                            this.fileSelectImport = datacheck.map((m) => {
                                return m['_upload'];
                            })
                            this.e['files'].setValue(this.fileSelectImport);
                        }
                    })
                } else {
                    this.notifi.toastError('Định dạng file không được hỗ trợ')
                }
            } else {
                if (data.filter(f => f['_select'] && !['img', 'video'].includes(f['_acceptFile']))) {
                    const dataFileSelect = data.filter(f => f['_select'] && !['img', 'video'].includes(f['_acceptFile']))
                    this.lookCreated(dataFileSelect).subscribe({
                        next: (datacheck) => {
                            this.fileSelectImport = datacheck.map((m) => {
                                return m['_upload'];
                            })
                            this.e['files'].setValue(this.fileSelectImport);
                        }
                    })
                } else {
                    this.notifi.toastError('Định dạng file không hỗ trợ');
                }
            }

        }
    }


    fileType = FileType;
    listFileType = TYPE_FILE_LIST;
    coventExt(file: File): string {
        // console.log(this.fileType.has(file.type));
        const type = this.fileType.has(file.type) ? this.fileType.get(file.type) : file.type;
        return type;

        // let type = '';
        // Object.keys(TYPE_FILE_LIST).forEach(t => {
        //     if (file.type) {
        //         const index = file.type.indexOf(t);
        //         if (index !== -1) {
        //             type = TYPE_FILE_LIST[t];
        //         }
        //     }
        // })
        // return  type ? type.toLowerCase() : file['ext'].toLowerCase();
    }

    lookCreated(data: File[]): Observable<File[]> {
        const index: number = data.findIndex(i => !i['__canCreated']);
        if (index !== -1) {
            const item = data[index];
            delete item['_acceptFile'];
            delete item['_select'];
            data[index]['__canCreated'] = true;
            return this.fileService.uploadFileAws(item).pipe(
                switchMap(m => {
                    data[index]['_upload'] = m ? m : null;
                    return this.lookCreated(data)
                }))
        } else {
            return of(data);
        }
    }

    btnDeletFile(file: OvicFile) {
        this.fileService.deleteFileAwsNormal([file['id']]).subscribe();
        this.fileSelectImport = this.fileSelectImport.filter(f => f.id !== file.id);

        this.formCreateChild.value['files'] = this.fileSelectImport;
    }



    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    btnLookTicket() {
        this.notifi.isProcessing(true);
        if (this.ticketParam.status === 0) {
            this.classPlansActivityTicketsServices.updateClassPlanActivityTickets(this.ticketParam.id, { status: 2 }).subscribe(
                {
                    next: () => {
                        this.ticketParam.status = 2;
                        this.notifi.toastSuccess('Khoá đoạn hỏi đáp thành công');
                        this.notifi.isProcessing(false);
                    }
                }
            )
        } else {
            this.classPlansActivityTicketsServices.updateClassPlanActivityTickets(this.ticketParam.id, { status: 0 }).subscribe(
                {
                    next: () => {
                        this.ticketParam.status = 0;
                        this.notifi.toastSuccess('Mở khoá đoạn hỏi đáp thành công');
                        this.notifi.isProcessing(false);
                    }
                }
            )
        }
    }

}
