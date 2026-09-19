import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { firstValueFrom, forkJoin, mergeMap, of } from 'rxjs';
import { APP_CONFIGS } from '@env';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-view-thuongxuyen-tuluan',
    templateUrl: './view-thuongxuyen-tuluan.component.html',
    styleUrls: ['./view-thuongxuyen-tuluan.component.css']
})
export class ViewThuongxuyenTuluanComponent implements OnInit, OnChanges {

    countChanges = 0;

    @Input() tuluan: CoursePlanActivityTuluan;

    @Input() courseSelected: ElnKhoaHoc;

    @Input() course_plan_activity_id: number;

    @Input() hideNote: boolean = false;

    @Input() hinhthuc: string = 'Thực hành';

    selectedTuluan: CoursePlanActivityTuluan;

    info_activity: string;

    app_config = APP_CONFIGS;

    list_tieuchi_cham: CoursePlanActivityTuluanTieuchicham[] = [];

    list_tieuchi_cham_cau1: CoursePlanActivityTuluanTieuchicham[] = [];

    list_tieuchi_cham_cau2: CoursePlanActivityTuluanTieuchicham[] = [];

    chuandaura = CHUAN_DAU_RA;

    selectPlanActivityId: number;

    examFormat = EXAMFORMAT;

    constructor(
        private notificationService: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService
    ) {

    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['tuluan'] || changes['course_plan_activity_id']) {
            this.selectedTuluan = this.tuluan;

            this.selectPlanActivityId = this.course_plan_activity_id;

            ++this.countChanges;

            this.list_tieuchi_cham = [];

            if (this.selectedTuluan) {
                // if (!this.selectedTuluan.tuluan_root_ids) {
                const condition_tieuchi: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.course_id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: this.selectedTuluan.tuluan_root_ids ? this.selectedTuluan.tuluan_root_ids.split("|").filter(m => m).toString() : this.selectedTuluan.id.toString() },
                        { label: 'include_by', value: 'course_plan_activity_tuluan_id' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                if (this.selectPlanActivityId && this.selectPlanActivityId !== 0) {
                    condition_tieuchi.condition.push({ conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectPlanActivityId.toString(), orWhere: 'and' })
                }

                if (!this.hideNote) {

                    const _tieuchi = await firstValueFrom(this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi));

                    if (this.selectedTuluan.tuluan_root_ids) {
                        const root_ids = this.selectedTuluan.tuluan_root_ids.split("|").filter(m => m);

                        this.list_tieuchi_cham_cau1 = _tieuchi.data.filter(m => m.course_plan_activity_tuluan_id.toString() === root_ids[0]);

                        this.list_tieuchi_cham_cau2 = _tieuchi.data.filter(m => m.course_plan_activity_tuluan_id.toString() === root_ids[1]);
                    } else {
                        this.list_tieuchi_cham = _tieuchi.data;
                    }
                }
                // }

                if (this.selectedTuluan.tuluan_id) {
                    this.loadInfoQuestion();
                }
            }
        }
    }

    ngOnInit(): void {

    }

    loadInfoQuestion() {
        const condition_tuluan: ConditionOption = {
            condition: [
                // { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.tuluan_id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: this.selectedTuluan.tuluan_id.toString() },
                { label: 'include_by', value: 'id' }
            ],
            page: null
        }

        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).pipe(mergeMap(_tuluan => {
                const plan_ac_ids = [];
                _tuluan.data.forEach(f => {
                    plan_ac_ids.push(f.course_plan_activity_id);
                })

                if (plan_ac_ids.length) {
                    const condition_activity: ConditionOption = {
                        condition: [
                            // { conditionName: 'id', condition: OvicQueryCondition.equal, value: _tuluan.data[0].course_plan_activity_id.toString() }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [...new Set(plan_ac_ids)].toString() },
                            { label: 'include_by', value: 'id' }
                        ],
                        page: null
                    }
                    return this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_activity).pipe(mergeMap(_activity => {

                        const titles = [];

                        _tuluan.data.forEach(f => {
                            const index = _activity.data.findIndex(m => m.id === f.course_plan_activity_id);
                            if (index !== -1) {
                                titles.push(f.title.concat(' - ', _activity.data[index].title));
                            }
                        })

                        this.selectedTuluan['tuluan_in_name'] = titles;

                        return of(null);
                    }))
                }
                return of(null);
            })),

        ]).subscribe(([_tuluan]) => {

        })
    }

}
