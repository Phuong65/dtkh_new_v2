import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { OvicQueryCondition } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@shared/models/condition-option';
import { DonVi } from '@shared/models/don-vi';
import { ClassesService } from '@shared/services/classes.service';
import { Courses } from '@shared/services/courses.service';
import { DonViService } from '@shared/services/don-vi.service';
import { SummaryService } from '@shared/services/summary.service';
import { SharedModule } from '@shared/shared.module';
import { KqChartComponent } from '@modules/admin/features/khao-thi/ketqua-thi/kq-chart/kq-chart.component';

@Component({
    selector: 'app-ketqua-thi',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule, TableModule, SharedModule, KqChartComponent],
    templateUrl: './ketqua-thi.component.html',
    styleUrls: ['./ketqua-thi.component.css']
})
export class KetquaThiComponent implements OnInit, OnDestroy {
    @ViewChild('viewByCourse') viewByCourse: TemplateRef<any>;
    listHocky = [];

    listNamhoc = [];

    objectFilter: Record<string, any> = {};

    listDonvi: DonVi[];
    donviSelect: DonVi;

    listData: Courses[] = [];
    sizeFullWidth = 1024;
    subscription = new Subscription();

    openSideBar = false;

    constructor(
        private notifi: NotificationService,
        private summaryService: SummaryService,
        private classesService: ClassesService,
        private httpHelper: HttpParamsHeplerService,
        private donViService: DonViService,
        private auth: AuthService
    ) {
        const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width);
        this.subscription.add(observerOnResize);
    }

    ngOnInit(): void {
        this.loadInit();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    loadInit() {
        const condition_group_namhoc = this.httpHelper.paramsConditionBuilder([
            {conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and'},
        ]).set('order', 'DESC').set('orderby', 'namhoc').set('groupby', 'namhoc').set('limit', -1);
        const condition_group_hocky = this.httpHelper.paramsConditionBuilder([
            {conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and'},
        ]).set('order', 'DESC').set('orderby', 'hocky').set('groupby', 'hocky').set('limit', -1);

        const conditionDonvi: ConditionOption = {
            condition: [
                {conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and'},
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                    orWhere: 'and'
                },
            ],
            page: "1",
            set: [
                {label: 'limit:', value: '-1'},

            ]
        }

        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.donViService.getDonviByPageNew(conditionDonvi)
        ]).subscribe({
            next: ([_resNamhoc, _resHocky, donvi]) => {
                this.listDonvi = [...[{id:0,title:'Tất cả'}as DonVi],...donvi.data];
                const tmpNamHoc = [];

                const tmpHocky = [];

                _resNamhoc.forEach((f) => {
                    if (f['namhoc']) {
                        tmpNamHoc.push({
                            value: f['namhoc'],
                            label: ''.concat(f['namhoc']),
                        });
                    }
                });

                _resHocky.forEach((f) => {
                    if (f['hocky']) {
                        tmpHocky.push({
                            value: f['hocky'],
                            label: 'HK '.concat(f['hocky']),
                        });
                    }
                });

                this.listNamhoc = tmpNamHoc;

                this.listHocky = tmpHocky;

                if (this.listNamhoc && this.listNamhoc[0] && this.listNamhoc[0]['value']) {
                    const condition_group_hocky_end = this.httpHelper.paramsConditionBuilder([
                        {conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1'},
                        {
                            conditionName: 'namhoc',
                            condition: OvicQueryCondition.equal,
                            value: this.listNamhoc[0]['value'],
                            orWhere: 'and'
                        },
                    ]).set('order', 'DESC').set('orderby', 'hocky').set('groupby', 'hocky');

                    this.classesService.getClassesByCols(condition_group_hocky_end).subscribe({
                        next: (_res) => {
                            const hocky_first = this.listHocky && this.listHocky[0] && this.listHocky[0]['value'] ? this.listHocky[0]['value'] : null;

                            this.objectFilter['namhoc'] = this.listNamhoc && this.listNamhoc[0] && this.listNamhoc[0]['value'] ? this.listNamhoc[0]['value'] : null;

                            this.objectFilter['hocky'] = _res.length && _res[0] && _res[0]['hocky'] ? _res[0]['hocky'] : hocky_first;
                            this.objectFilter['donvi_id'] = this.listDonvi.length > 0 ? this.listDonvi[0].id : null;
                            this.objectFilter['parent_id'] = this.auth.user.donvi_id.toString();


                            this.loadData();
                        }, error: () => {
                            this.notifi.toastError('Lỗi kết nối');
                            this.notifi.isProcessing(false);
                        }
                    })

                } else {
                    this.notifi.toastError('Lỗi kết nối');
                    this.notifi.isProcessing(false);
                }

            }, error: () => {
                this.notifi.isProcessing(false);
                this.notifi.toastError('Mất kết nối với máy chủ ');

            }
        })
    }

    loadData() {
        this.notifi.isProcessing(true);

        this.summaryService.getKhaothiKetquathi(this.objectFilter['namhoc'], this.objectFilter['hocky'], this.objectFilter['donvi_id'],this.objectFilter['parent_id']).subscribe({
            next: (data) => {
                this.listData = [...data].sort((a,b)=>b['_total_students'] - a['_total_students']);
                this.notifi.isProcessing(false);

            }, error: () => {
                this.notifi.isProcessing(false);

            }
        })
    }

    onChangeFilter(event, key: string) {

        if (event && key !== 'donvi_id') {
            this.objectFilter[key] = event['value'];
        } else if (event) {
            this.objectFilter[key] = event.id;
            this.donviSelect = this.listDonvi.find(f=>f.id == event.id);
        }
        this.loadData();

    }

    changeView:number = 0;//0: số // 1: %
    selectChangeTb(num:number){
        this.changeView = num;
    }
    replacerViewPoint(point:number,total:number){

        if(total == 0){
            return '0%';
        }else{
            return Math.round(point*100 / total) + '%';
        }
    }


    courseSelect: Courses= null;
    viewClassAndChart(row:Courses){
        this.courseSelect = {...row};
        this.notifi.openSideNavigationMenu({size:this.sizeFullWidth,name:'',template:this.viewByCourse,offsetTop:'0px'})
    }
    closeForm(){
        this.notifi.closeSideNavigationMenu()
    }

}

