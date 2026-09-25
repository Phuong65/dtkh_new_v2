import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Courses} from "@shared/services/courses.service";
import {Classes} from "@shared/models/classes";
import {TableModule} from "primeng/table";

import {User} from "@core/models/user";
import {ChartModule} from "primeng/chart";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";

@Component({
    selector: 'app-kq-chart',
    standalone: true,
    imports: [CommonModule, TableModule, ChartModule, ButtonModule, RippleModule],
    templateUrl: './kq-chart.component.html',
    styleUrls: ['./kq-chart.component.css']
})
export class KqChartComponent implements OnInit {

    documentStyle = getComputedStyle(document.documentElement);
    textColor = this.documentStyle.getPropertyValue('--text-color');

    changeViewPecent: number = 0; // 1:%
    @Input() set dataParam(data: Courses) {
        this.changeViewPecent = 0;

        this.loadInit(data);

        this.setDataChart(data)
    }

    course: Courses;


    listData: User[];


    dataChart: any;
    optionChart: any;


    dataChartClass: any;
    optionsChartClass: any;
    dataChartStudent: any;


    constructor() {
    }

    ngOnInit(): void {
    }

    loadInit(data: Courses) {
        this.course = data;
        this.listData = data['_users']
    }

    btnSelectClass(item: Classes) {

    }

    setDataChart(data: Courses) {
        const user: User[] = data['_users'];
        // console.log(users);
        this.dataChartClass = {
            labels: Array.from(user.map(m => m.display_name)),
            datasets: [
                {
                    label: 'Lớp quản lý',
                    data: Array.from(user.map(m => parseInt(m['_total_classes']))),
                    backgroundColor: Array.from(user.map(m => 'rgba(255, 159, 64, 0.2)')),
                    // hoverBackgroundColor: Array.from(user.map(m=>'rgb(255, 159, 64)')),
                    borderColor: Array.from(user.map(m => 'rgb(255, 159, 64)')),
                    borderWidth: 1
                }
            ]

        }

        this.optionsChartClass = {
            cutout: '60%',
            plugins: {
                legend: {
                    labels: {
                        color: this.textColor
                    }
                }
            }
        };

        console.log(user.map(m => parseInt(m['_total_students'])))
        this.dataChartStudent = {
            labels: Array.from(user.map(m => m.display_name)),
            datasets: [
                {
                    data: Array.from(user.map(m => parseInt(m['_total_students']))),
                    // backgroundColor: user.map(m => this.getRandomColor),
                    // hoverBackgroundColor: [this.documentStyle.getPropertyValue('--blue-400'), this.documentStyle.getPropertyValue('--yellow-400'), this.documentStyle.getPropertyValue('--green-400')]
                }
            ]
        };


        const labels: number[] = []  ;

        for(let i = 1; i<= 10;i++){
            labels.push(i);
        }
        this.dataChart = {
            labels: labels,

            datasets: Array.from(this.listData.map(m => {

                const dataPoints :any[] = [];

                for(let i = 1; i <= 10; i++){
                    dataPoints.push(this.changeViewPecent == 0 ? m['_point_' + i]+'' : this.replacerViewPoint(m['_point_' + i], m['_point_all'], true)+'' )
                }

                return {
                    label: m.display_name,
                    data: dataPoints,
                    tension: 0.4
                }
            }))
        }


        this.optionChart = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {color: '#393939'}
                }
            },
            scales: {
                x: {ticks: {color: '#2a8eef'},
                    grid: {color: '#c8c8c8', drawBorder: false}
                },
                y: {
                    ticks: {color: '#2a8eef'},
                    grid: {color: '#c8c8c8', drawBorder: false}
                }
            }
        };

    }

    replacerViewPoint(point: number, total: number, isPecent?: boolean) {

        if (total == 0) {
            return isPecent ? 0 : '0%';
        } else {
            return isPecent ? Math.round(point * 100 / total) : Math.round(point * 100 / total) + '%';
        }
    }

    selectChangeTb(num: number) {
        this.changeViewPecent = num;

        const labels: number[] = []  ;

        for(let i = 1; i<= 10;i++){
            labels.push(i);
        }
        this.dataChart = {
            labels: labels,

            datasets: Array.from(this.listData.map(m => {
                const dataPoints :number[] = [];

                for(let i = 1; i<= 10;i++){
                    dataPoints.push(this.changeViewPecent == 0 ? m['_point_' + i] : this.replacerViewPoint(m['_point_' + i], m['_point_all'], true) )
                }

                return {
                    label: m.display_name,
                    data: dataPoints,
                    tension: 0.4
                }
            }))
        };

        if(num == 0){
            this.optionChart = {
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                plugins: {
                    legend: {
                        labels: {color: '#393939'}
                    }
                },
                scales: {
                    x: {ticks: {color: '#2a8eef'},
                        grid: {color: '#c8c8c8', drawBorder: false}
                    },
                    y: {
                        ticks: {color: '#2a8eef'},
                        grid: {color: '#c8c8c8', drawBorder: false}
                    }
                }
            };
        }else{
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
                        max:100,
                        min:0,
                        ticks: {
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
}


