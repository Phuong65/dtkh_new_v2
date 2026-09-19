import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cauhoi-tracnghiem-create-form',
    templateUrl: './cauhoi-tracnghiem-create-form.component.html',
    styleUrls: ['./cauhoi-tracnghiem-create-form.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CauhoiTracnghiemCreateFormComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



