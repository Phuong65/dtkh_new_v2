import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginV2Component } from './features/login-v2/login-v2.component';
import { ContentNoneComponent } from './features/content-none/content-none.component';
import { UnauthorizedComponent } from './features/unauthorized/unauthorized.component';
import { ClearComponent } from './features/clear/clear.component';
import { TraCuuComponent } from '@modules/public/features/tra-cuu/tra-cuu.component';
import { LoginTemplateV3Component } from '@modules/public/features/login-template-v3/login-template-v3.component';
import { LoginTemplateV4Component } from '@modules/public/features/login-template-v4/login-template-v4.component';
import { IndexComponent } from '@modules/public/features/index/index.component';
import { ResetPasswordComponent } from './features/reset-password/reset-password.component';
import { LoginTemplateIctuComponent } from './features/login-template-ictu/login-template-ictu.component';
import { LoginMainTemplateComponent } from './features/login-main-template/login-main-template.component';
import { HuongDanPublicComponent } from './features/huong-dan-public/huong-dan-public.component';
import RedirectUriCallBackComponent from './features/redirect-uri-call-back/redirect-uri-call-back/redirect-uri-call-back.component';
const routes: Routes = [
    // {
    // 	path      : 'unauthorized' ,
    // 	component : UnauthorizedComponent
    // } ,
    // {
    // 	path      : 'clear' ,
    // 	component : ClearComponent
    // } ,
    // {
    // 	path      : 'login' ,
    // 	component : LoginTemplateV4Component
    // } ,
    {
        path: 'reset-password',
        component: ResetPasswordComponent
    },
    {
        path: 'huong-dan',
        component: HuongDanPublicComponent
    },
    {
        path: 'huong-dan',
        component: HuongDanPublicComponent
    },
    {
        path: 'redirect-uri-call-back',
        component: RedirectUriCallBackComponent
    },
    // {
    // 	path         : 'basic' ,
    // 	loadChildren : () => import('./features/basic/basic.module').then( m => m.BasicModule )
    // } ,
    {
        path: '',
        component: LoginMainTemplateComponent
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'prefix'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PublicRoutingModule { }
