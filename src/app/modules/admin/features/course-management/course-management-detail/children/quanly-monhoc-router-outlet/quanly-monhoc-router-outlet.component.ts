import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, RouterOutlet } from "@angular/router";
import { Title } from '@angular/platform-browser';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';

@Component({
    selector: 'app-quanly-monhoc-router-outlet',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './quanly-monhoc-router-outlet.component.html',
    styleUrls: ['./quanly-monhoc-router-outlet.component.css']
})
export class QuanlyMonhocRouterOutletComponent implements OnInit {
    private activatedRoute = inject(ActivatedRoute);
    private ElnKhoaHocService = inject(ElnKhoaHocService);
    private title = inject(Title);

    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);


    constructor() { }

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

                this.ElnKhoaHocService.getKhoaHocByPageNew_2(contition).subscribe({
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
