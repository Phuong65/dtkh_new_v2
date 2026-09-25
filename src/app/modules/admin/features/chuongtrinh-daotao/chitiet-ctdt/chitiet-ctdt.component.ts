import { CtdtService } from './../../../../shared/services/ctdt.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, OnInit } from '@angular/core';

import { AuthService } from '@core/services/auth.service';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { ROLES } from '@modules/shared/utils/syscat';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { Ctdt } from '@modules/shared/models/ctdt';
import { MenuItem } from 'primeng/api';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-chitiet-ctdt',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './chitiet-ctdt.component.html',
    styleUrls: ['./chitiet-ctdt.component.css']
})

export class ChitietCtdtComponent implements OnInit {

    isLanhDaoKhoa: boolean = false;

    isManager: boolean = false;

    selectedCtdt: Ctdt;

    menuCtdt: MenuItem[];

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ctdtService: CtdtService,
        private title: Title
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);


    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                const ctdtId = params['code'];

                const contition_ctdt: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                this.ctdtService.getCtdtByPageNew(contition_ctdt).subscribe({
                    next: (_ctdt) => {
                        if (_ctdt.recordsFiltered)
                            this.title.setTitle(_ctdt.data[0].ten);
                    },
                    error: () => {

                    }
                })
            } else {

            }
        })
    }
}
