import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_CONFIGS } from '@env';

const loadNewCom = APP_CONFIGS.loadNewCom;

const routes: Routes = [
    {
        path: 'dashboard',
        // loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
        loadComponent: () => import('@modules/admin/features/home/home-khaothi/home-khaothi.component').then(c => c.HomeKhaothiComponent),
    },
    {
        path: 'cauhoi-tracnghiem',
        // loadComponent: () => import('@modules/admin/features/cauhoi-tracnghiem/topical-question-bank/topical-question-bank.component').then(c => c.TopicalQuestionBankComponent),
        ...(loadNewCom
            ? { loadChildren: () => import('@modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem.module').then(m => m.CauhoiTracnghiemModule) }
            : { loadComponent: () => import('@modules/admin/features/cauhoi-tracnghiem/topical-question-bank-v2/topical-question-bank-v2.component').then(c => c.TopicalQuestionBankV2Component) }
        )
    },
    {
        path: 'cauhoi-thuchanh',
        loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh/cauhoi-ketthuc-hocphan/cauhoi-ketthuc-hocphan.component').then(c => c.CauhoiKetthucHocphanComponent),
    },
    {
        path: 'cauhoi-thuchanh-kthp',
        loadChildren: () => import('@modules/admin/features/cauhoi-thuchanh-kthp/cauhoi-thuchanh-kthp.module').then(m => m.CauhoiThuchanhKTHPModule)
    },
    {
        path: 'tao-cautrucde',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/form-de-main/form-de-main.component').then(c => c.FormDeMainComponent),
    },
    {
        path: 'tao-cathi-tn',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/tao-cathi/tao-cathi.component').then(c => c.TaoCathiComponent),
    },
    {
        path: 'theodoi-cathi',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/theodoi-cathi/theodoi-cathi.component').then(c => c.TheodoiCathiComponent),
    },
    {
        path: 'theodoi-cathi/phongthi',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/phongthi/phongthi.component').then(c => c.PhongthiComponent),
    },
    {
        path: 'theodoi-cathi/phongthi-duan',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/phongthi-duan/phongthi-duan.component').then(c => c.PhongthiDuanComponent),
    },
    {
        path: 'tao-cathi-th',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/tao-cathi-thuchanh/tao-cathi-thuchanh.component').then(c => c.TaoCathiThuchanhComponent),
    },
    {
        path: 'tao-cathi-duan',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/tao-cathi-duan/tao-cathi-duan.component').then(c => c.TaoCathiDuanComponent),
    },
    {
        path: 'thongke-cathi',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/thongke-cathi/thongke-cathi/thongke-cathi.component').then(c => c.ThongkeCathiComponent),
    },
    {
        path: 'xuat-baithi',
        loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/xuat-baithi/xuat-baithi.component').then(c => c.XuatBaithiComponent),
        // loadComponent: () => import('@modules/admin/features/thikethuc-hocphan/xuat-baithi-root/xuat-baithi-root.component').then(c => c.XuatBaithiRootComponent),

    },
    {
        path: 'xoa-dulieuthi',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'ketqua-thi',
        loadComponent: () => import('@modules/admin/features/khao-thi/ketqua-thi/ketqua-thi.component').then(c => c.KetquaThiComponent),
    },
    {
        path: 'tanxuat-sudung',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'bieudo-phodiem',
        loadComponent: () => import('@modules/admin/features/khao-thi/bieudo-phodiem/bieudo-phodiem.component').then(c => c.BieudoPhodiemComponent),
        // loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'tracuu-logs',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'xoa-logs',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
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

export class KhaoThiRoutingModule { }
