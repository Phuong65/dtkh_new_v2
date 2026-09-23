import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { ChamDiemKiemtraDaugioComponent } from './cham-diem-kiemtra-daugio.component';

@Injectable({ providedIn: 'root' })
export class ChamDiemKiemtraDaugioGuard implements CanDeactivate<ChamDiemKiemtraDaugioComponent> {
    canDeactivate(component: ChamDiemKiemtraDaugioComponent): Observable<boolean> | Promise<boolean> | boolean {
        return component.requestDeactivate();
    }
}
