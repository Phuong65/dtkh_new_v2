import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-text-import-question',
    templateUrl: './text-import-question.component.html',
    styleUrls: ['./text-import-question.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TextImportQuestionComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



