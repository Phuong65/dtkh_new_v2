import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { IctuQueryParams, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ParticipantRolesTypeOption, Survey, SurveyParticipantRoles } from '@modules/shared/models/survey';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Paginator, PaginatorModule } from "primeng/paginator";
import { SharedModule } from "@modules/shared/shared.module";
import { CalendarModule } from "primeng/calendar";
import { HelperService } from '@core/services/helper.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { SurveyService } from '@modules/shared/services/survey.service';
import { SurveyQuestionAnswerService } from '@modules/shared/services/survey-question-answer.service';
interface Temp {
    paged: number;
    limit: number;
    participant_roles: SurveyParticipantRoles | '';
}
@Component({
    selector: 'app-danh-muc-survey',
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        PaginatorModule,
        ReactiveFormsModule,
        SharedModule,
        CalendarModule,
        NgbTooltipModule,
        RouterModule
    ],
    templateUrl: './danh-muc-survey.component.html',
    styleUrls: ['./danh-muc-survey.component.css']
})
export class DanhMucSurveyComponent implements OnInit {

    constructor(
        private noitifi: NotificationService,
        private surveysService: SurveyService,
        private surveyQuestionAnswerService: SurveyQuestionAnswerService,
        public formBuilder: FormBuilder,
        private helperService: HelperService,
        private router: Router) {
        this.formSurvey = this.formBuilder.group({
            id: [''],
            title: ['', Validators.required],
            description: [''],
            total_questions: [''],
            status: ['', Validators.required],
            participant_roles: [''],
        });
    }

    ngOnInit(): void {
        this.initData();
    }


    listSurvey: Survey[];

    totalSurvey: number = 0;

    answerCountMap: Map<number, number> = new Map();

    participantRolesTypeOption = ParticipantRolesTypeOption;


    @ViewChild('createSurvey') createSurvey: TemplateRef<any>;

    @ViewChild('paginator') paginator: Paginator;

    temp: Temp = {
        paged: 1,

        limit: 20,
        participant_roles: ''
    }

    formSurvey: FormGroup;


    isAdd: boolean = true;

    initData() {
        this.noitifi.isProcessing(true);
        const condition: OvicConditionParam[] = [];
        if (this.temp.participant_roles != '') {
            condition.push({
                conditionName: 'participant_roles',
                condition: OvicQueryCondition.like,
                value: `%${this.temp.participant_roles}%`
            });
        }
        const queryParams: IctuQueryParams = {
            limit: this.temp.limit,
            paged: this.temp.paged,
            order: 'DESC',
            orderby: 'created_at'
        };

        // .pipe(map((res) => { return res.data }))
        this.surveysService.loadData(condition, queryParams).pipe(
            map(res => {
                this.totalSurvey = res.recordsFiltered;
                return res.data;
            }),
            switchMap(surveys => {
                this.listSurvey = surveys;
                // Kiểm tra từng phiếu khảo sát đã có câu trả lời chưa (limit 1 là đủ)
                if (surveys.length) {
                    return forkJoin(
                        surveys.map(s => this.surveyQuestionAnswerService.countAnswerSurvey(s.id.toString()))
                    ).pipe(
                        map(counts => {
                            const map = new Map<number, number>();
                            surveys.forEach((s, i) => {
                                if (counts[i] && counts[i] > 0) {
                                    map.set(s.id, counts[i]);
                                }
                            });
                            this.answerCountMap = map;
                        })
                    );
                }
                this.answerCountMap = new Map();
                return of(null);
            })
        ).subscribe({
            next: () => {
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.toastError('Lỗi kết nối');
                this.noitifi.isProcessing(false);
            },
        });
    }

    changePage(event) {
        this.temp = {
            ...this.temp,
            paged: event.page + 1
        }
        this.initData();
    }

    openFormAddSurvey(): void {
        this.formSurvey.reset();
        this.formControl['participant_roles'].setValue('STUDENT');
        this.isAdd = true;
        this.noitifi.openSideNavigationMenu({ template: this.createSurvey, size: 700, offsetTop: '0px' });
    }

    closeSideMenu() {
        this.noitifi.closeSideNavigationMenu();
    }

    get formControl() {
        return this.formSurvey.controls;
    }
    onChangeParticipantRoles(event) {
        this.temp = { ...this.temp, participant_roles: event?.id ?? '', paged: 1 };
        this.initData();
    }

    saveSurvey(): void {
        this.noitifi.isProcessing(true);
        if (this.isAdd) {
            this.formControl['status'].setValue('DRAFT');
        }
        const info: Partial<Survey> = {
            title: this.formControl['title'].value,
            description: this.formControl['description'].value,
            status: this.formControl['status'].value,
            participant_roles: this.formControl['participant_roles'].value,
        }

        this.surveysService.postData(info).subscribe({
            next: (value) => {
                this.noitifi.toastSuccess('Tạo mới thành công');
                this.noitifi.isProcessing(false);
                this.closeSideMenu();
                this.initData();
            },
            error: (err) => {
                this.noitifi.toastError('Tạo mới không thành công');
                this.noitifi.isProcessing(false);
            },
        })
    }

    deleteSurvey(item: Survey): void {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.noitifi.isProcessing(true);
                    this.surveyQuestionAnswerService.countAnswerSurvey(item.id.toString()).subscribe({
                        next: (count) => {
                            if (count > 0) {
                                this.noitifi.isProcessing(false);
                                this.noitifi.toastError('Không thể xóa! Phiếu khảo sát đã được sử dụng');
                                return;
                            }
                            this.surveysService.delData(item.id.toString()).subscribe({
                                next: () => {
                                    this.noitifi.toastSuccess('Xóa thành công');
                                    this.noitifi.isProcessing(false);
                                    this.initData();
                                },
                                error: () => {
                                    this.noitifi.toastError('Xóa không thành công');
                                    this.noitifi.isProcessing(false);
                                }
                            });
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError('Lỗi kiểm tra dữ liệu');
                        }
                    });
                }
            },
            () => null
        );
    }

}
