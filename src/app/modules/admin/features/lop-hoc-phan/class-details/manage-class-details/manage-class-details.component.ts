import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-manage-class-details',
    templateUrl: './manage-class-details.component.html',
    styleUrls: ['./manage-class-details.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ManageClassDetailsComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



