import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';

@Component({
    selector: 'app-cauhoi-thuchanh-kthp-router-outlet',
    standalone: true,
    imports: [
    RouterModule
],
    templateUrl: './cauhoi-thuchanh-kthp-router-outlet.component.html',
    styleUrls: ['./cauhoi-thuchanh-kthp-router-outlet.component.css']
})

export class CauhoiThuchanhKthpRouterOutletComponent implements OnInit {
    constructor(
        private elnKhoaHocService: ElnKhoaHocService,
        private activatedRoute: ActivatedRoute,
        private title: Title
    ) { }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                const course_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                this.elnKhoaHocService.getKhoaHocByPageNew_2(contition).subscribe({
                    next: (_course) => {
                        if (_course.recordsFiltered)
                            this.title.setTitle(_course.data[0].title.concat(" - [", _course.data[0].maso, "]"));
                    },
                    error: () => {

                    }
                })
            } else {

            }
        })
    }
}
