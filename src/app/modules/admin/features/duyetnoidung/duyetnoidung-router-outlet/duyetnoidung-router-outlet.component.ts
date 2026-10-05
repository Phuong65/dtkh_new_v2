import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';

@Component({
    selector: 'app-duyetnoidung-router-outlet',
    standalone: true,
    imports: [
    RouterModule
],
    templateUrl: './duyetnoidung-router-outlet.component.html',
    styleUrls: ['./duyetnoidung-router-outlet.component.css']
})
export class DuyetnoidungRouterOutletComponent implements OnInit {
    private activatedRoute = inject(ActivatedRoute);
    private hoidongThamdinhService = inject(HoidongThamdinhService);
    private title = inject(Title);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private hoidongThamdinhMonhocService = inject(HoidongThamdinhMonhocService);

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                const course_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' },
                        { label: 'with', value: 'course' }
                    ],
                    page: null
                }

                this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(contition).subscribe({
                    next: (_course) => {
                        if (_course.recordsFiltered && _course.data[0].course)
                            this.title.setTitle(_course.data[0].course.title.concat(" - [", _course.data[0].course.maso, "]"));
                    },
                    error: () => {

                    }
                })
            } else {

            }
        })
    }
}
