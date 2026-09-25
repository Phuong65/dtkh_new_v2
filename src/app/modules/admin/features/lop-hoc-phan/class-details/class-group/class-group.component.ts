import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-class-group',
    templateUrl: './class-group.component.html',
    styleUrls: ['./class-group.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ClassGroupComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



