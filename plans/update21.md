ANGULAR REFACTOR PROMPT: ANGULAR 14 TO ANGULAR LATEST (STANDALONE & CONTROL FLOW)
Bạn là một chuyên gia lập trình Frontend Angular cấp cao. Hãy duyệt và refactor TOÀN BỘ các file .html và .ts thuộc thư mục/mã nguồn được chỉ định từ cú pháp Angular 14 lên phiên bản Angular mới nhất (Angular 17+ / 18+ / 19+).

🎯 TẬP FILE CẦN XỬ LÝ
Tất cả các file *.component.html trong thư mục chỉ định.

Tất cả các file *.component.ts trong thư mục chỉ định.

🚨 QUY TẮC BẮT BUỘC (STRICT RULES)
1. GIỮ NGUYÊN GIAO DIỆN & LOGIC NGHIỆP VỤ (CRITICAL)
UI/UX & DOM: Tuyệt đối không thay đổi cấu trúc HTML DOM, thứ tự phần tử, các class CSS/Tailwind/Bootstrap hoặc bất kỳ thuộc tính giao diện nào.

Business Logic: Giữ nguyên tên biến, tên hàm, logic nghiệp vụ, các dịch vụ injection (inject() hoặc constructor), luồng xử lý dữ liệu và giá trị trả về.

2. CÚ PHÁP FILE HTML (*.component.html)
Control Flow Syntax:

Chuyển *ngIf="condition" -> @if (condition) { ... }

Chuyển *ngIf="condition; else elseBlock" -> @if (condition) { ... } @else { ... }

Chuyển *ngFor="let item of list" -> @for (item of list; track trackByFn(item)) { ... }

Chuyển *ngSwitch="condition" -> @switch (condition) { @case (val) { ... } @default { ... } }

Vòng lặp @for: Mọi vòng lặp @for bắt buộc phải có khai báo track (ưu tiên track item.id, track item.code hoặc track $index).

Bindings: Giữ nguyên tất cả các event/property binding khác ([ngClass], [ngStyle], (click), [(ngModel)],...).

3. CÚ PHÁP FILE TYPESCRIPT (*.component.ts)
Standalone Component:

Bổ sung standalone: true bên trong decorator @Component.

Tự động kiểm tra, bổ sung và cập nhật đầy đủ danh sách imports: [...] trong @Component (bao gồm: CommonModule, FormsModule, ReactiveFormsModule, các Shared Component, Directive, Pipe cần thiết phục vụ cho file HTML tương ứng).

Signals & Decorators Refactoring:

Refactor @Input() -> input() hoặc input.required().

Refactor @Output() -> output().

Refactor @ViewChild() / @ViewChildren() -> viewChild() / viewChildren().

Imports Optimization:

Tự động dọn dẹp các import thừa không còn sử dụng.

Thêm đầy đủ import cho các cú pháp mới (input, output, viewChild, signal,...) từ @angular/core và các thư viện liên quan.