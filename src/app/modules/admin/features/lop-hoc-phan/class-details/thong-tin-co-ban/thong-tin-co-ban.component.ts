
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { OvicQueryCondition } from '@core/models/dto';

import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { SharedModule } from '@modules/shared/shared.module';
import { forkJoin } from 'rxjs';

@Component({
    standalone: true,
    imports: [SharedModule],
    selector: 'app-thong-tin-co-ban',
    templateUrl: './thong-tin-co-ban.component.html',
    styleUrls: ['./thong-tin-co-ban.component.css'],
})
export class ThongTinCoBanComponent implements OnInit, OnChanges {
    @Input() classSelected: Classes;

    noiti: boolean = false;

    constructor(
        private helperService: HelperService,
        private classStudentService: ClassStudentService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['classSelected']) {
            if (this.classSelected)
                this.checkStudent();
        }
    }

    checkStudent() {
        const condition_hocky: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
                {
                    conditionName: 'hocky',
                    condition: OvicQueryCondition.notEqual,
                    value: this.classSelected.hocky,
                },
            ],
            set: [
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'limit', value: '1' },
            ],
            page: null,
        };

        const condition_namhoc: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
                {
                    conditionName: 'namhoc',
                    condition: OvicQueryCondition.notEqual,
                    value: this.classSelected.namhoc,
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
            this.classStudentService.getClassStudentByPageNew(condition_hocky),
            this.classStudentService.getClassStudentByPageNew(condition_namhoc)
        ]).subscribe(([_hocky, _namhoc]) => {
            if (_hocky.recordsFiltered !== 0 || _namhoc.recordsFiltered !== 0) {
                this.noiti = true;
            } else {
                this.noiti = false;
            }
            this.notificationService.isProcessing(false)
        })
    }

    moveToLesson() {
        if (this.classSelected.course_id) {
            this.helperService.moveLinkToCourse(
                this.classSelected.course_id.toString()
            );
        }
    }
}
