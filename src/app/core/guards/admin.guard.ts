import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanActivateChildFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivateChild {

    constructor(
        private auth: AuthService,
        private router: Router
    ) { }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const currentRoute = state.url.replace('/admin/', '').split('?')[0];

        if (currentRoute.startsWith('hoi-dong/duyetnoidung/duyet-cauhoi-tn-detail/')) {
            return true;
        }

        if (currentRoute.startsWith('hoi-dong/duyetnoidung/duyet-thuongxuyen-duan-detail/')) {
            return true;
        }

        if (currentRoute.startsWith('hoi-dong/duyetnoidung/duyet-thuongxuyen-tuluan-detail/')) {
            return true;
        }

        if (currentRoute.startsWith('hoi-dong/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/')) {
            return true;
        }

        return (currentRoute !== 'content-none' && !this.auth.userCanAccess(currentRoute)) ? this.router.navigate(['/admin/content-none']) : true;
    }
}

export const adminGuardChild: CanActivateChildFn = (route, state) => inject(AdminGuard).canActivateChild(route, state);
