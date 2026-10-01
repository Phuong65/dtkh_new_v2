import { HoidongThamdinhService } from './../../../../shared/services/hoidong-thamdinh.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-hd-thamdinh-router-outlet',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    templateUrl: './hd-thamdinh-router-outlet.component.html',
    styleUrls: ['./hd-thamdinh-router-outlet.component.css']
})
export class HdThamdinhRouterOutletComponent implements OnInit {

    constructor(
        private activatedRoute: ActivatedRoute,
        private hoidongThamdinhService: HoidongThamdinhService,
        private title: Title,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                const hoidong_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: hoidong_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                this.hoidongThamdinhService.getHoidongThamdinhByPageNew(contition).subscribe({
                    next: (_hoidong) => {
                        if (_hoidong.recordsFiltered)
                            this.title.setTitle(_hoidong.data[0].title);
                    },
                    error: () => {

                    }
                })
            } else {

            }
        })
    }
}
