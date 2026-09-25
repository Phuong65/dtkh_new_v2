import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {SharedModule} from "@shared/shared.module";
import {TableModule} from "primeng/table";
import {DonVi} from "@shared/models/don-vi";

import {DonViService} from "@shared/services/don-vi.service";
import {NotificationService} from "@core/services/notification.service";
import {ClassesService} from "@shared/services/classes.service";
import {SummaryService} from "@shared/services/summary.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {AuthService} from "@core/services/auth.service";
import {OvicQueryCondition} from "@core/models/dto";
import {ConditionOption} from "@shared/models/condition-option";
import {forkJoin, of, switchMap} from "rxjs";
import {ElnKhoaHocService} from "@shared/services/elearning-khoa-hoc.service";
import {ElnKhoaHoc} from "@shared/models/elng-khoa-hoc";
import {ChartModule} from "primeng/chart";
import {SplitterModule} from "primeng/splitter";
import {ExpExcelBaocaoService} from "@shared/services/exp-excel-baocao.service";

@Component({
    selector: 'app-bieudo-phodiem',
    standalone: true,
    imports: [CommonModule, ButtonModule, RippleModule, SharedModule, SharedModule, TableModule, SharedModule, ChartModule, SplitterModule],
    templateUrl: './bieudo-phodiem.component.html',
    styleUrls: ['./bieudo-phodiem.component.css']
})
export class BieudoPhodiemComponent implements OnInit {

    typeView: 'error' | 'loading' | 'start' | 'checked' = 'loading';//-1 err, 1: loadTrue,2:waiting;
    listHocky = [];
    listNamhoc = [];
    objectFilter = {};
    listDonvi: DonVi[];
    listCourse: any[] = [];
    courseSeleclt: ElnKhoaHoc = null;
    listData: any[] = [];
    changePecent: number = 0;// 0: 1: %
    optionChart: any = {};
    listSelectView: { label: string, value: string }[] = [
        {label: 'Môn', value: 'mon'},
        {label: 'Lớp học phần', value: 'lophocphan'},
    ]

