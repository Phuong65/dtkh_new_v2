import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-h-cn-mon',
    templateUrl: './h-cn-mon.component.html',
    styleUrls: ['./h-cn-mon.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HCnMonComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



