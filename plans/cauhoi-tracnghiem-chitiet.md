# Kế hoạch chức năng - Chi tiết câu hỏi trắc nghiệm

## Phạm vi

Chức năng: [cauhoi-tracnghiem-chitiet](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/)

File chính:

- [cauhoi-tracnghiem-chitiet.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component.ts)
- [cauhoi-tracnghiem-chitiet.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component.html)
- [cauhoi-tracnghiem-chitiet.component.css](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component.css)

## Mục tiêu chức năng

1. Hiển thị cây bài học/CDR của học phần và cho phép chọn CDR để xem câu hỏi theo mức chuẩn đầu ra.
2. Thống kê số lượng câu hỏi theo phạm vi Public, Private, Pending, Approved và tổng số câu hỏi đã nhập so với quota.
3. Lọc danh sách câu hỏi theo học phần, CDR, mức Bloom và loại câu hỏi cha/con.
4. Cho phép thêm, sửa, xóa câu hỏi trong phạm vi CDR/level đang chọn.
5. Hiển thị nhận xét câu hỏi khi câu hỏi có dữ liệu comment.
6. Giữ logic riêng cho học phần tiếng Anh (`selectedCourse.av === 1`) khi tính câu hỏi nhóm/con.
7. Kiểm soát quyền truy cập theo route/role và profile đơn vị chuyên môn/bộ môn.

## Hiện trạng chức năng theo code

### Khởi tạo và kiểm tra quyền

- Component đọc query params `code` và `node` để xác định học phần và node kế hoạch cần mở.
- Kiểm tra role/router cho các nhóm admin, đào tạo, giảng viên, lãnh đạo khoa, lãnh đạo bộ môn.
- Với lãnh đạo khoa/bộ môn, component kiểm tra user profile có khớp đơn vị chuyên môn/bộ môn của học phần không; nếu không khớp thì chuyển về trang không tìm thấy.
- Biến `canAdded` được tính khi người dùng thuộc nhóm có quyền hoặc là người tạo kế hoạch, và template đã dùng để disable nút thêm/sửa/xóa không hợp lệ.
- Cấu hình `unLimitQuestion` được đọc từ localStorage app config để quyết định có áp quota câu hỏi hay không.

### Tải dữ liệu CDR và thống kê câu hỏi

- `loadCdrAndQuestion()` tải song song:
  - danh sách `course_plan_activities` của học phần, loại trừ status `-3`, tuần không hợp lệ, có include `PLAN,ACTIVITY_CDR`.
  - danh sách `course_questions` của học phần, loại trừ status `-3`, reference là `course_plan_activities`.
- Dữ liệu plan được tách thành node cha (`parent_id === 0`) và node con CDR.
- Mỗi CDR được bổ sung:
  - `cdr_name`, `cdr_level` từ `params.cdr.cdr_info`.
  - `question_inserted` theo private/public/approved/pending và từng mức chuẩn đầu ra.
  - `question_inserted_total`.
  - `stt` để sort theo ký hiệu CDR.
- Với học phần tiếng Anh (`av === 1`), số lượng câu hỏi được tính theo câu hỏi con của nhóm thay vì chỉ đếm câu hỏi cha.
- Nếu query param `node` khớp plan đang có, component tự chọn CDR đầu tiên của plan đó và scroll tới node tương ứng.

### Chọn CDR và chọn level

- `onSelectCdr()` đặt `selectCdr`, tự chọn level hợp lệ đầu tiên, reset danh sách câu hỏi và gọi `loadQuestionDesc()` nếu có level.
- `getValidLevels()`:
  - nếu `unLimitQuestion = true`, trả toàn bộ `CHUAN_DAU_RA`.
  - nếu giới hạn quota, chỉ trả các level có cấu hình quota trong `selectCdr.cdr_cauhoi`.
- `onSelectLvl()` đổi `activeLevelId` và tải lại danh sách câu hỏi.

### Tải danh sách câu hỏi chi tiết

