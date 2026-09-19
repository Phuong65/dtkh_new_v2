import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as exceljs from 'exceljs';
import * as XLSX from 'xlsx';
import { count } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ExportExcelNewService {

    constructor() { }

    fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    fileExtension = '.xlsx';

    public exportExcel(
        headerData,
        tableHeader,
        data: any[],
        footerData,
        mergesData,
        cols,
        objectColWidth,
        rowFont?,
        fileName?,
        colNumber?,
        heightCol?,
        other?,
    ): void {
        const wb = new exceljs.Workbook();
        const ws = wb.addWorksheet('sheet 1', { pageSetup: { paperSize: 9, orientation: 'portrait' } });

        ws.pageSetup.margins = {
            left: 0.5, right: 0.6,
            top: 0.4, bottom: 0.4,
            header: 0.3, footer: 0.3
        };
        headerData.forEach((d, index) => {
            const row = ws.addRow(d);
            row.eachCell((cell, number) => {
                cell.font = { name: 'Arial', family: 1, size: 9 };

            });
        })
        tableHeader.forEach((d, index) => {
            const row = ws.addRow(d);
            row.worksheet.pageSetup.showRowColHeaders = true;
            row.eachCell((cell, number) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F2F2F2' },
                    bgColor: { argb: 'F2F2F201' },
                };
                cell.font = { name: 'Arial', family: 1, size: 9, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } }
                };
            });
        })
        data.forEach((d, index) => {
            const row = ws.addRow(d);
            row.font = rowFont;
            row.height = 31.13;
            if (index < data.length - 1) {
                row.eachCell((cell, number) => {
                    if (!other) {
                        if (number >= 5 && number <= 10 || number === 1) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', shrinkToFit: true, wrapText: true };
                        }
                        cell.border = {
                            top: { style: 'dotted', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'dotted', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };
                    } else {
                        if (number > 5 && number < 14 || number === 1 || number === 3) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', shrinkToFit: true, wrapText: true };
                        }
                        cell.border = {
                            top: { style: 'dotted', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'dotted', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };
                    }
                });
            } else {
                if (!other) {
                    row.eachCell((cell, number) => {
                        if (number >= 5 && number <= 10 || number === 1) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', shrinkToFit: true, wrapText: true };
                        }
                        cell.border = {
                            top: { style: 'dotted', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };

                    });
                } else {
                    row.eachCell((cell, number) => {
                        if (number > 5 && number < 14 || number === 1 || number === 3) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', shrinkToFit: true, wrapText: true };
                        }
                        cell.border = {
                            top: { style: 'dotted', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };

                    });
                }
            }

        });
        if (!other) {
            footerData.forEach((d, index) => {
                const row = ws.addRow(d);
                if (index === 0) {
                    row.eachCell((cell, number) => {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        cell.font = { name: 'Arial', family: 1, size: 9, bold: true };
                    });
                }
                if (index > 0 && index < 3) {
                    row.eachCell((cell, number) => {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    });
                }
                if (index === 2) {
                    row.eachCell((cell, number) => {
                        cell.font = { name: 'Arial', family: 1, size: 9, bold: true };
                    });
                }
                if (index > 3) {
                    row.eachCell((cell, number) => {
                        cell.font = { name: 'Arial', family: 1, size: 9 };
                    });
                }
                if (index === 1) {
                    row.eachCell((cell, number) => {
                        cell.font = { name: 'Arial', family: 1, size: 9, italic: true };
                    });
                }

            })
        }
        mergesData.forEach((d, index) => {
            ws.mergeCells(d);
        })

        if (colNumber) {
            if (!other) {
                ws.getRow(colNumber).height = heightCol;
                ws.getRow(colNumber).alignment = { vertical: 'middle', wrapText: true, horizontal: 'center' };
            }
        }

        this.setFont(ws, cols);
        this.setColWidth(ws, objectColWidth)
        wb.xlsx.writeBuffer().then((_data) => {
            this.saveExcelFile(_data, fileName);
        });
    }

    private saveExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: this.fileType });
        FileSaver.saveAs(data, fileName + this.fileExtension);
    }

    setFont(ws, cols: { donvitructhuoc: null, donvi: null, cong: null, doc: null, title: null, customCol: null }) {
        ws.getCell(cols.donvitructhuoc).font = { name: 'Arial', family: 1, size: 9 };
        ws.getCell(cols.donvitructhuoc).alignment = { vertical: 'middle', horizontal: 'center' };
        //
        ws.getCell(cols.donvi).font = { name: 'Arial', family: 1, size: 9, bold: true, underline: true };
        ws.getCell(cols.donvi).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        //
        if (cols.cong) {
            ws.getCell(cols.cong).font = { name: 'Arial', family: 1, size: 9, bold: true };
            ws.getCell(cols.cong).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        //
        if (cols.doc) {
            ws.getCell(cols.doc).font = { name: 'Arial', family: 1, size: 9, bold: true, underline: true };
            ws.getCell(cols.doc).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        //
        ws.getCell(cols.title).font = { name: 'Arial', family: 1, size: 13, bold: true };
        ws.getCell(cols.title).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        //
        if (cols.customCol) {
            ws.getCell(cols.customCol).font = { name: 'Arial', family: 1, size: 9, bold: true };
        }

        //

    }

    setColWidth(ws, cols: {}) {
        Object.keys(cols).forEach((f, key) => {
            ws.getColumn(Number(f)).width = cols[f];
        })
    }

}
