import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thongke-cathi',
    templateUrl: './thongke-cathi.component.html',
    styleUrls: ['./thongke-cathi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongkeCathiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



