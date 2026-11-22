import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_rich_report():
    doc = docx.Document()

    # Configure Margins: Top=2cm (0.79in), Bottom=2cm (0.79in), Left=2.5cm (0.98in), Right=2cm (0.79in)
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(0.98)
        section.right_margin = Inches(0.79)
        section.different_first_page_header_footer = True
        
        # Header / Footer
        footer = section.footer
        p_ft = footer.paragraphs[0]
        p_ft.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_ft = p_ft.add_run("Báo cáo Kỹ thuật Hệ thống TeamUp AI — Đặc tả Input, Output & Nội hàm | Trang ")
        r_ft.font.name = "Times New Roman"
        r_ft.font.size = Pt(9)
        r_ft.font.italic = True
        r_ft.font.color.rgb = RGBColor(0x77, 0x77, 0x77)
        
        fldSimple = parse_xml(r'<w:fldSimple %s w:instr="PAGE"/>' % nsdecls('w'))
        p_ft._p.append(fldSimple)

    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11.5)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    normal_style.paragraph_format.line_spacing = 1.25
    normal_style.paragraph_format.space_after = Pt(4)

    # Palette
    C_NAVY = RGBColor(0x1B, 0x36, 0x5D)
    C_SLATE = RGBColor(0x2C, 0x3E, 0x50)
    C_BODY = RGBColor(0x22, 0x22, 0x22)
    HEX_HEADER = "1B365D"
    HEX_ALT_ROW = "F8FAFC"
    HEX_BORDER = "CBD5E1"
    HEX_CALLOUT_BG = "F1F5F9"
    HEX_CALLOUT_BORDER = "1B365D"

    # Helpers
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_table_borders(table, color=HEX_BORDER):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="single" w:sz="8" w:space="0" w:color="{HEX_HEADER}"/>'
            f'  <w:bottom w:val="single" w:sz="8" w:space="0" w:color="{HEX_HEADER}"/>'
            f'  <w:left w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(13.5)
        r.bold = True
        r.font.color.rgb = C_NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.bold = True
        r.font.color.rgb = C_SLATE
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)
        r.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    def add_callout(text_list, title="LƯU Ý NỘI HÀM KỸ THUẬT:"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.4)
        
        cell = tbl.cell(0, 0)
        set_cell_background(cell, HEX_CALLOUT_BG)
        set_cell_margins(cell, top=100, bottom=100, left=160, right=140)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:top w:val="none"/>'
            f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{HEX_CALLOUT_BORDER}"/>'
            f'  <w:bottom w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        rt = p.add_run(title)
        rt.bold = True
        rt.font.name = "Times New Roman"
        rt.font.size = Pt(10.5)
        rt.font.color.rgb = C_NAVY
        
        for item in text_list:
            p2 = cell.add_paragraph()
            p2.paragraph_format.space_before = Pt(0)
            p2.paragraph_format.space_after = Pt(2)
            p2.paragraph_format.line_spacing = 1.15
            r = p2.add_run(item)
            r.font.name = "Times New Roman"
            r.font.size = Pt(10)
            r.font.color.rgb = C_BODY
        
        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_after = Pt(2)

    def style_header_row(tbl, headers):
        for i, h in enumerate(headers):
            cell = tbl.cell(0, i)
            set_cell_background(cell, HEX_HEADER)
            set_cell_margins(cell, 80, 80, 90, 90)
            p = cell.paragraphs[0]
            r = p.add_run(h)
            r.bold = True
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    # =============================================================
    # TRANG BÌA (COVER PAGE)
    # =============================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(24)
    p_inst.paragraph_format.space_after = Pt(2)
    r = p_inst.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG ĐẠI HỌC CÔNG NGHỆ\nKHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN CÔNG NGHỆ PHẦN MỀM")
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(50)
    r = p_line.add_run("-------------------- *** --------------------")
    r.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(12)
    r = p_title.add_run("BÁO CÁO ĐẶC TẢ KỸ THUẬT HỆ THỐNG")
    r.bold = True
    r.font.size = Pt(19)
    r.font.color.rgb = C_NAVY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    r = p_sub.add_run("HỆ THỐNG HỖ TRỢ LÀM VIỆC NHÓM THỜI GIAN THỰC TÍCH HỢP TRÍ TUỆ NHÂN TẠO (TEAMUP AI)\nCHUYÊN ĐỀ: ĐẶC TẢ INPUT, OUTPUT VÀ NỘI HÀM KIẾN TRÚC XỬ LÝ")
    r.bold = True
    r.font.size = Pt(12.5)
    r.font.color.rgb = C_SLATE

    p_box = doc.add_paragraph()
    p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_box.paragraph_format.space_before = Pt(70)
    p_box.paragraph_format.space_after = Pt(90)
    r = p_box.add_run(
        "HỌC PHẦN: ĐỒ ÁN CHUYÊN NGÀNH CÔNG NGHỆ THÔNG TIN\n"
        "GIẢNG VIÊN HƯỚNG DẪN: BAN HỘI ĐỒNG PHẢN BIỆN CHUYÊN MÔN\n"
        "NHÓM SINH VIÊN THỰC HIỆN: NHÓM DỰ ÁN TEAMUP AI\n"
        "CHUYÊN NGÀNH: KỸ THUẬT PHẦN MỀM & HỆ THỐNG THÔNG TIN"
    )
    r.font.size = Pt(11)
    r.font.line_spacing = 1.35

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_after = Pt(0)
    r = p_loc.add_run("HÀ NỘI – THÁNG 11 NĂM 2026")
    r.bold = True
    r.font.size = Pt(11)

    doc.add_page_break()

    # =============================================================
    # TRANG 1: BẢN CHẤT HỆ THỐNG & ĐỊNH VỊ KIẾN TRÚC HYBRID
    # =============================================================
    add_h1("PHẦN 1: BẢN CHẤT HỆ THỐNG & ĐỊNH VỊ NỘI HÀM KIẾN TRÚC HYBRID")
    
    add_h2("1.1. Bối cảnh Thực tiễn và Động lực Kỹ thuật")
    p = doc.add_paragraph(
        "Trong các chương trình đào tạo đại học kỹ thuật, phương thức học tập theo đồ án nhóm (Project-Based Learning) "
        "đóng vai trò nền tảng giúp sinh viên rèn luyện tư duy thiết kế và làm việc cộng tác. Tuy nhiên, hình thức này luôn đối mặt "
        "với một điểm nghẽn mang tính cố hữu: Hiện tượng 'ngồi mát ăn bát vàng' (Free-riding) và sự phân mảnh công cụ giao tiếp. "
        "Giảng viên gặp khó khăn khi không có dữ liệu định lượng chính xác để thẩm định ai thực sự đóng góp vào sản phẩm chung; "
        "trong khi sinh viên chịu ảnh hưởng tiêu cực của sự phân tâm khi làm việc trực tuyến mà thiếu vắng áp lực đồng đẳng tích cực (Positive Peer Pressure)."
    )
    p = doc.add_paragraph(
        "Các công cụ truyền thống (như Discord, Trello, Google Docs) hoạt động hoàn toàn tách biệt, buộc thành viên phải chuyển đổi ngữ cảnh liên tục "
        "(Context Switching Fatigue). TeamUp AI ra đời nhằm giải quyết triệt để vấn đề này bằng cách tích hợp không gian tập trung thời gian thực, "
        "tự động hóa phân rã việc bằng trí tuệ nhân tạo và động cơ định lượng đóng góp dựa trên chuỗi bằng chứng kỹ thuật không thể chối bỏ."
    )

    add_h2("1.2. Định vị Nội hàm Kiến trúc Hệ thống: Vượt qua giới hạn Web CRUD truyền thống")
    p = doc.add_paragraph(
        "Về bản chất kỹ thuật, TeamUp AI không phải là một ứng dụng Web CRUD thông thường (chỉ tiếp nhận HTTP Request, ghi xuống Database và trả HTTP Response). "
        "Hệ thống được thiết kế như một kiến trúc lai phân tán (Distributed Hybrid Architecture), kết hợp đồng thời ba mô hình xử lý chuyên sâu:"
    )

    tbl_mod = doc.add_table(rows=4, cols=3)
    tbl_mod.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_mod)
    style_header_row(tbl_mod, ["Mô hình Xử lý", "Bản chất Kỹ thuật & Luồng Vận hành Nội hàm", "Thành phần Đảm nhiệm"])

    models_data = [
        ("Stateful Real-Time Engine\n(Trạng thái nóng thời gian thực)", 
         "Duy trì liên tục hàng trăm kết nối song công hai chiều (Full-duplex WebSocket). Trạng thái phân tán (Distributed State) như đồng hồ đếm lùi chung, tọa độ con trỏ và mức độ tập trung được đồng bộ hóa tức thời qua bộ nhớ đệm In-Memory với độ trễ xử lý dưới 50ms.", 
         "WebSocket Gateway kết hợp cụm Redis In-Memory Cluster."),
        ("Event-Driven Async Pipeline\n(Xử lý hướng sự kiện bất đồng bộ)", 
         "Tách rời hoàn toàn các tác vụ tính toán nặng và phụ thuộc bên thứ ba (gọi mô hình ngôn ngữ lớn LLM để trích xuất việc, tiếp nhận GitHub Webhook, tính toán ma trận điểm) khỏi luồng chính của Web Server. Hàng đợi thông điệp độc lập đảm bảo không nghẽn Event Loop.", 
         "Hàng đợi thông điệp Amazon SQS FIFO kết hợp hàm Serverless AWS Lambda."),
        ("Stateless Direct-to-Cloud Storage\n(Lưu trữ phi trạng thái)", 
         "Tách rời 100% lưu lượng truyền tải tệp tin dung lượng lớn (giáo trình, slide bài giảng, đặc tả dự án) khỏi máy chủ ứng dụng. Máy chủ chỉ đóng vai trò cấp quyền tạm thời, Client đẩy tải trực tiếp lên Object Storage, giữ Web Server hoàn toàn không trạng thái (Stateless).", 
         "Amazon S3 Presigned URLs kết hợp mạng phân phối nội dung CloudFront.")
    ]

    for row_idx, r_data in enumerate(models_data, start=1):
        for col_idx, text in enumerate(r_data):
            cell = tbl_mod.cell(row_idx, col_idx)
            set_cell_margins(cell, 70, 70, 90, 90)
            if row_idx % 2 == 1:
                set_cell_background(cell, HEX_ALT_ROW)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    add_h2("1.3. Ba Trục Biến đổi Dữ liệu Xuyên suốt")
    p = doc.add_paragraph("Mọi tương tác trong hệ thống đều tuân thủ nguyên lý chuyển hóa thông tin từ trạng thái thô sang dữ liệu định lượng trên ba trục:")
    p1 = doc.add_paragraph(style='List Bullet')
    p1.add_run("Trục Thời gian (Temporal Stream): ").bold = True
    p1.add_run("Chuyển dịch các sự kiện vi viễn trắc từ trình duyệt (DOM visibility, focus state) thành các block thời gian tập trung hữu hiệu.")
    
    p2 = doc.add_paragraph(style='List Bullet')
    p2.add_run("Trục Tri thức & Nhiệm vụ (Cognitive & Task Stream): ").bold = True
    p2.add_run("Chuyển dịch ngôn ngữ tự nhiên từ dòng chat và tài liệu thô thành các thẻ việc chuẩn hóa có độ phức tạp Story Points rõ ràng.")

    p3 = doc.add_paragraph(style='List Bullet')
    p3.add_run("Trục Đóng góp (Contribution Stream): ").bold = True
    p3.add_run("Chuyển dịch toàn bộ bằng chứng kỹ thuật (mã nguồn commit, làm task, sửa tài liệu, tập trung) thành Vector Đóng góp đa chiều.")

    doc.add_page_break()

    # =============================================================
    # TRANG 2: PHÂN HỆ 1 - TẬP TRUNG ĐỒNG BỘ & VIỄN TRẮC XAO NHÃNG
    # =============================================================
    add_h1("PHẦN 2: ĐẶC TẢ CHI TIẾT 4 PHÂN HỆ CHỨC NĂNG CỐT LÕI")
    
    add_h2("2.1. Phân hệ 1: Không gian Tập trung Đồng bộ & Đo kiểm Xao nhãng (Focus War-Room)")
    
    add_h3("A. Đặc tả Dữ liệu Đầu vào (INPUT)")
    p = doc.add_paragraph(
        "Phân hệ tiếp nhận hai nhóm dữ liệu đầu vào mang tính thời gian thực:\n"
        "1. Lệnh Khởi tạo Phiên (Session Initiation Command): Gửi từ Trưởng nhóm qua WebSocket/REST, gồm định danh không gian làm việc (workspace_id), "
        "thời lượng phiên tập trung (duration_minutes: mặc định 25 phút), thời lượng giải lao (break_minutes: 5 phút), và định danh người khởi tạo.\n"
        "2. Luồng Dữ liệu Vi viễn trắc Khách (Client Telemetry Stream): Thu thập liên tục từ các trình duyệt của thành viên trong phòng, bao gồm:\n"
        "   - document.visibilityState: Trạng thái hiển thị của tab trình duyệt (mang giá trị 'visible' khi đang mở tab, hoặc 'hidden' khi rời tab).\n"
        "   - window.onblur / window.onfocus: Sự kiện mất tiêu điểm cửa sổ khi người dùng thu nhỏ trình duyệt hoặc mở phần mềm khác đè lên.\n"
        "   - Heartbeat Ping: Gói tin xác nhận kết nối mạng gửi định kỳ mỗi 5000 mili-giây, chứa dấu thời gian cục bộ của máy khách."
    )

    add_h3("B. Nội hàm Xử lý Kỹ thuật (INTERNAL PROCESSING MECHANISM)")
    p = doc.add_paragraph(
        "1. Thuật toán Đồng hồ Chuẩn tuyệt đối (Zero-Broadcast Absolute Target-Epoch):\n"
        "Trong các hệ thống thông thường, máy chủ thường phát sóng gói tin đếm lùi mỗi giây cho toàn bộ phòng. Cách làm này gây lãng phí băng thông "
        "và làm nghẽn CPU khi số lượng kết nối tăng cao. TeamUp AI giải quyết bằng thuật toán mốc thời gian tuyệt đối:\n"
        "Khi Trưởng nhóm phát lệnh bắt đầu, máy chủ tính toán mốc Epoch kết thúc chuẩn và lưu vào Redis: TargetEpoch = CurrentServerEpoch + (duration * 60). "
        "Gói tin thông báo bắt đầu kèm TargetEpoch chỉ được phát thanh một lần duy nhất. Trình duyệt client tự động đếm lùi cục bộ theo công thức: "
        "Thời gian còn lại = max(0, TargetEpoch - CurrentClientEpoch). Định kỳ mỗi 10 giây, Client nhận phản hồi heartbeat để tự động bù trừ sai số xung nhịp (Clock Drift)."
    )
    p = doc.add_paragraph(
        "2. Máy Trạng thái Giám sát Xao nhãng với Cửa sổ Đệm 15 Giây (Distraction State Machine & 15s Grace Period):\n"
        "Hệ thống phân loại trạng thái tập trung của thành viên thành 3 mức: TẬP TRUNG (Xanh lục), CẢNH BÁO (Vàng), và XAO NHÃNG (Đỏ). "
        "Để tránh phạt oan sinh viên khi chuyển tab tra cứu tài liệu nhanh, cơ chế hoạt động được chuẩn hóa như sau:"
    )

    add_callout([
        "• Bước 1: Khi trình duyệt phát sự kiện rời tab (hidden), máy chủ Redis thiết lập một bộ đếm thời gian trôi t_grace = 15 giây và đổi trạng thái hiển thị của người đó sang mức CẢNH BÁO (Vàng).",
        "• Bước 2: Nếu người dùng quay lại tab học trước khi hết 15 giây (sự kiện visible), bộ đếm bị hủy bỏ, trạng thái phục hồi mức TẬP TRUNG (Xanh lục), thời gian tập trung không bị gián đoạn.",
        "• Bước 3: Nếu quá 15 giây không có tín hiệu quay lại, trạng thái lập tức chuyển sang XAO NHÃNG (Đỏ). Máy chủ đóng băng biến tích lũy thời gian hữu hiệu T_focus của người đó và phát sóng sự kiện báo động đến toàn thể phòng học."
    ], title="CƠ CHẾ BẢO VỆ TÍNH TRUNG THỰC CỦA ĐỒNG HỒ TẬP TRUNG:")

    add_h3("C. Đặc tả Dữ liệu Đầu ra (OUTPUT)")
    p = doc.add_paragraph(
        "1. Đầu ra Thời gian thực (WebSocket Broadcast): Phát sóng trạng thái hiện diện của từng người trong phòng kèm mã màu trực quan (#22c55e, #eab308, #ef4444) "
        "và số giây tập trung hữu hiệu tích lũy đến thời điểm hiện tại.\n"
        "2. Đầu ra Lưu trữ Bền vững (PostgreSQL Persistence): Khi kết thúc phiên Pomodoro, dữ liệu được ghi xả xuống bảng lịch sử phiên, lưu trữ: "
        "Tổng thời lượng phiên, thời điểm bắt đầu/kết thúc, số phút tập trung thực tế của từng cá nhân (đã trừ thời gian xao nhãng), và số lần vi phạm rời tab."
    )

    doc.add_page_break()

    # =============================================================
    # TRANG 3: PHÂN HỆ 2 - BẢNG KANBAN & PIPELINE AI ĐIỀU PHỐI
    # =============================================================
    add_h2("2.2. Phân hệ 2: Bảng Kanban Tự động hóa & Trợ lý Điều phối (Chat-to-Kanban AI Engine)")
    
    add_h3("A. Đặc tả Dữ liệu Đầu vào (INPUT)")
    p = doc.add_paragraph(
        "Phân hệ thu nhận dữ liệu từ ba nguồn ngữ cảnh phục vụ việc trích xuất công việc:\n"
        "1. Dòng Hội thoại Phòng học (Raw Chat Conversation Stream): Chuỗi các tin nhắn trao đổi tự nhiên giữa các thành viên, "
        "kèm mã người gửi, tên hiển thị và dấu thời gian phát biểu.\n"
        "2. Ma trận Năng lực & Chuyên môn Thành viên (Member Competency Matrix): Danh sách hồ sơ sinh viên trong nhóm, "
        "bao gồm các kỹ năng công nghệ đăng ký (ví dụ: Backend, Cơ sở dữ liệu, Giao diện React, Thiết kế Figma, Kiểm thử phần mềm).\n"
        "3. Trạng thái Thẻ Hiện hữu (Existing Kanban Board State): Danh mục tiêu đề các thẻ công việc đang có trên bảng để ngăn chặn AI tạo trùng việc."
    )

    add_h3("B. Nội hàm Xử lý Kỹ thuật (INTERNAL PROCESSING MECHANISM)")
    p = doc.add_paragraph(
        "1. Tách rời Luồng Xử lý qua Hàng đợi Thông điệp (Asynchronous SQS FIFO Decoupling):\n"
        "Thời gian xử lý mô hình ngôn ngữ lớn (LLM) thường mất từ 2 đến 5 giây. Nếu thực thi trực tiếp trên máy chủ chính, toàn bộ các kết nối WebSocket khác "
        "sẽ bị nghẽn (Event Loop Blocking). Vì vậy, máy chủ đóng gói ngữ cảnh thành bản tin và đẩy vào hàng đợi Amazon SQS FIFO. "
        "Hàm phi máy chủ AWS Lambda được kích hoạt độc lập để xử lý mà không làm ảnh hưởng đến hiệu năng máy chủ giao tiếp."
    )
    p = doc.add_paragraph(
        "2. Cơ chế Trích xuất Tất định và Ép kiểu Cấu trúc (Deterministic Structured Output):\n"
        "Để đảm bảo kết quả trích xuất luôn tương thích với bảng Kanban mà không bao giờ gặp lỗi cú pháp hay bị ảo giác (Hallucination), "
        "hệ thống áp dụng các kỹ thuật khống chế sau:"
    )

    add_callout([
        "• Khống chế Nhiệt độ (Temperature Control): Thiết lập mức nhiệt độ sinh cực thấp (Temperature = 0.1) nhằm triệt tiêu tính ngẫu nhiên, đảm bảo tính tất định cao nhất cho kết quả.",
        "• Ép kiểu Schema Cấu trúc: Mô hình được định tuyến để trả về dữ liệu tuân thủ nghiêm ngặt theo cấu trúc trường định sẵn: Tiêu đề nhiệm vụ (task_title), Mô tả chi tiết (task_description), Mã thành viên được đề xuất (suggested_assignee_id), Trọng số độ khó (story_points), và Thời hạn ước tính (deadline_offset_days).",
        "• Thuật toán Khớp Năng lực (Heuristic Matching): Đối sánh từ khóa nội dung công việc với danh mục kỹ năng của từng thành viên để tự động gán đúng người đúng việc.",
        "• Định lượng Độ khó Chuẩn Fibonacci: Trọng số công việc được ép buộc thuộc tập giá trị Fibonacci chuẩn [1, 2, 3, 5] dựa trên độ phức tạp kỹ thuật."
    ], title="NGUYÊN TẮC ĐIỀU PHỐI VÀ TRÍCH XUẤT CÔNG VIỆC BẰNG TRÍ TUỆ NHÂN TẠO:")

    add_h3("C. Đặc tả Dữ liệu Đầu ra (OUTPUT)")
    p = doc.add_paragraph(
        "1. Thẻ Nhiệm vụ Đề xuất (Draft Task Proposals): Khối dữ liệu dạng danh sách thẻ xuất hiện trên bảng điều khiển của Trưởng nhóm, "
        "cho phép Trưởng nhóm duyệt nhanh bằng một cú bấm, hoặc chỉnh sửa người nhận, hạn chót và điểm Story Points trước khi xác nhận.\n"
        "2. Thẻ Kanban Chính thức (Official Kanban Tasks): Sau khi Trưởng nhóm phê duyệt, các bản ghi được lưu chính thức vào cơ sở dữ liệu quan hệ "
        "ở trạng thái 'CẦN LÀM' (TODO). Hệ thống đồng thời phát sự kiện WebSocket để cập nhật tức thì thẻ mới lên màn hình của mọi thành viên."
    )

    doc.add_page_break()

    # =============================================================
    # TRANG 4: PHÂN HỆ 3 - GHI CHÚ CỘNG TÁC & TRỢ LÝ RAG
    # =============================================================
    add_h2("2.3. Phân hệ 3: Soạn thảo Cộng tác & Trợ lý Ngữ cảnh Tài liệu (Live Notes & RAG Tutor)")
    
    add_h3("A. Đặc tả Dữ liệu Đầu vào (INPUT)")
    p = doc.add_paragraph(
        "Phân hệ tiếp nhận ba luồng thông tin phục vụ việc cộng tác tài liệu và hỏi đáp học thuật:\n"
        "1. Thao tác Soạn thảo Văn bản (Block-level Mutation Stream): Tọa độ con trỏ soạn thảo của từng thành viên, sự kiện nhập ký tự, "
        "xóa đoạn văn và cập nhật nội dung trên từng khối văn bản (Block).\n"
        "2. Tệp Tri thức Học tập Đính kèm (Uploaded Academic Documents): Các tệp giáo trình, slide bài giảng môn học, đề bài tập lớn "
        "được tải lên dưới định dạng PDF hoặc DOCX (dung lượng hỗ trợ tối đa 50MB).\n"
        "3. Truy vấn Ngữ cảnh Bôi đen (Selected Context Query): Đoạn văn bản cụ thể mà sinh viên bôi đen trong tài liệu ghi chú kèm thao tác yêu cầu giải thích bám sát học liệu."
    )

    add_h3("B. Nội hàm Xử lý Kỹ thuật (INTERNAL PROCESSING MECHANISM)")
    p = doc.add_paragraph(
        "1. Cơ chế Chống Xung đột Soạn thảo bằng Khóa Phân đoạn có Thời hạn Thuê (Block-level Leased Locking trên Redis):\n"
        "Để đảm bảo nhiều người có thể cùng mở một tài liệu và chỉnh sửa đồng thời mà không bị tình trạng người này gõ đè mất chữ của người kia (Race Condition), "
        "TeamUp AI chia nhỏ tài liệu thành danh sách các khối (Blocks) độc lập có định danh duy nhất (UUID). Khi sinh viên A đặt con trỏ vào Block K:\n"
        "   - Client gửi lệnh yêu cầu chiếm quyền: Máy chủ Redis thực thi lệnh nguyên tử thiết lập khóa: Khóa Block K cho sinh viên A với thời gian thuê (TTL) là 10 giây.\n"
        "   - Nếu thành công, Block K chuyển sang trạng thái chỉ đọc đối với toàn bộ các thành viên khác; con trỏ của sinh viên A hiển thị kèm tên đại diện.\n"
        "   - Khóa tự động được gia hạn liên tục khi A tiếp tục gõ; và tự động giải phóng tức thì khi A chuyển sang Block khác hoặc tự hết hạn an toàn sau 10 giây nếu sinh viên A bị rớt mạng đột ngột."
    )
    p = doc.add_paragraph(
        "2. Pipeline Truy xuất Tri thức Tăng cường Nội bộ (RAG Architecture & Grounded Synthesis):\n"
        "Để tránh hiện tượng mô hình AI trả lời lan man hoặc bịa đặt kiến thức ngoài chương trình đào tạo, chu trình RAG được thiết kế khép kín:"
    )

    add_callout([
        "• Giai đoạn 1 - Nạp và Vector hóa Tài liệu: Khi tệp PDF được tải lên, hàm Lambda tự động trích xuất toàn bộ văn bản thô, chia nhỏ thành các đoạn trích (Chunk size: 512 tokens, độ gối đầu: 64 tokens), gọi mô hình Embedding để chuyển đổi thành các vector 1536 chiều và lưu trữ vào bảng vector trên cơ sở dữ liệu.",
        "• Giai đoạn 2 - Truy xuất Không gian Vector (Cosine Distance Search): Khi sinh viên bôi đen một đoạn văn bản ghi chú khó hiểu, hệ thống vector hóa đoạn trích đó và thực hiện truy vấn khoảng cách Cosine trên cơ sở dữ liệu để tìm ra Top-3 đoạn trích trong giáo trình có độ tương đồng ngữ nghĩa cao nhất.",
        "• Giai đoạn 3 - Tổng hợp Có Căn cứ (Grounded Synthesis): Đưa 3 đoạn trích tìm được vào ngữ cảnh chỉ định: 'Chỉ được sử dụng ngữ cảnh tài liệu đính kèm để giải thích. Nếu tài liệu không chứa thông tin, phải trả lời rõ ràng là tài liệu nhóm không đề cập, tuyệt đối không suy đoán ngoài phạm vi'."
    ], title="QUY TRÌNH TRÍCH XUẤT VÀ TỔNG HỢP TRI THỨC HỌC LIỆU:")

    add_h3("C. Đặc tả Dữ liệu Đầu ra (OUTPUT)")
    p = doc.add_paragraph(
        "1. Văn bản Ghi chú Hợp nhất (Unified Live Document): Dữ liệu tài liệu được đồng bộ hóa tức thời trên màn hình của toàn bộ thành viên trong nhóm, "
        "đảm bảo tính toàn vẹn và không xảy ra hiện tượng mất ký tự.\n"
        "2. Hộp thoại Giải nghĩa Ngữ cảnh (Grounded Answer Popover): Hộp thông tin hiển thị lời giải thích rõ ràng, súc tích "
        "kèm trích dẫn minh bạch nguồn tài liệu (tên tệp tin gốc và vị trí trang tài liệu đối chứng)."
    )

    doc.add_page_break()

    # =============================================================
    # TRANG 5: PHÂN HỆ 4 - ĐỘNG CƠ ĐỊNH LƯỢNG ĐÓNG GÓP (PROOF-OF-WORK)
    # =============================================================
    add_h1("2.4. Phân hệ 4: Động cơ Định lượng Đóng góp Kỹ thuật (Proof-of-Work & Anti-Free-Riding)")
    
    add_h2("A. Đặc tả Dữ liệu Đầu vào (INPUT)")
    p = doc.add_paragraph(
        "Động cơ định lượng tiếp nhận 4 nguồn dữ liệu độc lập đã qua thẩm định kỹ thuật ở các phân hệ trước:\n"
        "1. Thời lượng Tập trung Hữu hiệu (T_focus): Tổng số phút tập trung thực chất của từng cá nhân từ Phân hệ 1.\n"
        "2. Thẻ Công việc Hoàn thành (P_task): Tổng Story Points của các thẻ nhiệm vụ đạt trạng thái HOÀN THÀNH (DONE) được Trưởng nhóm nghiệm thu từ Phân hệ 2.\n"
        "3. Sự kiện Đẩy Mã nguồn GitHub (E_git): Dữ liệu tiếp nhận từ GitHub Webhook, bao gồm danh sách commit, tên tác giả, thông điệp commit, số dòng mã thêm/bớt.\n"
        "4. Đóng góp Tài liệu & Ghi chú (D_doc): Số lượng biến phân nội dung có giá trị đóng góp vào tài liệu nhóm lưu trữ tại bảng nhật ký kiểm toán.\n"
        "5. Vector Trọng số Nhóm (Weights Vector): Bộ 4 trọng số [w1, w2, w3, w4] do Trưởng nhóm ấn định cho đề tài (ràng buộc: Tổng trọng số bằng 1.0)."
    )

    add_h2("B. Nội hàm Xử lý Kỹ thuật (INTERNAL PROCESSING MECHANISM)")
    p = doc.add_paragraph(
        "1. Cơ chế Lọc và Xác thực Mã nguồn Chống Gian lận (Anti-Tampering Git Verifier):\n"
        "   - Xác thực Chữ ký Mật mã: Mỗi gói tin Webhook từ GitHub gửi về đều được máy chủ giải mã chữ ký HMAC-SHA256 để chống các cuộc gọi giả mạo.\n"
        "   - Đối chiếu Mã Nhiệm vụ: Quét biểu thức chính quy trong nội dung commit để tìm mã thẻ việc (ví dụ: '[TASK-12]'). Chỉ những commit gắn đúng mã việc đang được giao cho người đó mới được tính điểm.\n"
        "   - Bộ lọc Đóng góp Rác (Garbage Commit Filter): Tự động nhận diện và loại trừ các commit không mang giá trị logic (như chỉ sửa file .gitignore, file README, hoặc chỉ thêm dòng trống/khoảng trắng)."
    )
    p = doc.add_paragraph(
        "2. Thuật toán Chuẩn hóa Điểm Đa trục (Z-Score Normalization & Sigmoid Scaling):\n"
        "Để ngăn chặn hiện tượng sinh viên 'cày số lượng' (tạo hàng chục commit nhỏ vặt hoặc spam việc nhỏ 1 điểm để tăng điểm ảo), "
        "dữ liệu thô của từng sinh viên trên từng trục k được chuẩn hóa theo phân phối của toàn bộ nhóm:"
    )

    add_callout([
        "• Bước 1 - Tính toán Điểm Lệch Chuẩn hóa (Z-Score):",
        "         Z_{u,k} = (X_{u,k} - μ_k) / (σ_k + ε)",
        "  (Trong đó X_{u,k} là giá trị thực tế của sinh viên u trên trục k; μ_k là giá trị trung bình của nhóm; σ_k là độ lệch chuẩn của nhóm; ε = 1e-6 là số cực nhỏ chống lỗi chia cho 0).",
        "• Bước 2 - Nén Điểm về Thang đo Tuyệt đối 100 bằng Hàm Sigmoid:",
        "         S_{u,k} = 100 / (1 + exp(-Z_{u,k}))",
        "  Hàm Sigmoid đảm bảo điểm số luôn nằm mượt mà trong khoảng [0, 100], triệt tiêu ảnh hưởng tiêu cực của các giá trị ngoại lai (Outliers).",
        "• Bước 3 - Tính toán Điểm Đóng góp Tổng hợp Chung cuộc (C_u):",
        "         C_u = w1 * S_{u,T} + w2 * S_{u,P} + w3 * S_{u,C} + w4 * S_{u,D}",
        "  Điểm số chung cuộc là tích vô hướng giữa Vector Điểm Thành Phần và Vector Trọng Số Đề Tài do Trưởng nhóm thiết lập."
    ], title="CÔNG THỨC TOÁN HỌC ĐỊNH LƯỢNG ĐÓNG GÓP TOÀN DIỆN:")

    add_h2("C. Đặc tả Dữ liệu Đầu ra (OUTPUT)")
    p = doc.add_paragraph(
        "1. Biểu đồ Radar 4 Trục Trực quan (Multi-Axis Contribution Radar Chart): Trực quan hóa hình mạng nhện thể hiện sự phân bổ năng lực cá nhân "
        "trên 4 khía cạnh: Kỷ luật Tập trung, Hoàn thành Nhiệm vụ, Đóng góp Mã nguồn Kỹ thuật, và Đóng góp Tài liệu/Ghi chú. "
        "Giảng viên nhìn vào biểu đồ là nhận diện ngay sinh viên đóng vai trò kiến trúc sư lõi, sinh viên làm tài liệu, hay sinh viên thụ động.\n"
        "2. Bảng Truy vết Kiểm toán Không thể Chối cãi (Audit Trail Table): Bảng tổng hợp minh bạch phục vụ bảo vệ đồ án, "
        "cho phép nhấp vào từng điểm thành phần để mở ra bằng chứng gốc tương ứng: Đường dẫn commit trên GitHub, lịch sử phiên Pomodoro, ID thẻ việc hoàn thành."
    )

    doc.add_page_break()

    # =============================================================
    # TRANG 6: THIẾT KẾ DỮ LIỆU & TỪ ĐIỂN DỮ LIỆU VẬT LÝ
    # =============================================================
    add_h1("PHẦN 3: THIẾT KẾ DỮ LIỆU & TỪ ĐIỂN DỮ LIỆU CHI TIẾT")
    
    add_h2("3.1. Bảng Từ Điển Dữ Liệu Thực Thể Quản Trị Công Việc (Tasks Data Dictionary)")
    p = doc.add_paragraph("Thực thể lưu trữ các thẻ nhiệm vụ trong không gian làm việc của nhóm, đóng vai trò hạt nhân trong Phân hệ 2 và Phân hệ 4:")

    tbl_task = doc.add_table(rows=8, cols=4)
    tbl_task.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_task)
    style_header_row(tbl_task, ["Tên Thuộc Tính", "Kiểu Dữ Liệu", "Ràng Buộc & Giá Trị", "Ý Nghĩa Nghiệp Vụ"])

    task_cols = [
        ("id", "UUID", "Khóa chính (PK), Mặc định sinh tự động", "Mã định danh duy nhất của từng thẻ công việc trong toàn hệ thống."),
        ("workspace_id", "UUID", "Khóa ngoại (FK), Không được rỗng", "Liên kết trực tiếp tới không gian làm việc (Workspace) sở hữu thẻ."),
        ("title", "VARCHAR(255)", "Chuỗi văn bản, Không được rỗng", "Tiêu đề công việc chuẩn hóa (Động từ + Tân ngữ chỉ mục tiêu)."),
        ("status", "VARCHAR(32)", "Thuộc tập: TODO, IN_PROGRESS, IN_REVIEW, DONE", "Trạng thái vòng đời của thẻ trên bảng Kanban cộng tác."),
        ("story_points", "INTEGER", "Bắt buộc thuộc dãy Fibonacci: 1, 2, 3, 5", "Trọng số độ khó kỹ thuật làm căn cứ tính điểm đóng góp."),
        ("assignee_id", "UUID", "Khóa ngoại (FK), Cho phép rỗng khi mới tạo", "Mã thành viên được giao trách nhiệm thực hiện công việc."),
        ("is_ai_generated", "BOOLEAN", "Mặc định FALSE", "Cờ đánh dấu thẻ được trích xuất tự động bởi trợ lý AI hay tạo thủ công.")
    ]

    for row_idx, r_data in enumerate(task_cols, start=1):
        for col_idx, text in enumerate(r_data):
            cell = tbl_task.cell(row_idx, col_idx)
            set_cell_margins(cell, 60, 60, 70, 70)
            if row_idx % 2 == 1:
                set_cell_background(cell, HEX_ALT_ROW)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9.0)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    add_h2("3.2. Bảng Từ Điển Dữ Liệu Thực Thể Nhật Ký Kiểm Toán (Activity Logs Data Dictionary)")
    p = doc.add_paragraph("Thực thể bất biến ghi lại mọi sự kiện đóng góp kỹ thuật, phục vụ việc đối soát và truy vết bằng chứng khi chấm điểm:")

    tbl_log = doc.add_table(rows=7, cols=4)
    tbl_log.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_log)
    style_header_row(tbl_log, ["Tên Thuộc Tính", "Kiểu Dữ Liệu", "Ràng Buộc & Giá Trị", "Ý Nghĩa Nghiệp Vụ"])

    log_cols = [
        ("id", "BIGINT", "Khóa chính (PK), Tự động tăng", "Định danh số thứ tự của sự kiện kiểm toán."),
        ("workspace_id", "UUID", "Khóa ngoại (FK), Không được rỗng", "Liên kết không gian làm việc nơi sự kiện phát sinh."),
        ("user_id", "UUID", "Khóa ngoại (FK), Không được rỗng", "Mã thành viên trực tiếp thực hiện hoặc tạo ra hành động đóng góp."),
        ("activity_type", "VARCHAR(64)", "POMODORO_SESSION, TASK_COMPLETED, GIT_COMMIT, DOC_EDITED", "Phân loại nguồn gốc đóng góp kỹ thuật."),
        ("evidence_payload", "JSONB", "Dữ liệu có cấu trúc, Không được rỗng", "Gói thông tin chi tiết bằng chứng (Commit Hash, Task ID, URL đối chứng)."),
        ("occurred_at", "TIMESTAMP", "Dấu thời gian chuẩn UTC", "Thời điểm tuyệt đối ghi nhận sự kiện phục vụ sắp xếp thứ tự.")
    ]

    for row_idx, r_data in enumerate(log_cols, start=1):
        for col_idx, text in enumerate(r_data):
            cell = tbl_log.cell(row_idx, col_idx)
            set_cell_margins(cell, 60, 60, 70, 70)
            if row_idx % 2 == 1:
                set_cell_background(cell, HEX_ALT_ROW)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9.0)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    add_h2("3.3. Đặc tả Cấu trúc Hợp đồng Trao đổi Thông điệp (Message Contracts Specification)")
    p = doc.add_paragraph(
        "Thay vì sử dụng các cấu trúc phi quy chuẩn, các bản tin trao đổi giữa Client, Server và Hàng đợi được phân định thành các trường tường minh:\n"
        "• Bản tin Viễn trắc Khách (Client Telemetry Beat): Gồm trường mã sự kiện (event_name), dấu thời gian máy khách (client_epoch), "
        "mã người dùng (user_id), trạng thái tab hiện thời (tab_visibility: 'visible' | 'hidden'), và số giây không tương tác (idle_seconds).\n"
        "• Bản tin Yêu cầu Trích xuất Việc (Task Extraction Message): Gồm định danh phòng học (workspace_id), danh sách tin nhắn hội thoại "
        "kèm dấu thời gian, danh sách kỹ năng chuyên môn của từng thành viên, và danh mục các thẻ hiện có trên bảng để loại trừ trùng lặp."
    )

    doc.add_page_break()

    # =============================================================
    # TRANG 7: NỘI HÀM KIẾN TRÚC VẬN HÀNH ĐẦU CUỐI & TOÀN VẸN
    # =============================================================
    add_h1("PHẦN 4: NỘI HÀM KIẾN TRÚC VẬN HÀNH & TÍNH TOÀN VẸN HỆ THỐNG")
    
    add_h2("4.1. Cơ chế Truyền tải Tệp tin Không trạng thái (Direct-to-S3 Presigned URL Flow)")
    p = doc.add_paragraph(
        "Trong các hệ thống thông thường, tệp tin tải lên được gửi tới Web Server trước khi lưu vào đĩa cứng. Khi nhiều sinh viên cùng tải các file "
        "giáo trình hoặc slide bài giảng nặng hàng chục Megabyte, máy chủ sẽ nhanh chóng cạn kiệt bộ nhớ RAM và băng thông mạng. "
        "TeamUp AI triệt tiêu hoàn toàn điểm nghẽn này bằng cơ chế cấp quyền tạm thời:"
    )

    add_callout([
        "• Bước 1 (Yêu cầu Cấp quyền): Trình duyệt sinh viên gửi siêu dữ liệu tệp tin (tên file, dung lượng, định dạng) lên API của Web Server.",
        "• Bước 2 (Ký cấp Presigned URL): Web Server kiểm tra quyền thành viên trong phòng, gọi thư viện đám mây để tạo ra một đường dẫn cấp quyền tạm thời (S3 Presigned URL) có thời hạn sống đúng 300 giây và trả về cho Client.",
        "• Bước 3 (Truyền tải Trực tiếp): Trình duyệt Client thực hiện phương thức HTTP PUT truyền trực tiếp dữ liệu nhị phân của tệp tin lên kho chứa Amazon S3. Lưu lượng mạng I/O hoàn toàn không đi qua Web Server.",
        "• Bước 4 (Kích hoạt Tự động): Sự kiện tạo tệp trên S3 tự động phát tín hiệu kích hoạt hàm phi máy chủ AWS Lambda phân rã tài liệu phục vụ phân hệ RAG."
    ], title="CHU TRÌNH TẢI TỆP TIN PHI TRẠNG THÁI (STATELESS I/O FLOW):")

    add_h2("4.2. Kiến trúc Hai Tầng Lưu trữ Trạng thái (Dual-Tier State Architecture)")
    p = doc.add_paragraph(
        "Để đáp ứng đồng thời hai yêu cầu kỹ thuật tưởng chừng mâu thuẫn: Xử lý tức thời phần nghìn giây (Sub-millisecond) cho các thao tác đồng thời, "
        "và Lưu trữ bền vững tuyệt đối cho dữ liệu đồ án tốt nghiệp, hệ thống phân định thành hai tầng lưu trữ:"
    )

    tbl_tier = doc.add_table(rows=6, cols=3)
    tbl_tier.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_tier)
    style_header_row(tbl_tier, ["Tiêu Chí So Sánh", "Tầng Nóng Tức Thời (Hot State In-Memory)", "Tầng Bền Vững Lâu Dài (Cold Persistent)"])

    tier_data = [
        ("Công nghệ Lưu trữ", "Cụm Redis In-Memory Cluster", "Amazon RDS PostgreSQL 16"),
        ("Tốc độ Đọc/Ghi", "Dưới 5 mili-giây (Truy xuất trực tiếp trên RAM)", "15 - 50 mili-giây (Ghi khối đĩa từ EBS)"),
        ("Dữ liệu Đại diện", "Tọa độ con trỏ, Khóa Block ghi chú, Bộ đếm lùi, Trạng thái tab", "Thẻ việc Kanban, Điểm đóng góp tổng hợp, Hồ sơ, Nhật ký kiểm toán"),
        ("Khả năng Phục hồi", "Tự động giải phóng khi hết phiên hoặc hết hạn TTL", "Sao lưu tự động hàng ngày, bảo toàn 100% khi mất điện"),
        ("Chiến lược Đồng bộ", "Phát sóng tức thì qua WebSocket tới các client", "Quét và ghi xả (Flush down) định kỳ sau mỗi chu kỳ phiên")
    ]

    for row_idx, r_data in enumerate(tier_data, start=1):
        for col_idx, text in enumerate(r_data):
            cell = tbl_tier.cell(row_idx, col_idx)
            set_cell_margins(cell, 60, 60, 70, 70)
            if row_idx % 2 == 1:
                set_cell_background(cell, HEX_ALT_ROW)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9.0)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    add_h2("4.3. Máy Trạng thái Vòng đời Thẻ Công việc và Các Bất biến Nghiệp vụ (Business Invariants)")
    p = doc.add_paragraph(
        "Mọi thẻ công việc trên bảng Kanban đều trải qua chuỗi biến đổi trạng thái được kiểm soát chặt chẽ bởi các quy tắc nghiệp vụ bất biến:\n"
        "• Trạng thái ĐỀ XUẤT (PROPOSED): Do trợ lý AI sinh ra từ đoạn chat, nằm trong danh sách chờ Trưởng nhóm duyệt.\n"
        "• Trạng thái CẦN LÀM (TODO): Trưởng nhóm đã duyệt, thẻ hiển thị trên bảng việc chung của cả phòng.\n"
        "• Trạng thái ĐANG LÀM (IN_PROGRESS): Thành viên nhận việc và bắt đầu thực hiện.\n"
        "• Trạng thái CHỜ DUYỆT (IN_REVIEW): Bất biến 1 — Thẻ chỉ được phép chuyển sang trạng thái này khi hệ thống kiểm chứng thành viên đã nộp ít nhất một commit trên GitHub có gắn mã thẻ hoặc có tệp tài liệu đính kèm.\n"
        "• Trạng thái HOÀN THÀNH (DONE): Bất biến 2 — Trọng số Story Points chỉ được chính thức giải ngân và cộng vào quỹ điểm cá nhân khi có sự phê duyệt nghiệm thu từ tài khoản có vai trò Trưởng nhóm (LEADER)."
    )

    doc.add_page_break()

    # =============================================================
    # TRANG 8: MA TRẬN TỔNG HỢP & TIÊU CHÍ NGHIỆM THU ĐÁNH GIÁ
    # =============================================================
    add_h1("PHẦN 5: MA TRẬN TỔNG HỢP & TIÊU CHÍ NGHIỆM THU ĐÁNH GIÁ")
    
    add_h2("5.1. Ma trận Hợp nhất Toàn diện Input - Transform (Nội hàm) - Output")
    p = doc.add_paragraph("Bảng ma trận tổng hợp toàn bộ các điểm chạm dữ liệu và cơ chế chuyển dịch nội hàm của 4 phân hệ cốt lõi:")

    tbl_matrix = doc.add_table(rows=5, cols=3)
    tbl_matrix.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_matrix)
    style_header_row(tbl_matrix, ["Phân Hệ Chức Năng", "Dữ Liệu Đầu Vào (INPUT)", "Cơ Chế Nội Hàm & Dữ Liệu Đầu Ra (OUTPUT)"])

    matrix_rows = [
        ("Phân hệ 1:\nFocus War-Room", 
         "• Lệnh Start từ Trưởng nhóm.\n• Sự kiện DOM: visibilityState, focus/blur.\n• Heartbeat Ping định kỳ 5000ms.", 
         "NỘI HÀM: Đếm lùi theo TargetEpoch trên Redis; State Machine vùng đệm 15s xử lý xao nhãng; đóng băng bộ đếm T_focus.\nĐẦU RA: Gói tin đồng bộ WebSocket; Bảng màu UI (Xanh/Vàng/Đỏ); Ghi nhận thời gian tập trung thực chất xuống PostgreSQL."),
        ("Phân hệ 2:\nChat-to-Kanban", 
         "• Chuỗi tin nhắn hội thoại phòng học.\n• Ma trận kỹ năng thành viên (Roster).\n• Danh mục thẻ hiện hữu trên bảng việc.", 
         "NỘI HÀM: Hàng đợi SQS FIFO tách tải; Lambda gọi LLM với Temperature 0.1 ép kiểu cấu trúc; Heuristic matching Story points.\nĐẦU RA: Danh sách thẻ đề xuất chờ duyệt; Thẻ việc chính thức trên cột TODO sau khi Trưởng nhóm bấm duyệt."),
        ("Phân hệ 3:\nLive Notes & RAG", 
         "• Thao tác gõ ký tự từng Block.\n• Tệp giáo trình/slide tải lên S3.\n• Đoạn văn bản bôi đen cần giải thích.", 
         "NỘI HÀM: Block-level Leased Locking (TTL 10s trên Redis); Text Chunking & Vectorization 1536 chiều; Cosine search trên pgvector.\nĐẦU RA: Văn bản cộng tác nhất quán không ghi đè; Popover giải thích khái niệm trích dẫn chính xác số trang tài liệu nhóm."),
        ("Phân hệ 4:\nProof-of-Work", 
         "• Thời gian tập trung T_focus.\n• Story points các task hoàn thành.\n• Payload Webhook GitHub push.\n• Lịch sử chỉnh sửa ghi chú nhóm.", 
         "NỘI HÀM: HMAC-SHA256 xác thực Webhook; Regex lọc mã thẻ; Lọc commit rác; Chuẩn hóa Z-Score & Tích vô hướng Vector trọng số.\nĐẦU RA: Điểm đóng góp tổng hợp Cu; Biểu đồ Radar 4 trục minh bạch; Bảng nhật ký kiểm toán phục vụ giảng viên chấm đồ án.")
    ]

    for row_idx, r_data in enumerate(matrix_rows, start=1):
        for col_idx, text in enumerate(r_data):
            cell = tbl_matrix.cell(row_idx, col_idx)
            set_cell_margins(cell, 60, 60, 70, 70)
            if row_idx % 2 == 1:
                set_cell_background(cell, HEX_ALT_ROW)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(8.8)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    add_h2("5.2. Các Kịch bản Sự cố Phân tán & Cơ chế Chịu lỗi (Fault Tolerance Scenarios)")
    p = doc.add_paragraph(
        "Để chứng minh độ trưởng thành về kiến trúc phân tán trước Hội đồng phản biện, hệ thống thiết lập sẵn giải pháp cho 3 kịch bản lỗi:\n"
        "• Kịch bản 1 — Người dùng mất kết nối mạng đột ngột: Trình duyệt tự kích hoạt cơ chế Exponential Backoff Reconnect (thử lại sau 1s, 2s, 4s). "
        "Trong thời gian mất mạng dưới 30 giây, trạng thái phòng vẫn được giữ nguyên trên Redis; khi mạng khôi phục, Client nhận bản đồng bộ mới nhất mà không gián đoạn đồng hồ của nhóm.\n"
        "• Kịch bản 2 — Dịch vụ AI bên ngoài bị quá tải hoặc phản hồi chậm: Nhờ hàng đợi SQS FIFO, yêu cầu trích xuất không bị mất mà nằm chờ an toàn trong hàng đợi. "
        "Lambda tự động thử lại tối đa 3 lần; nếu vẫn lỗi, thông điệp chuyển vào Dead Letter Queue (DLQ) và gửi thông báo nhẹ nhàng lên giao diện mà không làm sập máy chủ.\n"
        "• Kịch bản 3 — Lưu lượng truy cập tăng đột biến trước kỳ thi: Nhờ sử dụng Redis Pub/Sub và lưu trữ phi trạng thái, tầng Web Server hoàn toàn không giữ phiên. "
        "Hệ thống cho phép nhân bản thêm các phiên bản máy chủ phía sau bộ cân bằng tải (Load Balancer) để nâng cao năng lực chịu tải tức thì."
    )

    add_h2("5.3. Bộ Chỉ số Đo lường Hiệu năng Kỹ thuật (Verification Benchmarks)")
    p = doc.add_paragraph("Hệ thống cam kết đạt 4 chỉ số kỹ thuật định lượng khi nghiệm thu đồ án:")
    p1 = doc.add_paragraph(style='List Bullet')
    p1.add_run("Độ trễ Đồng bộ Thời gian thực: ").bold = True
    p1.add_run("Thời gian trễ truyền gói tin từ lúc phát sinh sự kiện viễn trắc đến lúc toàn phòng nhận được đạt t < 80ms.")
    
    p2 = doc.add_paragraph(style='List Bullet')
    p2.add_run("Tính Bất biến của Bằng chứng: ").bold = True
    p2.add_run("100% điểm số kỹ thuật hiển thị trên biểu đồ Radar đối soát được trực tiếp về Commit Hash trên GitHub hoặc ID phiên học.")

    p3 = doc.add_paragraph(style='List Bullet')
    p3.add_run("Tính Chịu lỗi Hàng đợi: ").bold = True
    p3.add_run("Tỷ lệ thất thoát yêu cầu trích xuất công việc bằng 0% nhờ cơ chế lưu trữ bền bỉ của Amazon SQS và DLQ.")

    p4 = doc.add_paragraph(style='List Bullet')
    p4.add_run("Kiểm soát Chi phí Điện toán Đám mây: ").bold = True
    p4.add_run("Tận dụng tối đa mô hình Serverless Pay-per-use và S3 Presigned URL, chi phí vận hành thử nghiệm đồ án duy trì ở mức 0.00 USD/tháng.")

    # Save
    output_path = r"d:\TeamUp AI\Bao_Cao_Ky_Thuat_TeamUp_AI_Input_Output_Noi_Ham.docx"
    doc.save(output_path)
    print(f"Publication-grade document successfully generated at: {output_path}")

if __name__ == "__main__":
    create_rich_report()
