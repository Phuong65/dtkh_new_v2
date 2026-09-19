import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as exceljs from 'exceljs';
import * as XLSX from 'xlsx';
import { count } from 'rxjs/operators';
import * as JSZip from 'jszip';

@Injectable( {
    providedIn: 'root'
} )
export class ExportPointForIUService {

    constructor () { }

    fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    fileExtension = '.xlsx';

    public exportExcel (
        list_object = [],
        cols = {},
        objectColWidth,
        rowFont?,
        fileName?,
    ): void {
        let i = 0;
        const zip = new JSZip();
        const shiftFolder = zip.folder( 'Danh sách ca thi' );
        list_object.forEach( l => {
            const objectExcel = l[ 'objectExcel' ];
            const wb = new exceljs.Workbook();
            Object.keys( objectExcel ).forEach( ( fo, okey ) => {
                const ws = wb.addWorksheet( fo, { pageSetup: { paperSize: 9, orientation: 'portrait' } } );
                ws.pageSetup.margins = {
                    left: 0, right: 0,
                    top: 0.4, bottom: 0.4,
                    header: 0.3, footer: 0.3
                };

                objectExcel[ fo ][ 'header' ].forEach( ( d, index ) => {
                    const row = ws.addRow( d );
                    row.eachCell( ( cell, number ) => {
                        cell.font = { name: 'Arial', family: 1, size: 12 };
                    } );
                } )

                objectExcel[ fo ][ 'tableHeader' ].forEach( ( d, index ) => {
                    const row = ws.addRow( d );
                    row.worksheet.pageSetup.showRowColHeaders = true;
                    row.eachCell( ( cell, number ) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF' },
                            bgColor: { argb: 'FFFFFF' },
                        };
                        cell.font = { name: 'Arial', family: 1, size: 10, bold: true };
                        cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
                        cell.border = {
                            top: { style: 'thin', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };
                    } );
                } )

                objectExcel[ fo ][ 'dataTable' ].forEach( ( d, index ) => {
                    const row = ws.addRow( d );
                    row.font = rowFont;
                    row.height = 31.13;
                    row.eachCell( ( cell, number ) => {
                        if ( number !== 7) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true, shrinkToFit: true };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, shrinkToFit: true };
                        }
                        cell.border = {
                            top: { style: 'dotted', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'dotted', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };
                    } );
                } );

                objectExcel[ fo ][ 'mergesData' ].forEach( ( d, index ) => {
                    ws.mergeCells( d );
                } )

                this.setFont( ws, cols );
                this.setColWidth( ws, objectColWidth );
                ws.getRow( 8 ).height = 20;
                ws.getRow( 9 ).height = 20;
            } )

            wb.xlsx.writeBuffer().then( ( _data ) => {
                i = i + 1;
                // this.saveExcelFile( _data, fileName );
                const data: Blob = new Blob( [ _data ], { type: this.fileType } );
                shiftFolder.file( l[ 'name' ].replace(/\/|\./gi,'_').concat( '.xlsx' ), data );
                if ( i === list_object.length ) {
                    zip.generateAsync( { type: "blob" } )
                        .then( function ( content ) {
                            FileSaver.saveAs( content, 'Danh sách ca thi' );
                        } );
                }
            } );
        } )
    }

    private saveExcelFile ( buffer: any, fileName: string ): void {
        const data: Blob = new Blob( [ buffer ], { type: this.fileType } );
        FileSaver.saveAs( data, fileName + this.fileExtension );
    }

    setFont ( ws, cols: {} ) {
        Object.keys( cols ).forEach( ( f, key ) => {
            ws.getCell( cols[ f ][ 'name' ] ).font = cols[ f ][ 'font' ];
            ws.getCell( cols[ f ][ 'name' ] ).alignment = cols[ f ][ 'alignment' ];
        } )
    }

    setColWidth ( ws, cols: {} ) {
        Object.keys( cols ).forEach( ( f, key ) => {
            ws.getColumn( Number( f ) ).width = cols[ f ];
        } )
    }

}
