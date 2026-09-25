import { Component, OnChanges , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-text-import-test-preview',
    templateUrl: './text-import-test-preview.component.html',
    styleUrls: ['./text-import-test-preview.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TextImportTestPreviewComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



