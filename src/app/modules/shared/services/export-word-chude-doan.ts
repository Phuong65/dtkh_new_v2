import { HelperService } from '@core/services/helper.service';
import { Injectable } from '@angular/core';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import { Classes } from '../models/classes';
import { DonVi } from '../models/don-vi';
import { ElnChuyenMuc } from '../models/Elng';
import { ElnKhoaHoc } from '../models/elng-khoa-hoc';
type ParagraphAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];

@Injectable({
    providedIn: 'root'
})
export class ExportWordChudeDuanService {
    selectKhoa: DonVi;
    selectNganh: ElnChuyenMuc;
    selectClass: Classes;

    constructor(
        private helperService: HelperService
    ) {

    }
    exportDanhSach(
        _class: Classes,
        _khoa: DonVi,
        _nganh: ElnChuyenMuc,
        data: any[]
    ) {
        this.selectKhoa = _khoa;
        this.selectNganh = _nganh;
        this.selectClass = _class;

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                width: 11906,   // A4 width (twips)
                                height: 16838   // A4 height (twips)
                            },
                            margin: {
                                top: 1440,      // 2.54 cm
                                bottom: 1440,
                                left: 1800,     // 3.17 cm (chuẩn văn bản VN)
                                right: 1200     // 2.12 cm
                            }
                        }
                    },
                    children: [
                        // ===== HEADER =====
                        this.buildHeader(),

                        // ===== TITLE =====
                        this.buildTitle(),

                        // ===== INFO =====
                        ...this.buildInfo(),

                        // ===== TABLE =====
                        this.buildTable(data),

                        ...this.buildFooter(data)
                    ]
                }
            ]
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, 'BPCDA'.concat('-', this.helperService.slugVietnamese(this.selectClass.name), '.docx'));
        });
    }

    // ================= HEADER =================
    buildHeader(): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: this.noBorder(),
            rows: [
                new TableRow({
                    children: [
                        this.headerCellLeft(),
                        this.headerCellRight()
                    ]
                })
            ]
        });
    }

    headerCellLeft(): TableCell {
        return new TableCell({
            borders: this.noBorder(),
            children: [
                this.p("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ", false),
                this.p("THÔNG TIN VÀ TRUYỀN THÔNG", false),
                this.p(this.selectKhoa.title.toUpperCase(), true)
            ]
        });
    }

    headerCellRight(): TableCell {
        return new TableCell({
            borders: this.noBorder(),
            children: [
                this.p("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", false, AlignmentType.CENTER),
                this.p("Độc lập – Tự do – Hạnh phúc", true, AlignmentType.CENTER, true)
            ]
        });
    }

    // ================= TITLE =================
    buildTitle(): Paragraph {
        return new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
                new TextRun({
                    text: "BẢNG PHÂN CÔNG THỰC HIỆN ĐỒ ÁN/DỰ ÁN",
                    bold: true,
                    size: 28,
                    font: "Times New Roman"
                })
            ]
        });
    }

    // ================= INFO =================
    buildInfo(): Paragraph[] {
        return [
            this.pInline("Lớp học phần: ", this.selectClass.name),
            new Paragraph({
                children: [
                    this.run("Học kỳ: ", false),
                    this.run(String(this.selectClass?.hocky ?? '')),
                    this.run("    Năm học: ", false),
                    this.run(String(this.selectClass?.namhoc ?? ''))
                ]
            }),
            this.pInline("Học phần: ", this.selectClass.course_detail.title),
        ];
    }

    // ================= TABLE =================
    buildTable(data: any[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [

                // HEADER
                new TableRow({
                    children: [
                        this.cell("TT", true, AlignmentType.CENTER, 5),
                        this.cell("Mã sinh viên", true, AlignmentType.CENTER, 15),
                        this.cell("Họ và tên sinh viên", true, AlignmentType.CENTER, 20),
                        this.cell("Ngày sinh", true, AlignmentType.CENTER, 12),
                        this.cell("Tên Đồ án/Dự án", true, AlignmentType.CENTER, 28), // 👈 giảm lại
                        this.cell("Tên nhiệm vụ", true, AlignmentType.CENTER, 20)
                    ]
                }),

                // DATA
                ...data.map((item, index) =>
                    new TableRow({
                        children: [
                            this.cell(String(index + 1), false, AlignmentType.CENTER, 5),
                            this.cell(item.masinhvien, false, AlignmentType.CENTER, 15),
                            this.cell(item.hoten, false, AlignmentType.LEFT, 20),
                            this.cell(item.ngaysinh, false, AlignmentType.CENTER, 12),
                            this.cell(item.tenduan, false, AlignmentType.LEFT, 28),
                            this.cell("", false, AlignmentType.LEFT, 20)
                        ]
                    })
                )
            ]
        });
    }

    // ================= CELL =================
    cell(
        text: string,
        bold = false,
        align: ParagraphAlignment = AlignmentType.CENTER,
        widthPercent?: number
    ): TableCell {
        return new TableCell({
            width: widthPercent
                ? { size: widthPercent, type: WidthType.PERCENTAGE }
                : undefined,

            margins: {
                top: 100,
                bottom: 100,
                left: 120,
                right: 120
            },

            children: [
                new Paragraph({
                    alignment: align,
                    children: [
                        new TextRun({
                            text: String(text ?? ''),
                            bold,
                            size: 24,
                            font: "Times New Roman",
                        })
                    ]
                })
            ]
        });
    }

    // ================= PARAGRAPH =================
    p(text: string, bold = false, align: ParagraphAlignment = AlignmentType.LEFT, underline = false): Paragraph {
        return new Paragraph({
            alignment: align,
            children: [
                new TextRun({
                    text,
                    bold,
                    underline: underline ? {} : undefined,
                    size: 24,
                    font: "Times New Roman"
                })
            ]
        });
    }

    pInline(label: string, value: string): Paragraph {
        return new Paragraph({
            children: [
                this.run(label, false),
                this.run(value)
            ]
        });
    }

    run(text: string, bold = false, italic = false): TextRun {
        return new TextRun({
            text,
            bold,
            size: 24,
            font: "Times New Roman",
            italics: italic,
        });
    }

    // ================= BORDER =================
    noBorder() {
        return {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
        };
    }

    buildFooter(data: any[]): Array<Paragraph | Table> {
        const total = data?.length || 0;

        return [
            // ===== SỐ LƯỢNG =====
            new Paragraph({
                spacing: { before: 300 },
                children: [
                    this.run(`Ấn định danh sách có: ${total} sinh viên.`)
                ]
            }),

            // ===== NGÀY + GIẢNG VIÊN =====
            this.buildSignature(),
            // ===== NHIỆM VỤ =====
            new Paragraph({
                spacing: { before: 300 },
                children: [
                    this.run("Các nhiệm vụ cơ bản đối với mỗi đầu mục công việc:", true)
                ]
            }),

            // ===== DANH SÁCH =====
            ...this.taskList()
        ];
    }

    taskList(): Paragraph[] {
        const lines = [
            "Tổng quan về dự án",
            "+ Phân tích bối cảnh ra đời và tính cấp thiết của dự án.",
            "+ Xác định mục tiêu chiến lược và các mục tiêu cụ thể.",
            "+ Xác lập phạm vi dự án (Scope) và các giới hạn liên quan.",
            "+ Phân tích các bên liên quan (Stakeholders) và ma trận trách nhiệm.",

            "Xây dựng kế hoạch dự án",
            "+ Lựa chọn phương pháp luận quản trị phù hợp (Waterfall, Agile/Scrum hoặc Hybrid).",
            "+ Xây dựng cấu trúc phân rã công việc (WBS).",
            "+ Ước lượng chi phí, xác định nguồn lực nhân sự và hạ tầng kỹ thuật.",
            "+ Thiết lập kế hoạch quản lý rủi ro dự phòng.",

            "Kiểm soát tiến độ dự án",
            "+ Lập tiến độ chi tiết và theo dõi qua các công cụ như Gantt Chart hoặc Kanban Board.",
            "+ Vận hành quy trình quản lý rủi ro, chi phí và tiến độ định kỳ.",
            "+ Sử dụng các công cụ quản lý (Jira, Trello, MS Project) để tối ưu hóa phối hợp nhóm.",

            "Tổ chức triển khai",
            "+ Phân tích yêu cầu, thiết kế hệ thống.",
            "+ Thi công, kiểm thử hệ thống (Unit Test, Integration Test, UAT).",
            "+ Triển khai và bàn giao hệ thống.",
            "+ Thiết lập quy trình vận hành, bảo trì và hỗ trợ kỹ thuật sau triển khai.",
            "+ Xây dựng nội dung Demo sản phẩm (nếu có).",

            "Tổng kết dự án",
            "+ Đối soát kết quả thực tế với các KPI và mục tiêu ban đầu.",
            "+ Đánh giá mức độ thành công dựa trên các chỉ số hiệu suất.",
            "+ Phân tích các bài học kinh nghiệm (Lessons Learned) trong quá trình quản trị.",
            "+ Đề xuất các hướng cải tiến kỹ thuật hoặc mở rộng dự án trong tương lai."
        ];

        return lines.map(line => {
            const isTitle = !line.startsWith("+");

            return new Paragraph({
                spacing: { line: 300 },
                children: [
                    new TextRun({
                        text: isTitle ? `- ${line}` : `   ${line}`,
                        bold: isTitle,
                        size: 24,
                        font: "Times New Roman"
                    })
                ]
            });
        });
    }

    buildSignature(): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: this.noBorder(),
            rows: [
                new TableRow({
                    children: [

                        // CỘT TRÁI (rỗng)
                        new TableCell({
                            borders: this.noBorder(),
                            children: [new Paragraph("")],
                            width: {
                                size: 50,
                                type: WidthType.PERCENTAGE
                            }
                        }),

                        // CỘT PHẢI (chữ ký)
                        new TableCell({
                            width: {
                                size: 50,
                                type: WidthType.PERCENTAGE
                            },
                            borders: this.noBorder(),
                            children: [

                                // Ngày tháng (italic)
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        this.run(
                                            "Thái Nguyên, ngày.....tháng.....năm 2026",
                                            false,
                                            true
                                        )
                                    ]
                                }),

                                // Tiêu đề
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        this.run("GIẢNG VIÊN GIẢNG DẠY", true)
                                    ]
                                }),

                                // Khoảng trống ký tên
                                new Paragraph({
                                    text: "",
                                    spacing: { after: 400 }
                                }),

                                // Tên
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        this.run(this.selectClass['giangvien'], true)
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    }
}