- `loadQuestionDesc()` tải câu hỏi theo học phần, reference CDR đang chọn, level đang chọn, sắp xếp `id DESC`.
- Sau khi có câu hỏi cha, component tải thêm:
  - comment gốc theo `course_question_id`.
  - reply comment để tính `count_reply`.
- Comment được gom theo `user_id` rồi gán vào `f['comments']` để render qua `app-nhanxet-question`.
- Câu hỏi con được gán vào `parent.children` theo `group_id`.
- Không còn thấy request report câu hỏi hoặc `console.log(c_child)` trong luồng tải dữ liệu hiện tại.

### Thêm, sửa, xóa câu hỏi

- `openCreateForm()` kiểm tra quota nếu `unLimitQuestion = false`; nếu đã đủ quota thì toast warning và không mở form.
- Form thêm/sửa được mở bằng side navigation template `templateCreateQuestion`, truyền vào:
  - `unLimitQuestion`
  - `testFormat` theo `selectedCourse.av`
  - `dataCdr`
  - `CdrSelected` khi thêm mới
  - `update` khi chỉnh sửa
- `closeAddQuestionForm()` đóng side menu và tải lại danh sách câu hỏi.
- `deleteQuestion()` confirm trước khi xóa; nếu câu hỏi có children thì xóa cả parent và children.
- `editQuestion()` mở cùng side navigation nhưng ở trạng thái update.

## Các điểm review không ưu tiên

Các mục dưới đây là kết quả review tĩnh cần lưu lại để theo dõi, nhưng **không nằm trong phạm vi ưu tiên hiện tại**. Không tự chỉnh các mục này. Nếu muốn xử lý, phải hỏi lại và chờ xác nhận trước khi sửa code.

1. Lazy load và race guard khi đổi CDR/level:
   - `onSelectLvl()` đổi `activeLevelId` rồi gọi `loadQuestionDesc()`;
   - `loadQuestionDesc()` vẫn load toàn bộ bằng `limit: '-1'` và response cũ vẫn có thể ghi đè `list_question` nếu người dùng đổi selection nhanh;
   - nếu được yêu cầu xử lý, hướng sửa là thêm request token/snapshot `cdrId`, `levelId` và chuyển sang paging/lazy append.
2. Progress khi đổi level:
   - progress có được bật qua `notificationService.isProcessing(true)` trong `loadQuestionDesc()`;
   - request cũ có thể tắt progress trong lúc request mới còn chạy nếu thao tác nhanh;
   - nếu được yêu cầu xử lý, hướng sửa là tách loading state cho danh sách câu hỏi hoặc dùng request token/loading counter.
3. Empty state trong lúc tải câu hỏi:
   - `loadQuestionDesc()` reset `list_question = []` ngay khi bắt đầu tải;
   - template có thể hiện “Chưa có câu hỏi” trong khi API vẫn đang chạy;
   - nếu được yêu cầu xử lý, hướng sửa là thêm flag `isQuestionLoading` và chỉ hiển thị empty state khi đã tải xong.

## Các điểm đã khớp kế hoạch sau review mới

- `canAdded` đã bao gồm manager/admin/router admin và creator plan.
- Nút “Thêm câu hỏi” đã dùng `canAdded`, `activeLevelId` và quota để disable thao tác không hợp lệ.
- Binding thống kê level chính đã dùng optional chaining để tránh lỗi khi `question_inserted` chưa sẵn sàng.
- Layout header/toolbar đã đổi nhiều chỗ sang `min-height`, flex và wrap để giảm rủi ro vỡ layout.
- Không còn thấy `console.log(c_child)` trong component.

## Kế hoạch hoàn thiện chức năng

### Giai đoạn 1 - Chuẩn hóa trạng thái màn hình

- Tách rõ các trạng thái dữ liệu trong component:
  - đang tải thông tin học phần
  - không tìm thấy học phần hoặc không có quyền xem
  - đang tải cây CDR
  - cây CDR rỗng
  - đã chọn CDR nhưng chưa có level hợp lệ
  - đang tải câu hỏi
  - danh sách câu hỏi rỗng
