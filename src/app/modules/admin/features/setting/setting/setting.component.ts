import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-setting',
    templateUrl: './setting.component.html',
    styleUrls: ['./setting.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SettingComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



