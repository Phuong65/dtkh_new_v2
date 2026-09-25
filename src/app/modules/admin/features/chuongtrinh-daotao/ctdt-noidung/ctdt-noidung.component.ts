import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ctdt-noidung',
    templateUrl: './ctdt-noidung.component.html',
    styleUrls: ['./ctdt-noidung.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CtdtNoidungComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