- Tránh phụ thuộc hoàn toàn vào `notificationService.isProcessing()` cho mọi trạng thái vì UI cần biết ngữ cảnh cụ thể để hiển thị empty state đúng.
- Đảm bảo mọi nhánh lỗi API đều tắt processing và có thông báo phù hợp.

### Giai đoạn 2 - Làm rõ quyền thao tác

- Hiện code đã áp dụng `canAdded` cho nút “Thêm câu hỏi” và menu sửa/xóa; giữ nguyên nguyên tắc này khi chỉnh UI.
- Nút thêm đã disabled khi:
  - chưa chọn level
  - không có quyền thêm
  - đã đủ quota và `unLimitQuestion = false`
- Menu sửa/xóa hiện chỉ hiện khi `parent_q.status !== 1 && canAdded`.
- Cần xác nhận thêm: user không có `canAdded` có được sửa/xóa câu hỏi chưa duyệt không; nếu không, code hiện đã đúng hướng.
- Thông báo quota đã dùng câu rõ: “Số lượng câu hỏi đã đạt mức tối đa, không thể thêm”.

### Giai đoạn 3 - Cải thiện tính đúng của thống kê

- Rà soát cách tính `question_inserted_total` với học phần tiếng Anh để bảo đảm khớp cách hiển thị danh sách câu hỏi.
- Chuẩn hóa các helper thống kê để không phụ thuộc vào dynamic property quá nhiều nếu có thể.
- Bảo vệ các phép cộng khi `question_inserted.private[cdr_id]` hoặc `question_inserted.public[cdr_id]` chưa có dữ liệu, tránh trả `NaN`.
- Xác nhận `pending` hiện đang tính `status !== 1`; nếu `status = -2` là “Yêu cầu sửa” thì có nên tách riêng khỏi pending không.

### Giai đoạn 4 - Hoàn thiện comment/report

- Comment/nhận xét hiện đã render qua `app-nhanxet-question` khi câu hỏi có `comments`.
- Request report câu hỏi hiện không còn trong component; chỉ bổ sung lại nếu có yêu cầu sản phẩm rõ về UI report.
- Nếu cần hiển thị report, bổ sung UI rõ ràng trong card hoặc trong component nhận xét.
- Giữ luồng tải câu hỏi không có log debug.

### Giai đoạn 5 - Tối ưu luồng tải dữ liệu

- Khi thêm/sửa/xóa xong, code hiện gọi lại `loadCdrAndQuestion()` để refresh cây CDR/thống kê.
- Selection level đang được giữ bằng `_preservedLevelId`; tiếp tục giữ cách này nếu chỉ chỉnh UI/UX.
- Nếu cần tối ưu sâu hơn, cân nhắc cập nhật local counter an toàn thay vì refresh toàn bộ cây CDR.
- Xử lý hủy request hoặc tránh ghi đè dữ liệu nếu người dùng đổi CDR/level nhanh liên tục.

## Kế hoạch UI/UX

### Giai đoạn 1 - Làm sạch layout và style nền

- Tách inline style trong template thành class rõ nghĩa:
  - sidebar label/count
  - main scroll area
  - question toolbar
  - question list container
  - create drawer header/body
- Đổi `.fade-in` từ width cố định `21cm` sang `max-width` linh hoạt:
  - desktop rộng: `max-width: 980px` hoặc tương đương khổ đọc tốt
  - màn nhỏ: `width: 100%; padding-inline` hợp lý
- Chuẩn hóa spacing bằng biến CSS cục bộ cho component:
  - khoảng cách card
  - chiều cao header
  - border radius
  - màu nền vùng nội dung
- Giữ lại visual language hiện tại: Bootstrap utility, PrimeIcons, badge màu mềm.

### Giai đoạn 2 - Tối ưu sidebar bài học/CDR

- Làm rõ hierarchy:
  - bài học/KTHP là node cấp 1
  - CDR là node cấp 2
  - số lượng câu hỏi/giới hạn căn phải, không chen vào tên CDR
