import { Injectable, inject } from '@angular/core';
import { CanDeactivate, CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { ChamDiemKiemtraDaugioComponent } from './cham-diem-kiemtra-daugio.component';

@Injectable({ providedIn: 'root' })
export class ChamDiemKiemtraDaugioGuard implements CanDeactivate<ChamDiemKiemtraDaugioComponent> {
    canDeactivate(component: ChamDiemKiemtraDaugioComponent): Observable<boolean> | Promise<boolean> | boolean {
        return component.requestDeactivate();
    }
}

export const chamDiemKiemtraDaugioGuard: CanDeactivateFn<ChamDiemKiemtraDaugioComponent> = (component) => inject(ChamDiemKiemtraDaugioGuard).canDeactivate(component);
