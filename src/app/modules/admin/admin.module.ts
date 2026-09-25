import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';

import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MessageModule } from 'primeng/message';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { NgApexchartsModule } from 'ng-apexcharts';

import { DashboardComponent } from '@modules/admin/dashboard/dashboard.component';
import { UserInfoComponent } from '@modules/admin/dashboard/user-info/user-info.component';
import { PopoverModule } from 'primeng/popover';
import { MenuLanguageComponent } from '@modules/admin/dashboard/menu-language/menu-language.component';
import { TranslateModule } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { MenuV2Component } from './dashboard/menu-v2/menu-v2.component';

@NgModule({
    declarations: [
        DashboardComponent,
  
        UserInfoComponent,
        MenuLanguageComponent,

        MenuV2Component,

    ],
    imports: [

        // AdminDashboardComponent,
        CommonModule,
        AdminRoutingModule,
        MenuModule,
        PanelMenuModule,
        MessageModule,
        ScrollPanelModule,
        ButtonModule,
        RippleModule,
        InputTextModule,
        NgApexchartsModule,
        PopoverModule,
        TranslateModule,
        SelectModule,
        FormsModule,
        ChartModule,

    ],
})
export class AdminModule { }
