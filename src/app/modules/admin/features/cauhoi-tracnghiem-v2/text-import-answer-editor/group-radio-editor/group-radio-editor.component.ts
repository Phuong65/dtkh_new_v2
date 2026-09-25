import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-group-radio-editor',
    templateUrl: './group-radio-editor.component.html',
    styleUrls: ['./group-radio-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class GroupRadioEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



