import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CauhoiKetthucHocphanComponent } from './cauhoi-ketthuc-hocphan/cauhoi-ketthuc-hocphan.component';
import { SinhdeThuchanhComponent } from './sinhde-thuchanh/sinhde-thuchanh.component';
const routes: Routes = [
	// {
	// 	path: 'tracnghiem',
	// 	component: CauhoiKetthucHocphanComponent,
	// 	data: { state: 'tracnghiem' }
	// },
	{
		path: 'thuchanh',
		component: CauhoiKetthucHocphanComponent,
		data: { state: 'thuchanh' }
	},
	{
		path: 'sinhde',
		component: SinhdeThuchanhComponent,
		data: { state: 'thuchanh' }
	},
];


@NgModule( {
	imports: [ RouterModule.forChild( routes ) ],
	exports: [ RouterModule ]
} )
export class CauhoiKetthucHocphanRoutingModule { }
