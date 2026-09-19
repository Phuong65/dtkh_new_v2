import { Injectable } from '@angular/core';
import {Workbook} from "exceljs";
import * as fs from 'file-saver';
import {asBlob} from "@shared/vendor/html-docx";
@Injectable({
  providedIn: 'root'
})
export class ExportExcelBaocaoUpdateDataService {
    constructor() { }

    exportToLong(object:any[], title:string) {

        const wb = new Workbook();
        const worksheet = wb.addWorksheet('Danh sách Môn học', { pageSetup: { paperSize: 9, orientation: 'portrait' } });


        const maxRows = 1000; // Số hàng tối đa bạn muốn định nghĩa
        const maxCols = 1000;  // Số cột tối đa bạn muốn định nghĩa

        // Khởi tạo tất cả các ô trong lưới
        // for (let i = 1; i <= maxRows; i++) {
        //     for (let j = 1; j <= maxCols; j++) {
        //         const cell = worksheet.getCell(i, j); // Lấy từng ô
        //         cell.value = ''; // Đảm bảo ô tồn tại
        //         cell.fill = {
        //             type: 'pattern',
        //             pattern: 'solid',
        //             fgColor: { argb: '808080' }, // Màu xám nhạt
        //         };
        //     }
        // }

        // const text_header = 'TRẠNG THÁI ĐĂNG KÝ THI TNU ('+ title +')';
        // worksheet.addRow([text_header]);
        // worksheet.addRow([""]);
        const header =
            [
                [
                    "TT",
                    "Tên môn",
                    "Mã môn",
                    "Số tính chỉ",
                    "CDR",
                    "Hình thức thi",
                    "Người phụ trách",
                    "Số bài",
                    "Mục tiêu môn học",
                    "Bài 1",
                    null,
                    null,
                    null,
                    null,

                    "Bài 2",
                    null,
                    null,
                    null,
                    null,
                    "Bài 3",
                    null,
                    null,
                    null,
                    null,
                    "Bài 4",
                    null,
                    null,
                    null,
                    null,
                    "Bài 5",
                    null,
                    null,
                    null,
                    null,
                    "Bài 6",
                    null,
                    null,
                    null,
                    null,
                    "Bài 7",
                    null,
                    null,
                    null,
                    null,
                    "Bài 8",
                    null,
                    null,
                    null,
                    null,
                    "Bài 9",null,
                    null,
                    null,
                    null,
                    "Bài 10",
                    null,
                    null,
                    null,
                    null,
                    "Bài 11",
                    null,
                    null,
                    null,
                    null,
                    "Bài 12",
                    null,
                    null,
                    null,
                    null,
                ],
                [
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",
                    "Cây celo",
                    "Nội dung",
                    "Bài giảng",
                    "Slide",
                    "Video",

                ]
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
                cell.font = { name: 'Times New Roman', family: 1, size: 12, bold: true, };
                cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } }
                };
            });
        })


        worksheet.mergeCells('A1:A2');
        this.setCellProperties(worksheet.getCell('A1'), 14, { bold: true });
        worksheet.mergeCells('B1:B2');
        this.setCellProperties(worksheet.getCell('B1'), 14, { bold: true });
        worksheet.mergeCells('C1:C2');
        this.setCellProperties(worksheet.getCell('C1'), 14, { bold: true });
        worksheet.mergeCells('D1:D2');
        this.setCellProperties(worksheet.getCell('D1'), 14, { bold: true });
        worksheet.mergeCells('E1:E2');
        this.setCellProperties(worksheet.getCell('E1'), 14, { bold: true });
        worksheet.mergeCells('F1:F2');
        this.setCellProperties(worksheet.getCell('F1'), 14, { bold: true });
        worksheet.mergeCells('G1:G2');
        this.setCellProperties(worksheet.getCell('G1'), 14, { bold: true });
        worksheet.mergeCells('H1:H2');
        this.setCellProperties(worksheet.getCell('H1'), 14, { bold: true });
        worksheet.mergeCells('I1:I2');
        this.setCellProperties(worksheet.getCell('I1'), 14, { bold: true });

        //check
        worksheet.mergeCells('J1:N1');
        this.setCellProperties(worksheet.getCell('J1'), 14, { bold: true });

        worksheet.mergeCells('O1:S1');
        this.setCellProperties(worksheet.getCell('O1'), 14, { bold: true });

        worksheet.mergeCells('T1:X1');
        this.setCellProperties(worksheet.getCell('T1'), 14, { bold: true });

        worksheet.mergeCells('Y1:AC1');
        this.setCellProperties(worksheet.getCell('Y1'), 14, { bold: true });

        worksheet.mergeCells('AD1:AH1');
        this.setCellProperties(worksheet.getCell('AD1'), 14, { bold: true });

        worksheet.mergeCells('AI1:AM1');
        this.setCellProperties(worksheet.getCell('AI1'), 14, { bold: true });

        worksheet.mergeCells('AN1:AR1');
        this.setCellProperties(worksheet.getCell('AN1'), 14, { bold: true });
        worksheet.mergeCells('AS1:AW1');
        this.setCellProperties(worksheet.getCell('AS1'), 14, { bold: true });
        worksheet.mergeCells('AX1:BB1');
        this.setCellProperties(worksheet.getCell('AX1'), 14, { bold: true });
        worksheet.mergeCells('BC1:BG1');
        this.setCellProperties(worksheet.getCell('BC1'), 14, { bold: true });
        worksheet.mergeCells('BH1:BL1');
        this.setCellProperties(worksheet.getCell('BH1'), 14, { bold: true });
        worksheet.mergeCells('BM1:BQ1');
        this.setCellProperties(worksheet.getCell('BM1'), 14, { bold: true });


        const objectColWidth = {
            1: 6,
            2: 45,
            3: 16,
            4: 18,
            5: 9,
            6: 16,
            7: 23,
            8: 12,
            9: 11,


        };

        this.setColWidth(worksheet, objectColWidth);

        // Get all columns from JSON
        // let columnsArray: any[];
        // for (const key in object) {
        //     if (object.hasOwnProperty(key)) {
        //         columnsArray = Object.keys(object[key]);
        //         console.log(columnsArray);
        //     }
        // }

        const allKeys = new Set<string>();

        // gom tất cả key duy nhất từ tất cả object
        object.forEach(obj => {
            Object.keys(obj).forEach(key => allKeys.add(key));
        });

        const columnsArray = Array.from(allKeys);
        // console.log(columnsArray);

        object.forEach((element) => {
            const eachRow = [];
            columnsArray.forEach((column) => {
                eachRow.push(element[column]);
            });

            // addRow trả về ExcelJS Row object
            const row = worksheet.addRow(eachRow);

            // Thiết lập alignment cho từng cell
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const arrCenterItem = [1,4,5,6,8,9];
                if (colNumber > 9 || arrCenterItem.includes(colNumber)) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                }else{
                    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                }

                cell.fill= {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F2F2F2' }}
                cell.border ={
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } }
                }
            });
        });




        wb.xlsx.writeBuffer().then(buffer => {
            const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(data, title +'.xlsx' );
        });


    }
    setColWidth(ws, cols: {}) {
        Object.keys(cols).forEach((f, key) => {
            ws.getColumn(Number(f)).width = cols[f];
        })
    }
    setCellProperties(cell, sizeNumber, options) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true  };
        cell.font = { name: 'Times New Roman', size: sizeNumber, ...options };
        cell.fill= {type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' }}
    }



}
