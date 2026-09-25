import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ClassPlanActivityTickets } from "@shared/models/class-plan-activity-tickets";
import { forkJoin, Observable, of, switchMap } from "rxjs";
import { ConditionOption } from "@shared/models/condition-option";
import { ClassPlanActivityTicketsService } from "@shared/services/class-plan-activity-tickets.service";
import { NotificationService } from "@core/services/notification.service";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { OvicQueryCondition } from "@core/models/dto";
import { Classes } from "@shared/models/classes";
import { Paginator, PaginatorModule } from "primeng/paginator";
import { CommonModule } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { SplitterModule } from 'primeng/splitter';
import { HoiDapReplyComponent } from './hoi-dap-reply/hoi-dap-reply.component';
import { ButtonModule } from 'primeng/button';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, PaginatorModule, SplitterModule, HoiDapReplyComponent, ButtonModule],
    selector: 'app-hoi-dap',
    templateUrl: './hoi-dap.component.html',
    styleUrls: ['./hoi-dap.component.css']
})
export class HoiDapComponent implements OnInit {

    @ViewChild('paginator', { static: true }) paginator: Paginator;
    @Input() set classSelected(data: Classes) {
        this.loadData(data, this.page);
        this._classes = data;
    }
    ngSiteRight: 1 | 0 | 2 = 0;// 1 : select_item,0 :chờ,2: loadiding
    _classes: Classes;
    ticket_id_select: number = 0;
    rows: number = this.themeSettingsService.settings.rows;
    search: string = '';
    page: number = 1;
    listData: ClassPlanActivityTickets[];
    recorTotal: number = 0;
    ticketSelect: ClassPlanActivityTickets;
    constructor(
        private classPlanActivityTicketsService: ClassPlanActivityTicketsService,
        private notifi: NotificationService,
        private themeSettingsService: ThemeSettingsService
    ) {
    }

    ngOnInit(): void {
    }

    loadData(classes: Classes, page: number) {
        const conditionTickets: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: classes.id.toString() },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: "and" }
            ],
            set: [
                { label: 'limit', value: this.themeSettingsService.settings.rows.toString() },
                // { label: 'select', value: "id, student_id,point,created_at,updated_at" },
                { label: 'order', value: "ASC" },
                { label: 'orderby', value: "id" },
                { label: 'with', value: "student,teacher" },
            ],
            page: page.toString()
        };

        if (this.search) {
            conditionTickets.condition.push({
                conditionName: 'content', condition: OvicQueryCondition.like, value: `%${this.search}%`, orWhere: "and"
            })
        }
        this.notifi.isProcessing(true);
        this.classPlanActivityTicketsService.getClassPlanActivityTicketsByPageNew(conditionTickets).pipe(switchMap(m => {
            return forkJoin([this.getChildensTickets(m.data), of(m.recordsFiltered)])
        })).subscribe(
            {
                next: ([data, recordsFiltered]) => {
                    this.listData = data.length > 0 ? data.map(m => {
                        m['__who_create'] = m['student'] ? m['student']['full_name'] : '';
                        const anserw = m['__children'];
                        m['__isAnswers'] = anserw.length > 0;
                        m['__total_answer'] = anserw ? anserw.length : 0;
                        const lastChildem = anserw ? anserw[anserw.length - 1] : null;
                        m['__last_answer'] = lastChildem;
                        m['__who_last_answer'] = lastChildem ? lastChildem['__who_ansewr'] : '';
                        m['__created_coverted'] = lastChildem ? lastChildem['__created_coverted'] : this.convertDateToFomat(m['created_at']);
                        m['__class_select'] = this._classes;
                        m['__created_at'] = this.formatSQLDateTimeDMY(new Date(m['created_at']));
                        return m;

                    }) : [];
                    this.recorTotal = recordsFiltered;
                    this.notifi.isProcessing(false);

                },
                error: (e) => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Load dữ liệu không thành công');

                }
            }
        )
    }

    private getChildensTickets(prj: ClassPlanActivityTickets[]): Observable<ClassPlanActivityTickets[]> {
        const ids = prj.map(m => m.id);
        const condition: ConditionOption = {
            condition: [
            ],
            set: [
                { label: 'limit', value: '-1' },
                // { label: 'select', value: "id, student_id,point,created_at,updated_at" },
                { label: 'order', value: "ASC" },
                { label: 'orderby', value: "id" },
                { label: 'include', value: ids.join(',') },
                { label: 'include_by', value: 'parent_id' },
                { label: 'with', value: "student,teacher" },
            ],
            page: '1'
        };
        return this.classPlanActivityTicketsService.getClassPlanActivityTicketsByPageNew(condition).pipe(switchMap(({ data, recordsFiltered }) => {

            prj.map(m => {
                m['__children'] = data.length > 0 ? data.map(m => {
                    m['__created_coverted'] = this.convertDateToFomat(m['created_at']);
                    m['__who_ansewr'] = m.is_student === 1 ? m['student']['full_name'] : (m['teacher'].find(b => b.id === m['created_by']) ? m['teacher'].find(b => b.id === m['created_by'])['display_name'] : '');
                    m['__avatar'] = m.is_student === 1 ? (m['student']['avatar'] ? m['student']['avatar'] : 'assets/images/a_none.jpg') : (m['teacher'].find(b => b.id === m['created_by']) ? m['teacher'].find(b => b.id === m['created_by'])['avatar'] : 'assets/images/a_none.jpg');
                    m['__created_at'] = this.formatSQLDateTimeDMY(new Date(m['created_at']));
                    return m;
                }).filter(f => f.parent_id === m.id) : [];
                return m;
            })
            return of(prj);
        }))
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
            return `${mininusElapsed} ` + 'phút trước';
        } else if (houseElapsed < 24) {
            return `${houseElapsed} ` + 'giờ trước';
        } else if (daysElapsed < 30) {
            return `${daysElapsed} ` + 'ngày trước';
        } else if (daysElapsed < 365) {
            return `${weeksElapsed} tuần trước`;
        } else {
            return `${monthsElapsed} tháng trước`;
        }
    }

    changePage(event) {
        console.log(event);
    }

    searchText(event) {
        this.search = event.target.value;
        this.page = 1;
        this.loadData(this._classes, this.page);
    }

    btnOnMessengerReply(item: ClassPlanActivityTickets) {
        this.ticket_id_select = item.id
        this.ngSiteRight = 1;
        this.ticketSelect = { ...item };

    }

    refresh() {
        this.page = 1;
        this.loadData(this._classes, this.page);
        this.ticketSelect = null;
        this.ngSiteRight = 0;
    }

}
