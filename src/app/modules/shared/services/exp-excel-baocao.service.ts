import { Injectable } from '@angular/core';
import {Workbook} from "exceljs";
import * as fs from 'file-saver';
import {asBlob} from "@shared/vendor/html-docx";
@Injectable({
  providedIn: 'root'
})
export class ExpExcelBaocaoService {



    exportExcel(object:any, title:string) {

        const wb = new Workbook();
        const worksheet = wb.addWorksheet('Danh sách Moon', { pageSetup: { paperSize: 9, orientation: 'portrait' } });

        worksheet.addRow( '');
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = 'TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG';
        this.setCellProperties(worksheet.getCell('A1'), 14, { bold: true });

        worksheet.addRow('');
        worksheet.mergeCells('A2:D2');
        worksheet.getCell('A2').value = 'PHÒNG KHẢO THÍ VÀ ĐẢM BẢO CHẤT LƯỢNG';
        this.setCellProperties(worksheet.getCell('A2'), 14, { bold: true });

        worksheet.addRow([""]);
        worksheet.mergeCells('A4:R4');
        worksheet.getCell('A4').value = 'TỔNG HỢP CÂU HỎI TRẮC NGHIỆM TRÊN HỆ THỐNG LMS';
        this.setCellProperties(worksheet.getCell('A4'), 14, { bold: true });


        worksheet.addRow([""]);
        const header =
            [
                [
                    "STT",
                    "Mã HP",
                    "Tên HP",
                    "Khoa quản lý",
                    "Bài 1",
                    "Bài 2",
                    "Bài 3",
                    "Bài 4",
                    "Bài 5",
                    "Bài 6",
                    "Bài 7",
                    "Bài 8",
                    "Bài 9",
                    "Bài 10",
                    "Bài 11",
                    "Bài 12",
                    "KTHP",
                    "Tổng",
                ],
            ]

        worksheet.pageSetup.margins = {
            left: 0, right: 0,
            top: 0.4, bottom: 0.4,
            header: 0.3, footer: 0.3
        };


        header.forEach((d, index) => {
            const row = worksheet.addRow(d);
            row.worksheet.pageSetup.showRowColHeaders = true;
            row.eachCell((cell, number) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFF' },
                    bgColor: { argb: 'FFFFFF' },
                };
                cell.font = { name: 'Times New Roman', family: 1, size: 12, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } }
                };
            });
        })

        const objectColWidth = {
            1: 6,
            2: 12,
            3: 24,
            4: 25,
            5: 13,
            6: 13,
            7: 13,
            8: 13,
            9: 13,
            10: 13,
            11: 13,
            12: 13,
            13: 13,
            14: 13,
            15: 13,
            16: 13,
            17: 13,
            18: 13,


        };

        this.setColWidth(worksheet, objectColWidth);

        // Get all columns from JSON
        let columnsArray: any[];
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                columnsArray = Object.keys(object[key]);
            }
        }
        //Add Data and Conditinal Formatting

        object.forEach((element: any) => {
            const eachRow = [];
            columnsArray.forEach((column) => {
                eachRow.push(element[column]);
            });

            if (element.isDeleted === 'Y') {
                const deleteRow = worksheet.addRow(eachRow);
                deleteRow.eachCell((cell) => {
                    cell.font = { name: 'Times New Roman', family: 4, size: 11, bold: false, strike: true };
                    cell.border = {
                        top: { style: 'thin', color: { argb: '333333' } },
                        left: { style: 'thin', color: { argb: '333333' } },
                        bottom: { style: 'thin', color: { argb: '333333' } },
                        right: { style: 'thin', color: { argb: '333333' } }
                    };
                })
            } else {
                const Row = worksheet.addRow(eachRow);
                Row.eachCell((cell, colNumber) => {
                    cell.font = { name: 'Times New Roman', family: 1, size: 13, bold: false };
                    cell.border = {
                        top: { style: 'thin', color: { argb: '333333' } },
                        left: { style: 'thin', color: { argb: '333333' } },
                        bottom: { style: 'thin', color: { argb: '333333' } },
                        right: { style: 'thin', color: { argb: '333333' } }
                    };

                    if (colNumber >4) { // Assuming colNumber 1 is the first column
                        cell.alignment = {vertical: 'middle', horizontal: 'center'};
                    }
                })
            }

        });


        wb.xlsx.writeBuffer().then(buffer => {
            const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(data, title + '.xlsx' );
        });


    }


    setColWidth(ws, cols: {}) {
        Object.keys(cols).forEach((f, key) => {
            ws.getColumn(Number(f)).width = cols[f];
        })
    }
    setCellProperties(cell, sizeNumber, options) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Times New Roman', size: sizeNumber, ...options };
    }

    //=================================================

    exportPhodiem(object:any, title:string, namhoc:string, hocky:any) {

        const wb = new Workbook();
        const worksheet = wb.addWorksheet('Danh sách', { pageSetup: { paperSize: 9, orientation: 'portrait' } });

        worksheet.addRow( '');
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = 'TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG';
        this.setCellProperties(worksheet.getCell('A1'), 14, { bold: true });

        worksheet.addRow('');
        worksheet.mergeCells('A2:D2');
        worksheet.getCell('A2').value = 'PHÒNG KHẢO THÍ VÀ ĐẢM BẢO CHẤT LƯỢNG';
        this.setCellProperties(worksheet.getCell('A2'), 14, { bold: true });

        worksheet.addRow([""]);
        worksheet.mergeCells('A4:O4');
        worksheet.getCell('A4').value = 'Biểu đồ phổ điểm năm học ' + namhoc + ' học kỳ ' + hocky ;
        this.setCellProperties(worksheet.getCell('A4'), 14, { bold: true });


        worksheet.addRow([""]);
        const header =
            [
                [
                    "STT",
                    "Mã HP",
                    "Tên HP",
                    "Khoa quản lý",
                    "Điểm 0",
                    "Điểm 1",
                    "Điểm 2",
                    "Điểm 3",
                    "Điểm 4",
                    "Điểm 5",
                    "Điểm 6",
                    "Điểm 7",
                    "Điểm 8",
                    "Điểm 9",
                    "Điểm 10",
                ],
            ]

        worksheet.pageSetup.margins = {
            left: 0, right: 0,
            top: 0.4, bottom: 0.4,
            header: 0.3, footer: 0.3
        };


        header.forEach((d, index) => {
            const row = worksheet.addRow(d);
            row.worksheet.pageSetup.showRowColHeaders = true;
            row.eachCell((cell, number) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFF' },
                    bgColor: { argb: 'FFFFFF' },
                };
                cell.font = { name: 'Times New Roman', family: 1, size: 12, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } }
                };
            });
        })

        const objectColWidth = {
            1: 6,
            2: 12,
            3: 30,
            4: 30,
            5: 13,
            6: 13,
            7: 13,
            8: 13,
            9: 13,
            10: 13,
            11: 13,
            12: 13,
            13: 13,
            14: 13,
            15: 13,



        };

        this.setColWidth(worksheet, objectColWidth);

        // Get all columns from JSON
        let columnsArray: any[];
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                columnsArray = Object.keys(object[key]);
            }
        }
        //Add Data and Conditinal Formatting

        object.forEach((element: any) => {
            const eachRow = [];
            columnsArray.forEach((column) => {
                eachRow.push(element[column]);
            });


                const Row = worksheet.addRow(eachRow);
                Row.eachCell((cell, colNumber) => {
                    cell.font = { name: 'Times New Roman', family: 1, size: 13, bold: false };
                    cell.border = {
                        top: { style: 'thin', color: { argb: '333333' } },
                        left: { style: 'thin', color: { argb: '333333' } },
                        bottom: { style: 'thin', color: { argb: '333333' } },
                        right: { style: 'thin', color: { argb: '333333' } }
                    };
                    cell.alignment = {wrapText: true, vertical: 'middle', horizontal: 'center'};

                    if([3,4].includes(colNumber)){
                        cell.alignment = {
                            wrapText: true,
                            vertical: 'middle',
                            horizontal: 'left'
                        };
                    }

                })


        });


        wb.xlsx.writeBuffer().then(buffer => {
            const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(data, title + '.xlsx' );
        });


    }
}