- Tăng affordance cho node active bằng border-left hoặc background rõ hơn.
- Thêm trạng thái khi `list_plan` rỗng: “Chưa có kế hoạch bài học/CDR”.
- Cân nhắc sticky sidebar header để khi cuộn vẫn biết đang ở danh sách bài học.
- Responsive:
  - >= 1200px: sidebar 260px
  - 1024px: sidebar 220px
  - < 768px: sidebar chuyển thành panel/top dropdown hoặc xếp trên nội dung chính

### Giai đoạn 3 - Tối ưu header CDR và thống kê

- Gom thông tin chính theo thứ tự:
  1. CDR đang chọn
  2. tổng tiến độ `đã có / yêu cầu`
  3. phân bổ trạng thái Public/Private/Pending/Approved
- Tránh lặp toàn bộ thống kê ở cả header CDR và header level:
  - header CDR hiển thị tổng theo CDR
  - toolbar level hiển thị số liệu theo level đang chọn
- Với màn hình hẹp, cho stat tag wrap gọn hoặc chuyển thành summary row.
- Cân nhắc Việt hóa Pending/Approved thành “Chờ duyệt/Đã duyệt” để đồng bộ với card câu hỏi.

### Giai đoạn 4 - Tối ưu tab mức Bloom

- Active tab cần rõ hơn và hiển thị count dạng badge nhỏ thay vì text nối sau label.
- Nếu số level nhiều hoặc màn nhỏ, cho tab scroll ngang.
- Khi chưa chọn level, hiển thị empty state: “Chọn mức độ Bloom để xem câu hỏi”.

### Giai đoạn 5 - Tối ưu danh sách card câu hỏi

- Card header nên sắp xếp:
  - trái: mã câu hỏi + trạng thái duyệt
  - phải: quyền hiển thị + chuẩn đầu ra + đảo phương án + menu thao tác
- Thêm nhãn loại câu hỏi nếu `question_type` quan trọng với người duyệt.
- Giảm chiều cao/độ dày badge để danh sách dễ quét khi nhiều câu hỏi.
- Empty state khi `list_question` rỗng:
  - nếu có quyền thêm: “Chưa có câu hỏi ở mức này. Bấm Thêm câu hỏi để tạo mới.”
  - nếu không có quyền thêm: “Chưa có câu hỏi ở mức này.”

### Giai đoạn 6 - Tối ưu overlay thêm/sửa

- Header overlay cần giữ CDR + level + quota nhưng tránh quá dài.
- Tags trong header có thể wrap hoặc chuyển xuống dòng phụ.
- Body dùng class CSS thay cho inline `height: calc(100vh - 57px)`.
- Khi đóng form, hiển thị lại đúng CDR/level vừa thao tác.

### Giai đoạn 7 - Accessibility và tương tác bàn phím

- Thay vùng click dạng `div` bằng `button` hoặc bổ sung role/tabindex phù hợp cho node sidebar nếu không đổi được markup.
- Đảm bảo badge không chỉ dựa vào màu để truyền trạng thái.
- Nút dấu ba chấm cần có aria-label.
- Focus state rõ cho sidebar item, tab và nút thêm câu hỏi.

## Ưu tiên triển khai đề xuất

1. Giữ các phần đã khớp kế hoạch và không mở rộng phạm vi nếu chưa có yêu cầu mới:
   - quyền thêm/sửa/xóa đang được kiểm soát bằng `canAdded`;
   - nút “Thêm câu hỏi” đã disable theo quyền, level và quota;
   - thống kê chính đã có optional chaining;
   - layout header/toolbar/tab drawer đã được cải thiện để giảm vỡ layout.
2. Nếu tiếp tục chỉnh UI/UX trong phạm vi an toàn, ưu tiên các việc còn lệch plan thật sự:
   - active tab cần badge count rõ hơn, không chỉ text nối sau label;
   - sidebar active có thể thêm border-left/focus state để rõ hơn;
   - empty state cần chờ loading state riêng trước khi kết luận “chưa có câu hỏi”;
   - header overlay thêm/sửa cần tối ưu khi CDR dài/nhiều tag.