    constructor(
        private donViService: DonViService,
        private notifi: NotificationService,
        private classesService: ClassesService,
        private summaryService: SummaryService,
        private httpHelper: HttpParamsHeplerService,
        private auth: AuthService,
        private expExcelBaocaoService :ExpExcelBaocaoService
    ) {
        this.optionChart = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {labels: {color: '#393939'}}
            },
            scales: {
                x: {
                    // ticks: {color: '#2a8eef'},
                    grid: {color: '#c8c8c8', drawBorder: false}
                },
                y: {
                    min: 0,
                    // ticks: {color: '#2a8eef'},
                    grid: {color: '#c8c8c8', drawBorder: false}
                }
            }
        };
    }

    ngOnInit(): void {
        this.loadInit()

    }

    loadInit() {
        this.changePecent = 0;
        this.typeView = "loading";
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
                {label: 'limit', value: '-1'},

            ]
        }

        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.donViService.getDonviByPageNew(conditionDonvi)
        ]).subscribe({
            next: ([_resNamhoc, _resHocky, donvi]) => {
                this.listDonvi = donvi.data;
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
                this.notifi.isProcessing(true);
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
                            this.objectFilter['hinhthuc'] = this.listSelectView[0].value;
                            this.notifi.isProcessing(false);
                        }, error: () => {
                            this.notifi.toastError('Lỗi kết nối');
                            this.notifi.isProcessing(false);
                        }

                    });
                }


                this.typeView = 'start';


            },
            error: () => {
                this.typeView = "error";
                this.notifi.toastError('Mất kết nối với máy chủ');
            }
        })
    }

    onChangeFilter(event, key: string) {

        if (key == 'donvi_id') {

            this.objectFilter[key] = event.id;
            this.objectFilter['course_id'] = null;
            // const condition: ConditionOption = {
            //     condition: [
            //         {
            //             conditionName: 'category_ids',
            //             condition: OvicQueryCondition.equal,
            //             value: event.id.toString(),
            //         },
            //         {
            //             conditionName: 'status',
            //             condition: OvicQueryCondition.notEqual,
            //             value: '-1',
            //         },
            //
            //
            //     ], page: '1',
            //     set: [
            //         {label: 'limit', value: '-1'},
            //         {label: 'select', value: 'id,title,category_ids,maso,params'}
            //     ]
            // }
            //
            //
            // this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).subscribe({
            //     next: ({data}) => {
            //         this.listCourse = data.filter(f=>f.params.exam_format = 'TRACNGHIEM');
            //
            //         // this.typeView = 'start';
            //
            //         if(this.objectFilter['hinhthuc'] == 'mon'){
            //             const object= {
            //                 namhoc: this.objectFilter['namhoc'],
            //                 hocky: this.objectFilter['hocky'],
            //                 course_id:0,
            //                 hinhthuc: this.objectFilter['hinhthuc'],
            //                 donvi_id: this.objectFilter['donvi_id']
            //
            //             }
            //             this.getDataSummary(object)
            //         }
            //
            //
            //     }, error: () => {
            //         this.typeView = "error";
            //         this.notifi.toastError('Mất kết nối với nhau')
            //     }
            // })
            this.typeView = 'start';

            if (this.objectFilter['hinhthuc'] == 'mon') {
                const object = {
                    namhoc: this.objectFilter['namhoc'],
                    hocky: this.objectFilter['hocky'],
                    course_id: 0,
                    hinhthuc: this.objectFilter['hinhthuc'],
                    donvi_id: this.objectFilter['donvi_id']

                }
                this.getDataSummary(object)
            }

        } else if (key == 'hinhthuc') {
            this.objectFilter[key] = event.value;

            if (event.value == 'mon') {
                this.courseSeleclt = null;
                this.objectFilter['course_id'] = null;

                const object = {
                    namhoc: this.objectFilter['namhoc'],
                    hocky: this.objectFilter['hocky'],
                    course_id: 0,
                    hinhthuc: this.objectFilter['hinhthuc'],
                    donvi_id: this.objectFilter['donvi_id']

                }
                if (!!this.objectFilter['donvi_id']) {
                    this.getDataSummary(object)
                }
            } else {
                this.listData = [];
                this.courseSeleclt = null;
                this.typeView = "start";
            }


        } else {
            this.objectFilter[key] = event.value;


            if (!!this.objectFilter['namhoc'] && !!this.objectFilter['hocky'] && !!this.objectFilter['donvi_id']) {
                if (this.objectFilter['hinhthuc'] == 'mon') {
                    const object = {
                        namhoc: this.objectFilter['namhoc'],
                        hocky: this.objectFilter['hocky'],
                        course_id: 0,
                        hinhthuc: this.objectFilter['hinhthuc'],
                        donvi_id: this.objectFilter['donvi_id']

                    }
                    this.getDataSummary(object)
                } else {
                    if (!!this.objectFilter['course_id']) {
                        const object = {
                            namhoc: this.objectFilter['namhoc'],
                            hocky: this.objectFilter['hocky'],
                            course_id: this.objectFilter['course_id'],
                            hinhthuc: this.objectFilter['hinhthuc'],
                            donvi_id: this.objectFilter['donvi_id']
                        }
                        this.getDataSummary(object)
                    }
                }
            }


        }

    }


    replacerViewPoint(point: number, total: number) {

        return total == 0 ? '0' : Math.round(point * 100 / total);

    }

    selectChangeTb(num: number) {
        this.changePecent = num;

        if (num == 0) {
            this.optionChart = {
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                plugins: {
                    legend: {
                        labels: {color: '#393939'}
                    }
                },
                scales: {
                    x: {
                        ticks: {color: '#2a8eef'},
                        grid: {color: '#c8c8c8', drawBorder: false}
                    },
                    y: {
                        min: 0,
                        ticks: {color: '#2a8eef'},
                        grid: {color: '#c8c8c8', drawBorder: false}
                    }
                }
            };
        } else {
            this.optionChart = {
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                plugins: {
                    legend: {
                        labels: {
                            color: '#393939'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#2a8eef'
                        },
                        grid: {
                            color: '#c8c8c8',
                            drawBorder: false
                        }
                    },
                    y: {
                        max: 100,
                        min: 0,
                        ticks: {
                            stepSize: 20, // bước nhảy giữa các giá trị
                            color: '#2a8eef',
                            callback: function (value) {
                                return value + ' %'; // nếu muốn thêm đơn vị
                            }
                        },
                        grid: {
                            color: '#c8c8c8',
                            drawBorder: false
                        },

                    }
                }
            };
        }


    }

    reload() {
        this.loadInit();
    }

    selecCourse(item: ElnKhoaHoc) {
        this.objectFilter['course_id'] = item.id;
        this.courseSeleclt = item;
        const object = {
            namhoc: this.objectFilter['namhoc'],
            hocky: this.objectFilter['hocky'],
            course_id: this.objectFilter['course_id'],
            hinhthuc: this.objectFilter['hinhthuc'],
            donvi_id: this.objectFilter['donvi_id']

        }
        this.getDataSummary(object)
    }

    getDataSummary(object: any) {

        this.typeView = "loading";

        forkJoin([
            this.summaryService.getBietdoPhodiem(object),
            this.summaryService.getBietdoPhodiem({
                namhoc: this.objectFilter['namhoc'],
                hocky: this.objectFilter['hocky'],
                course_id: 0,
                hinhthuc: 'mon',
                donvi_id: this.objectFilter['donvi_id']
            })
        ])
            .subscribe({
                next: ([data, dataCourse]) => {
                    this.listCourse = dataCourse;
                    this.selectChangeTb(this.changePecent);
                    this.listData = data.length > 0 ? data.map(m => {
                        const labels: number[] = [];
                        const dataPoints: number[] = [];
                        const dataPointsPecent: any[] = [];
                        for (let i = 0; i <= 10; i++) {
                            labels.push(i);
                            dataPoints.push(m['_point_' + i])
                            dataPointsPecent.push(this.replacerViewPoint(m['_point_' + i], m['_point_all']))
                        }
                        const dataChart = {
                            labels: labels,
                            datasets: [
                                {label: 'Điểm thi theo phổ điểm', data: dataPoints, tension: 0.4}
                            ]
                        };
                        // this.replacerViewPoint(m['_point_' + i], m['_point_all'], true)
                        const dataChartByPecent = {
                            labels: labels,
                            datasets: [{label: 'Điểm thi theo phổ điểm', data: dataPointsPecent, tension: 0.4}]
                        };

                        m['_dataChart'] = dataChart;
                        m['_dataChartByPecent'] = dataChartByPecent;
                        return m;
                    }) : [];

                    this.typeView = "checked";
                }, error: () => {
                    this.typeView = "error";
                    this.notifi.toastError('Mất kết nối với máy chủ');

                }
            })
    }


    sumByKey(arr, key) {
        return arr.reduce((total, item) => {
            const value = Number(item[key]) || 0; // ép về số, tránh lỗi nếu undefined/null
            return total + value;
        }, 0);
    }

    getTotalBylist(arr: any[], key: string) {
        if (arr.length == 0) {
            return 0;
        } else {
            if (key == 'course') {
                return arr.length;
            }
            return arr.reduce((total, item) => {
                const value = Number(item[key]) || 0; // ép về số, tránh lỗi nếu undefined/null
                return total + value;
            }, 0);
        }
    }

    btnExport(){
        this.notifi.loadingAnimationV2({process :{percent : 0}});

        this.summaryService.getBietdoPhodiem({
            namhoc: this.objectFilter['namhoc'],
            hocky: this.objectFilter['hocky'],
            course_id: 0,
            hinhthuc: 'all',
            donvi_id: 0
        }).pipe(switchMap(e=>{
            this.notifi.loadingAnimationV2({process :{percent : 50}});


            const conditionDonvi: ConditionOption = {
                condition: [
                    {conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and'},
                    {
                        conditionName: 'parent_id',
                        condition: OvicQueryCondition.equal,
                        value: '1',
                        orWhere: 'and'
                    },
                ],
                page: "1",
                set: [
                    {label: 'limit', value: '-1'},

                ]
            }

            return forkJoin([of(e),this.donViService.getDonviByPageNew(conditionDonvi)])
        })).subscribe({
            next:([data, donvi])=>{
                this.notifi.loadingAnimationV2({process :{percent : 100}});
                this.notifi.disableLoadingAnimationV2();
                const dataExport = data.length > 0 ? data.map((m,index)=>{
                    const khoa = donvi.data.length > 0 ? donvi.data.find(f=>f.id.toString() == m['category_ids'].toString()) : null;
                    const item  = {
                        _index: index +1,
                        maso : m['maso'],
                        title : m['title'],
                        khoa:khoa ? khoa['title']: ''
                    };
                    for (let i= 0; i<=10 ; i++){
                        item['_point_' + i] = m['_point_' + i]
                    }


                    return item;
                }) : [];

                if(dataExport.length > 0 ){
                    this.expExcelBaocaoService.exportPhodiem(dataExport,'bieudo-phodiem_' +this.objectFilter['namhoc'] +  '-' + this.objectFilter['hocky'], this.objectFilter['namhoc'],this.objectFilter['hocky'] )
                }else{
                    this.notifi.toastWarning('Không có dữ liệu');
                }
            },error:()=>{
                this.notifi.disableLoadingAnimationV2();
                this.notifi.toastError('Tải dữ liệu không thành công');
            }
        })
    }
}
