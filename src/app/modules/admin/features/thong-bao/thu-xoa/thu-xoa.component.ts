import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thu-xoa',
    templateUrl: './thu-xoa.component.html',
    styleUrls: ['./thu-xoa.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThuXoaComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