3. Sau thao tác thêm/sửa/xóa, tiếp tục giữ selection hiện tại và refresh thống kê CDR như hiện tại; chỉ thay đổi cơ chế refresh nếu người dùng yêu cầu tối ưu sâu hơn.
4. Không tự xử lý các điểm trong mục “Các điểm review không ưu tiên” nếu chưa hỏi lại và được xác nhận.

## Lưu ý sau review tĩnh

- Các điểm lazy load, race guard, progress chồng request và empty state trong lúc tải đã được ghi nhận nhưng không ưu tiên triển khai hiện tại.
- Nếu người dùng yêu cầu chỉnh các điểm này, cần xác nhận phạm vi trước: chỉ guard request/progress, hay làm đầy đủ lazy load theo trang/scroll.
- Report question hiện không còn được request trong `loadQuestionDesc()`; chỉ thêm lại khi có yêu cầu hiển thị report.
- `restoreSelection()` có thể kích hoạt tải danh sách câu hỏi; không nên tắt loading tổng trước khi request câu hỏi/comment hoàn tất.
- Responsive đã đổi hướng layout dưới 768px; vẫn cần kiểm tra thực tế với dữ liệu dài.
- Nên tiếp tục giảm style khó bảo trì và chuẩn hóa class cho sidebar/header/overlay khi chỉnh UI tiếp theo.
- Khi sửa UI quyền thao tác, giữ nguyên nguyên tắc hiện tại: chỉ hiển thị thêm/sửa/xóa khi `canAdded` và câu hỏi chưa duyệt, trừ khi nghiệp vụ xác nhận khác.
- Khi chỉnh thống kê học phần tiếng Anh (`selectedCourse.av === 1`), phải giữ cách đếm theo câu hỏi con của nhóm.

## Rủi ro cần kiểm tra khi implement

- Không làm thay đổi logic phân quyền hiện có khi chỉ chỉnh UI.
- Không làm sai cách đếm câu hỏi với học phần tiếng Anh (`av === 1`).
- Không làm mất khả năng xem câu hỏi theo khổ giấy nếu nghiệp vụ cần preview giống đề thi.
- Cần kiểm tra đủ các loại câu hỏi: radio, checkbox, inputbox, reorder_words, arrange_paragraphs, drag_drop, group-input, group-radio, grouping.
- Cần kiểm tra dữ liệu dài: tên CDR dài, nhiều bài học, nhiều stat tag, câu hỏi có nhiều nhận xét.

## Tiêu chí hoàn thành

- Người dùng luôn biết đang chọn bài/CDR/level nào.
- Các trạng thái rỗng/loading/lỗi hiển thị đúng ngữ cảnh.
- Nút thêm/sửa/xóa chỉ khả dụng theo quyền và quota nghiệp vụ.
- Thống kê sau thêm/sửa/xóa không bị stale hoặc sai lệch.
- Layout không tràn ngang ở 1366px, 1024px và 768px.
- Template giảm inline style, CSS không còn định nghĩa trùng lặp không cần thiết.
- Không thay đổi hành vi API, dữ liệu câu hỏi, trạng thái duyệt, hoặc cấu trúc câu hỏi con nếu không có yêu cầu riêng.

## Câu hỏi mở

1. Có cần giữ trải nghiệm xem câu hỏi theo khổ giấy A4/21cm không, hay ưu tiên responsive full-width?
2. Public/Private/Pending/Approved có cần Việt hóa toàn bộ không?
3. User không có `canAdded` có được sửa/xóa câu hỏi chưa duyệt không?
4. Sau thêm/sửa/xóa, nên refresh toàn bộ cây CDR để cập nhật thống kê hay chỉ cập nhật local counter?
5. `status = -2` nên nằm trong “Pending” hay tách riêng thành “Yêu cầu sửa” trong thống kê?
6. Mobile dưới 768px có nằm trong phạm vi hỗ trợ chính của chức năng quản trị này không?
