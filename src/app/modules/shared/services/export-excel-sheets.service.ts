import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as exceljs from 'exceljs';
import * as XLSX from 'xlsx';
import { count } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ExportExcelSheetsService {

    constructor() { }

    fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    fileExtension = '.xlsx';

    public exportExcel(
        objectExcel = {},
        cols = {},
        objectColWidth,
        rowFont?,
        fileName?,
    ): void {
        const wb = new exceljs.Workbook();
        Object.keys(objectExcel).forEach((fo, okey) => {
            const ws = wb.addWorksheet(fo, { pageSetup: { paperSize: 9, orientation: 'portrait' } });
            ws.pageSetup.margins = {
                left: 0, right: 0,
                top: 0.4, bottom: 0.4,
                header: 0.3, footer: 0.3
            };
            objectExcel[fo]['header'].forEach((d, index) => {
                const row = ws.addRow(d);
                row.eachCell((cell, number) => {
                    cell.font = { name: 'Times New Roman', family: 1, size: 9 };
                });
            })
            objectExcel[fo]['tableHeader'].forEach((d, index) => {
                const row = ws.addRow(d);
                row.worksheet.pageSetup.showRowColHeaders = true;
                row.eachCell((cell, number) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFF' },
                        bgColor: { argb: 'FFFFFF' },
                    };
                    cell.font = { name: 'Times New Roman', family: 1, size: 13, bold: true };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                    cell.border = {
                        top: { style: 'thin', color: { argb: '333333' } },
                        left: { style: 'thin', color: { argb: '333333' } },
                        bottom: { style: 'thin', color: { argb: '333333' } },
                        right: { style: 'thin', color: { argb: '333333' } }
                    };
                });
            })
            objectExcel[fo]['dataTable'].forEach((d, index) => {
                const row = ws.addRow(d);
                row.font = rowFont;
                row.height = 31.13;
                if (index < objectExcel[fo]['dataTable'].length - 1) {
                    row.eachCell((cell, number) => {
                        if (number !== 3 && number !== 4) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', shrinkToFit: true };
                        }
                        if (number === 3) {
                            cell.border = {
                                top: { style: 'dotted', color: { argb: '333333' } },
                                left: { style: 'thin', color: { argb: '333333' } },
                                bottom: { style: 'dotted', color: { argb: '333333' } },
                                right: { style: 'thin', color: { argb: 'DDDDDD' } }
                            };
                        } else if (number === 4) {
                            cell.border = {
                                top: { style: 'dotted', color: { argb: '333333' } },
                                left: { style: 'thin', color: { argb: 'DDDDDD' } },
                                bottom: { style: 'dotted', color: { argb: '333333' } },
                                right: { style: 'thin', color: { argb: '333333' } }
                            };
                        } else {
                            cell.border = {
                                top: { style: 'dotted', color: { argb: '333333' } },
                                left: { style: 'thin', color: { argb: '333333' } },
                                bottom: { style: 'dotted', color: { argb: '333333' } },
                                right: { style: 'thin', color: { argb: '333333' } }
                            };
                        }
                    });
                } else {
                    row.eachCell((cell, number) => {
                        if (number !== 3 && number !== 4) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', shrinkToFit: true };
                        }
                        if (number === 3) {
                            cell.border = {
                                top: { style: 'dotted', color: { argb: '333333' } },
                                left: { style: 'thin', color: { argb: '333333' } },
                                bottom: { style: 'thin', color: { argb: '333333' } },
                                right: { style: 'thin', color: { argb: 'DDDDDD' } }
                            };
                        } else if (number === 4) {
                            cell.border = {
                                top: { style: 'dotted', color: { argb: '333333' } },
                                left: { style: 'thin', color: { argb: 'DDDDDD' } },
                                bottom: { style: 'thin', color: { argb: '333333' } },
                                right: { style: 'thin', color: { argb: '333333' } }
                            };
                        } else {
                            cell.border = {
                                top: { style: 'dotted', color: { argb: '333333' } },
                                left: { style: 'thin', color: { argb: '333333' } },
                                bottom: { style: 'thin', color: { argb: '333333' } },
                                right: { style: 'thin', color: { argb: '333333' } }
                            };
                        }

                    });
                }

            });
            objectExcel[fo]['footer'].forEach((d, index) => {
                const row = ws.addRow(d);
                if (index === 1) {
                    row.eachCell((cell, number) => {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        cell.font = { name: 'Times New Roman', family: 1, size: 10, bold: true };
                    });
                }
                if (index > 1 && index !== 3) {
                    row.eachCell((cell, number) => {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.font = { name: 'Times New Roman', family: 1, size: 10, italic: true };
                    });
                }
                if (index === 3) {
                    row.eachCell((cell, number) => {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.font = { name: 'Times New Roman', family: 1, size: 10, bold: true };
                    });
                }
                if (index > 8) {
                    row.eachCell((cell, number) => {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        cell.font = { name: 'Times New Roman', family: 1, size: 10 };
                    });
                }

            })
            objectExcel[fo]['mergesData'].forEach((d, index) => {
                ws.mergeCells(d);
            })
            this.setFont(ws, cols);
            this.setColWidth(ws, objectColWidth);
            ws.getRow(10).height = 30;
            ws.getRow(11).height = 30;
        })


        wb.xlsx.writeBuffer().then((_data) => {
            this.saveExcelFile(_data, fileName);
        });
    }

    private saveExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: this.fileType });
        FileSaver.saveAs(data, fileName + this.fileExtension);
    }

    setFont(ws, cols: {}) {
        Object.keys(cols).forEach((f, key) => {
            ws.getCell(cols[f]['name']).font = cols[f]['font'];
            ws.getCell(cols[f]['name']).alignment = cols[f]['alignment'];
        })
    }

    setColWidth(ws, cols: {}) {
        Object.keys(cols).forEach((f, key) => {
            ws.getColumn(Number(f)).width = cols[f];
        })
    }

}
