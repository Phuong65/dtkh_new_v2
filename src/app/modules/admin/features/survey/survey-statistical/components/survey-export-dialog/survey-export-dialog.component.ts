import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-export-dialog',
    templateUrl: './survey-export-dialog.component.html',
    styleUrls: ['./survey-export-dialog.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyExportDialogComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



