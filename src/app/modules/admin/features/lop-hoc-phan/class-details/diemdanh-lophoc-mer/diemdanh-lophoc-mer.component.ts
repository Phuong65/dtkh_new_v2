import { Component, OnInit, input } from '@angular/core';

import { TabsModule } from 'primeng/tabs';
import { DiemdanhLophocComponent } from '../diemdanh-lophoc/diemdanh-lophoc.component';
import { DiemdanhLophocV2Component } from '../diemdanh-lophoc-v2/diemdanh-lophoc-v2.component';
import { Classes } from '@modules/shared/models/classes';
@Component({
    selector: 'app-diemdanh-lophoc-mer',
    standalone: true,
    imports: [
    TabsModule,
    DiemdanhLophocComponent,
    DiemdanhLophocV2Component
],
    templateUrl: './diemdanh-lophoc-mer.component.html',
    styleUrls: ['./diemdanh-lophoc-mer.component.css']
})

export class DiemdanhLophocMerComponent implements OnInit {

    classSelected = input<Classes>();

    activityIndex: number = 0;

    constructor() {

    }

    ngOnInit(): void {

    }
}
