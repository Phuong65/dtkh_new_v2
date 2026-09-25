import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-editable-text',
    templateUrl: './editable-text.component.html',
    styleUrls: ['./editable-text.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class EditableTextComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



