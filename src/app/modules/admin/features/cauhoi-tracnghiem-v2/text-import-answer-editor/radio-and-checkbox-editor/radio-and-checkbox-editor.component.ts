import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-radio-and-checkbox-editor',
    templateUrl: './radio-and-checkbox-editor.component.html',
    styleUrls: ['./radio-and-checkbox-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class RadioAndCheckboxEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



