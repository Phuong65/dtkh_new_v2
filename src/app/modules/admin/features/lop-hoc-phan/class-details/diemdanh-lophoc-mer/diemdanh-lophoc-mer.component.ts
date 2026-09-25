import { Component, Input, OnInit } from '@angular/core';

import { TabViewModule } from 'primeng/tabview';
import { DiemdanhLophocComponent } from '../diemdanh-lophoc/diemdanh-lophoc.component';
import { DiemdanhLophocV2Component } from '../diemdanh-lophoc-v2/diemdanh-lophoc-v2.component';
import { Classes } from '@modules/shared/models/classes';
@Component({
    selector: 'app-diemdanh-lophoc-mer',
    standalone: true,
    imports: [
    TabViewModule,
    DiemdanhLophocComponent,
    DiemdanhLophocV2Component
],
    templateUrl: './diemdanh-lophoc-mer.component.html',
    styleUrls: ['./diemdanh-lophoc-mer.component.css']
})

export class DiemdanhLophocMerComponent implements OnInit {

    @Input() classSelected: Classes;

    activityIndex: number = 0;

    constructor() {

    }

    ngOnInit(): void {

    }
}
