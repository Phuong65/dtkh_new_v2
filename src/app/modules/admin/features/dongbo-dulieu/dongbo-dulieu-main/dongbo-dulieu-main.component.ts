import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { key_server } from '@env';
import { DongboDulieuComponent } from '../dongbo-dulieu/dongbo-dulieu.component';
import { DongboDulieuIctuComponent } from '../dongbo-dulieu-ictu/dongbo-dulieu-ictu.component';
import { ImportHvuMainComponent } from '../import-hvu/import-hvu-main/import-hvu-main.component';
import { ImportIctuMainComponent } from "../import-ictu/import-ictu-main/import-ictu-main.component";
import { ImportTuebaMainComponent } from '../import-tueba/import-tueba-main/import-tueba-main.component';

@Component({
    standalone: true,
    imports: [CommonModule, ImportHvuMainComponent, ImportIctuMainComponent, ImportTuebaMainComponent],
    selector: 'app-dongbo-dulieu-main',
    templateUrl: './dongbo-dulieu-main.component.html',
    styleUrls: ['./dongbo-dulieu-main.component.css']
})
export class DongboDulieuMainComponent implements OnInit {

    key_server = key_server;

    constructor() { }

    ngOnInit(): void {

    }
}
