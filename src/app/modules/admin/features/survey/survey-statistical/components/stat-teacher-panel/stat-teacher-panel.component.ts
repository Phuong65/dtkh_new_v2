import { Component, OnChanges , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-stat-teacher-panel',
    templateUrl: './stat-teacher-panel.component.html',
    styleUrls: ['./stat-teacher-panel.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class StatTeacherPanelComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



