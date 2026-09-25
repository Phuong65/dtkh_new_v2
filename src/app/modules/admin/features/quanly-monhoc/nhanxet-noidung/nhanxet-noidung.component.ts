import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-nhanxet-noidung',
    templateUrl: './nhanxet-noidung.component.html',
    styleUrls: ['./nhanxet-noidung.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class NhanxetNoidungComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



