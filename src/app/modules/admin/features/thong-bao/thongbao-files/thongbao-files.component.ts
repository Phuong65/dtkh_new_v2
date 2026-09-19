import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thongbao-files',
    templateUrl: './thongbao-files.component.html',
    styleUrls: ['./thongbao-files.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongbaoFilesComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



