import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'dashboard',
        // loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
        loadComponent: () => import('@modules/admin/features/home/home-baocao/home-baocao.component').then(c => c.HomeBaocaoComponent),

    },
    {
        path:'caycelo-noidungkhac',
        loadComponent: () => import('@modules/admin/features/thongke-solieu-tonghop/ketqua-caycelo-noidungkhac/ketqua-caycelo-noidungkhac.component').then(c => c.KetquaCayceloNoidungkhacComponent),
    },
    {
        path:'ketquatest-nghiemthucauhoi',
        loadComponent: () => import('@modules/admin/features/thongke-solieu-tonghop/ketqua-test-nghiemthu-cauhoi/ketqua-test-nghiemthu-cauhoi.component').then(c => c.KetquaTestNghiemthuCauhoiComponent),
    },
    {
        path:'ketquatest-nghiemthucauhoi-kthp',
        loadComponent: () => import('@modules/admin/features/thongke-solieu-tonghop/ketqua-nghiemthu-cauhoi-kthp/ketqua-nghiemthu-cauhoi-kthp.component').then(c => c.KetquaNghiemthuCauhoiKthpComponent),
    },
    {
        path:'ketquatest-nghiemthucauhoituluan-kthp',
        loadComponent: () => import('@modules/admin/features/thongke-solieu-tonghop/ketqua-nghiem-cauhoi-tuluan-kthp/ketqua-nghiem-cauhoi-tuluan-kthp.component').then(c => c.KetquaNghiemCauhoiTuluanKthpComponent),
    },
    {
        path:'ketquatest-sinhvien',
        loadComponent: () => import('@modules/admin/features/thongke-solieu-tonghop/ketqua-test-sinhvien/ketqua-test-sinhvien.component').then(c => c.KetquaTestSinhvienComponent),
    },
    {
        path:'ketqua-testtuan-sinhvien',
        loadComponent: () => import('@modules/admin/features/thongke-solieu-tonghop/ketqua-testtuan-sinhvien/ketqua-testtuan-sinhvien.component').then(c => c.KetquaTesttuanSinhvienComponent),
    },
    {
        path: 'thong-tin-tai-khoan',
        loadComponent: () => import('@modules/admin/features/he-thong/thong-tin-tai-khoan/thong-tin-tai-khoan.component').then(c => c.ThongTinTaiKhoanComponent),
    },
    {
        path: 'trogiup-kythuat',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BaoCaoRoutingModule { }
