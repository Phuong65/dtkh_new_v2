import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as exceljs from 'exceljs';
import * as XLSX from 'xlsx';
import { count } from 'rxjs/operators';
import { KEY_ANSWER_new } from '../utils/syscat'
import { APP_CONFIGS } from '@env';


@Injectable({
    providedIn: 'root'
})

export class ExportBaitapbotroService {

    app_config = APP_CONFIGS;

    constructor() { }

    fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    fileExtension = '.xlsx';

    public exportExcel(
        data: any[],
        header: any[],
        title: string,
        titleFont: any,
        mergerCellsTitle = null,
        rowFont: any,
        headerFont: any,
        tenDonvi: string,
        donviFont: any,
        countbothi: number,
        countDat: number,
        countKhongdat: number,
        tong: number,
        fileName: string,
        colsStyle?: any,
        where?: string,
    ): void {
        const wb = new exceljs.Workbook();
        const ws = wb.addWorksheet('Car');
        const tenTructhuoc = ws.addRow([this.app_config.donviquanly.toUpperCase()]);
        const tendonvi = ws.addRow([this.app_config.donvitructhuoc.toUpperCase()]);
        const titleRow = ws.addRow([title]);
        titleRow.font = titleFont;
        titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
        tendonvi.font = donviFont;
        const tenlop = ws.addRow(['Lớp: ', tenDonvi]);
        tenTructhuoc.font = { name: 'Times New Roman', family: 1, size: 11 };
        ws.mergeCells('A1:C1');
        ws.getCell('A1', 'C1').alignment = { vertical: 'middle', horizontal: 'center' };
        ws.mergeCells('A2:C2');
        ws.getCell('A2', 'C2').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        // ws.mergeCells('A3:G3');
        if (mergerCellsTitle) {
            ws.mergeCells(mergerCellsTitle);
            ws.getCell(mergerCellsTitle.split(':')[0], mergerCellsTitle.split(':')[1]).font = titleFont;
            ws.getCell(mergerCellsTitle.split(':')[0], mergerCellsTitle.split(':')[1]).alignment = { vertical: 'middle', horizontal: 'center' };
        }
        const headerRow = ws.addRow(header);
        headerRow.font = headerFont;
        headerRow.eachCell((cell, number) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F2F2F2' },
                bgColor: { argb: 'F2F2F201' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            //const col      = ws.getColumn( number );
            cell.border = {
                top: { style: 'thin', color: { argb: '333333' } },
                left: { style: 'thin', color: { argb: '333333' } },
                bottom: { style: 'thin', color: { argb: '333333' } },
                right: { style: 'thin', color: { argb: '333333' } }
            };
            //ws.getRow( number ).hidden = true;
            //col.width = 30;
        });
        if (!where) {
            ws.getColumn(1).width = 5.28;
            ws.getColumn(2).width = 30.53;
            ws.getColumn(3).width = 20;
            ws.getColumn(4).width = 20;
            ws.getColumn(5).width = 20;
            ws.getColumn(6).width = 20;
            ws.getColumn(7).width = 20;
            ws.getColumn(8).width = 20;
            ws.getColumn(9).width = 20;
            ws.getColumn(10).width = 20;
            ws.getColumn(11).width = 20;
            ws.getColumn(12).width = 20;
            ws.getColumn(13).width = 20;
        } else {
            ws.getRow(2).height = 37.5;
            ws.getRow(3).height = 31.13;
            ws.getColumn(1).width = 5.28;
            ws.getColumn(2).width = 20.14;
            ws.getColumn(3).width = 20.14;
            ws.getColumn(4).width = 20.14;
            ws.getColumn(5).width = 20.14;
            ws.getColumn(6).width = 20.14;
            ws.getColumn(7).width = 20.14;
            ws.getColumn(8).width = 20.14;
            ws.getColumn(9).width = 20.14;
            ws.getColumn(10).width = 20.14;
            ws.getColumn(11).width = 20.14;
            ws.getColumn(12).width = 20.14;
            ws.getColumn(13).width = 20.14;
        }

        // Cell Style : Fill and Border
        data.forEach((d, index) => {
            const row = ws.addRow(d);
            row.font = rowFont;
            row.height = 31.13;
            row.eachCell((cell, number) => {
                if (number === 2) {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                }
                cell.border = {
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } }
                };

            });
        }
        );
        if (!where) {
        }
        wb.xlsx.writeBuffer().then((data) => {
            this.saveExcelFile(data, fileName);
        });
    }

    private saveExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: this.fileType });
        FileSaver.saveAs(data, fileName + this.fileExtension);
    }
}
