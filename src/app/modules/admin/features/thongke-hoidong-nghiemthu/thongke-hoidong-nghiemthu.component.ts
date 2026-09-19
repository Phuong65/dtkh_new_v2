import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thongke-hoidong-nghiemthu',
    templateUrl: './thongke-hoidong-nghiemthu.component.html',
    styleUrls: ['./thongke-hoidong-nghiemthu.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongkeHoidongNghiemthuComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



