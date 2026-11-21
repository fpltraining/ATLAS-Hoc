/* Bài kiểm tra đầu vào tiếng Anh · "Ngày đầu tới Brightford": Kai dẫn người học đi một vòng thành phố
   (sân bay, xe buýt, khu phố Maple, quán cà phê, chợ, hiệu thuốc, ngân hàng, bệnh viện, trường...).
   Ở mỗi nơi người học nghe, đọc, đáp lời và nói như thật. 4 phần theo khung CEFR, đi từ dễ tới khó, tự dừng khi tới mức khó.
   Cấp: 1 Pre-A1 · 2 A1 · 3 A2 · 4 B1 · 5 B2 (0 = mới bắt đầu, chưa đạt Pre-A1).
   Mỗi cấp rút ngẫu nhiên từ kho 10 câu (phần Nói 3 câu), tránh câu đã gặp ở lần làm trước:
   đúng 2 câu đầu thì lên cấp, sai cả 2 thì dừng, đúng 1 thì làm câu thứ 3; đúng 1 sai 2 thì có 2 câu xác nhận (đúng cả 2 vẫn lên cấp).
   Đáp án đúng luôn đặt đầu mảng o (k = 0), lúc hiện sẽ tráo thứ tự.
   pl: nơi diễn ra (places), who: người nói (mặc định người ở nơi đó). Câu nghe / câu nói của nhân vật có giọng AI theo giới tính người nói
   (tools/build-audio-list.mjs đọc who[...][2]). Đổi chữ câu tiếng Anh thì phải tạo lại giọng. */
var G = window.G || (window.G = {});

G.PLACE_EN = {
  levels: ['A0', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'],
  names: ['Mới bắt đầu', 'Làm quen', 'Sơ cấp', 'Sơ trung cấp', 'Trung cấp', 'Trung cao cấp'],
  cando: [
    'Chưa nghe, đọc được từ quen thuộc. Bắt đầu từ chào hỏi, số đếm, đồ vật quanh mình.',
    'Hiểu từ đơn, số, lời chào; đọc được biển báo rất ngắn như EXIT, OPEN.',
    'Hiểu câu ngắn, nói chậm về bản thân, mua bán, chỉ đường đơn giản.',
    'Tự lo được việc hằng ngày: hẹn giờ, mua thuốc, hỏi giá, đọc tin nhắn công việc ngắn.',
    'Hiểu thông báo, email, cuộc nói chuyện thường gặp ở trường và nơi làm việc; nói được ý kiến đơn giản.',
    'Hiểu ý ngầm, quan điểm trong họp hành, tin tức; trao đổi trôi chảy về công việc.'
  ],
  parts: [
    { id: 'nghe', icon: '👂', name: 'Nghe', what: 'Người ở từng nơi nói với bạn, bạn chọn ý đúng. Nghe lại được, có nút nghe chậm.' },
    { id: 'doc', icon: '📖', name: 'Đọc', what: 'Đọc biển báo, tin nhắn, thông báo quanh thành phố rồi chọn ý đúng.' },
    { id: 'gt', icon: '💬', name: 'Phản xạ giao tiếp', what: 'Người ta nói một câu, bạn chọn câu đáp tự nhiên nhất.' },
    { id: 'noi', icon: '🗣️', name: 'Nói', what: 'Đọc to câu mẫu rồi tự trả lời câu hỏi. Cần micro; không có thì bỏ qua phần này.' }
  ],

  /* người nói: [tên, hình, giới tính giọng đọc] (hình null: không có người, vd. tin nhắn thoại, loa thông báo) */
  who: {
    grace: ['Officer Grace', 'npc_grace.png', 'f'], joe: ['Mr. Joe', 'npc_driver.png', 'm'], mom: ['Mom', 'npc_mom.png', 'f'],
    ben: ['Mr. Ben', 'npc_ben.png', 'm'], mia: ['Mia', 'npc_mia.png', 'f'], leo: ['Leo', 'npc_leo.png', 'm'], ray: ['Ray', 'npc_ray.png', 'm'],
    carlos: ['Carlos', 'npc_carlos.png', 'm'], dan: ['Officer Dan', 'npc_dan.png', 'm'], rosa: ['Mrs. Rosa', 'npc_rosa.png', 'f'],
    lee: ['Ms. Lee', 'npc_lee.png', 'f'], ivy: ['Ivy', 'npc_ivy.png', 'f'], tony: ['Tony', 'npc_tony.png', 'm'], grant: ['Mr. Grant', 'npc_grant.png', 'm'],
    anna: ['Dr. Anna', 'npc_anna.png', 'f'], max: ['Coach Max', 'npc_max.png', 'm'], nora: ['Ms. Nora', 'npc_nora.png', 'f'],
    emma: ['Ms. Emma', 'npc_emma.png', 'f'], tom: ['Mr. Tom', 'npc_tom.png', 'm'], owen: ['Mr. Owen', 'npc_owen.png', 'm'],
    pat: ['Ms. Pat', 'npc_pat.png', 'f'], jake: ['Jake', 'npc_jake.png', 'm'],
    phone: ['📱 Tin nhắn thoại', null, 'f'], pa: ['📢 Loa thông báo', null, 'f']
  },

  /* các nơi trong thành phố: ảnh nền (prop: hình dựng thêm trên nền, vd. xe bánh), người ở đó, cấp cần để tự lo được (bản đồ kết quả), khu, lời Kai dẫn đường */
  places: {
    airport: { name: 'Sân bay Brightford', bg: 'interior_en_airport.png', who: 'grace', lv: 1, area: 'arrive', kai: 'Mình vừa hạ cánh xuống Brightford! Ở sân bay ai cũng nói tiếng Anh.' },
    bus: { name: 'Xe buýt vào thành phố', bg: 'ride_bg_bus.png', who: 'joe', lv: 3, area: 'arrive', kai: 'Lên xe buýt vào thành phố nào. Bác tài Joe vui tính lắm.' },
    home: { name: 'Nhà ở khu phố Maple', bg: 'map_home_en_p.png', prop: 'pc_home.png', who: 'ben', lv: 1, area: 'maple', kai: 'Về khu phố Maple, nhà mình ở đây. Hàng xóm ra chào kìa.' },
    bakery: { name: 'Xe bánh Sunny', bg: 'map_home_en_p.png', prop: 'pc_cart.png', who: 'mia', lv: 1, area: 'maple', kai: 'Ghé xe bánh Sunny của chị Mia ăn sáng đã.' },
    cafe: { name: 'Quán cà phê của Leo', bg: 'interior_en_cafe.png', who: 'leo', lv: 2, area: 'center', kai: 'Vào quán cà phê của Leo nghỉ chân một chút.' },
    market: { name: 'Chợ nông sản', bg: 'interior_en_market.png', who: 'rosa', lv: 3, area: 'center', kai: 'Đi chợ nông sản với bà Rosa nào.' },
    hospital: { name: 'Bệnh viện Brightford', bg: 'interior_en_hospital.png', who: 'anna', lv: 4, area: 'center', kai: 'Ghé bệnh viện gặp bác sĩ Anna.' },
    street: { name: 'Hỏi đường ngoài phố', bg: 'map_street_en.png', who: 'dan', lv: 2, area: 'street', kai: 'Ra phố mua sắm. Ai hỏi đường thì giúp họ nhé.' },
    super: { name: 'Siêu thị', bg: 'interior_en_super.png', who: 'ray', lv: 2, area: 'street', kai: 'Vào siêu thị mua ít đồ dùng.' },
    pharmacy: { name: 'Hiệu thuốc', bg: 'interior_en_pharmacy.png', who: 'lee', lv: 3, area: 'street', kai: 'Qua hiệu thuốc của cô Lee.' },
    post: { name: 'Bưu điện', bg: 'interior_en_post.png', who: 'ivy', lv: 3, area: 'street', kai: 'Ra bưu điện gửi đồ về nhà.' },
    barber: { name: 'Tiệm tóc', bg: 'interior_en_barber.png', who: 'tony', lv: 3, area: 'street', kai: 'Ghé tiệm tóc của Tony.' },
    bank: { name: 'Ngân hàng', bg: 'interior_en_bank.png', who: 'grant', lv: 4, area: 'street', kai: 'Vào ngân hàng gặp ông Grant.' },
    gym: { name: 'Phòng gym', bg: 'interior_en_gym.png', who: 'max', lv: 4, area: 'street', kai: 'Tới phòng gym của thầy Max.' },
    school: { name: 'Trường Anh ngữ', bg: 'interior_en_hall.png', who: 'nora', lv: 3, area: 'school', kai: 'Tới Trường Anh ngữ Brightford rồi!' },
    meeting: { name: 'Họp, phỏng vấn, tranh luận', bg: 'interior_en_hall.png', who: 'emma', lv: 5, area: 'school', kai: 'Vào phòng họp của trường, mọi người đang bàn chuyện quan trọng.' }
  },
  areas: [
    { id: 'arrive', name: '✈️ Đến nơi' }, { id: 'maple', name: '🏡 Khu phố Maple' }, { id: 'center', name: '🏛 Trung tâm' },
    { id: 'street', name: '🛍 Phố mua sắm' }, { id: 'school', name: '🏫 Trường Anh ngữ' }
  ],

  nghe: [
    // Pre-A1: số, từ đơn, lời chào
    { lv: 1, pl: 'bus', who: 'joe', a: 'Seven.', q: 'Bạn nghe thấy số nào?', o: ['7', '11', '17', '70'] },
    { lv: 1, pl: 'market', a: 'Apple.', q: 'Bạn nghe thấy từ gì?', o: ['🍎 Quả táo', '🍌 Quả chuối', '🥚 Quả trứng', '🍊 Quả cam'] },
    { lv: 1, pl: 'home', a: 'Good morning!', q: 'Bác Ben nói gì?', o: ['Chào buổi sáng', 'Chúc ngủ ngon', 'Tạm biệt', 'Cảm ơn'] },
    { lv: 1, pl: 'airport', a: 'Gate nine.', q: 'Bạn ra cửa số mấy?', o: ['Cửa số 9', 'Cửa số 5', 'Cửa số 19', 'Cửa số 90'] },
    { lv: 1, pl: 'cafe', who: 'carlos', a: 'Two coffees, please.', q: 'Người này gọi gì?', o: ['Hai ly cà phê', 'Một ly cà phê', 'Hai ly trà', 'Hai cái bánh'] },
    { lv: 1, pl: 'bakery', a: 'Thank you very much!', q: 'Chị Mia nói gì?', o: ['Cảm ơn rất nhiều', 'Xin lỗi nhé', 'Rất vui được gặp', 'Hẹn gặp lại'] },
    { lv: 1, pl: 'bakery', a: 'Bread.', q: 'Bạn nghe thấy từ gì?', o: ['🍞 Bánh mì', '🥛 Sữa', '🧀 Phô mai', '🍚 Cơm'] },
    { lv: 1, pl: 'home', a: 'Goodbye! See you tomorrow.', q: 'Bác Ben nói gì?', o: ['Tạm biệt, mai gặp lại', 'Chào buổi sáng', 'Hôm nay gặp nhau nhé', 'Chúc ngủ ngon'] },
    { lv: 1, pl: 'super', a: 'Fifteen dollars.', q: 'Bao nhiêu tiền?', o: ['15 đô', '50 đô', '5 đô', '16 đô'] },
    { lv: 1, pl: 'school', who: 'emma', a: 'Sit down, please.', q: 'Cô giáo bảo bạn làm gì?', o: ['Ngồi xuống', 'Đứng lên', 'Mở cửa', 'Đi ra ngoài'] },
    // A1: câu ngắn về mua bán, chỉ đường, giờ giấc
    { lv: 2, pl: 'bakery', a: "It's twelve dollars.", q: 'Món này giá bao nhiêu?', o: ['12 đô', '20 đô', '2 đô', '22 đô'] },
    { lv: 2, pl: 'cafe', a: 'The bathroom is on the left.', q: 'Nhà vệ sinh ở đâu?', o: ['Bên trái', 'Bên phải', 'Trên lầu', 'Ở phía sau'] },
    { lv: 2, pl: 'cafe', who: 'mom', a: 'Can I have a glass of water, please?', q: 'Người này muốn gì?', o: ['Một ly nước', 'Một ly cà phê', 'Tính tiền', 'Một ly sữa'] },
    { lv: 2, pl: 'street', a: 'The bus stop is next to the bank.', q: 'Trạm xe buýt ở đâu?', o: ['Cạnh ngân hàng', 'Đối diện ngân hàng', 'Sau bưu điện', 'Trong siêu thị'] },
    { lv: 2, pl: 'bakery', a: 'We open at eight and close at six.', q: 'Xe bánh mở cửa giờ nào?', o: ['8 giờ sáng tới 6 giờ chiều', '6 giờ sáng tới 8 giờ tối', '8 giờ sáng tới 12 giờ trưa', 'Mở cả ngày'] },
    { lv: 2, pl: 'home', who: 'mom', a: 'My brother is a doctor. He works at the hospital.', q: 'Anh em của mẹ làm nghề gì?', o: ['Bác sĩ, làm ở bệnh viện', 'Giáo viên, dạy ở trường', 'Dược sĩ, làm ở hiệu thuốc', 'Tài xế xe buýt'] },
    { lv: 2, pl: 'school', a: 'Your classroom is on the third floor.', q: 'Lớp học của bạn ở đâu?', o: ['Tầng 3', 'Tầng 1', 'Tầng 13', 'Tầng 4'] },
    { lv: 2, pl: 'super', a: "I'm sorry, I don't have any change.", q: 'Ray nói gì?', o: ['Xin lỗi, không có tiền lẻ để thối', 'Xin lỗi, hết hàng rồi', 'Xin lỗi, cửa hàng đóng cửa', 'Xin lỗi, máy quẹt thẻ hỏng'] },
    { lv: 2, pl: 'cafe', a: 'Do you want milk in your coffee?', q: 'Leo hỏi gì?', o: ['Có cho sữa vào cà phê không', 'Có muốn uống cà phê không', 'Muốn ly to hay ly nhỏ', 'Uống ở đây hay mang đi'] },
    { lv: 2, pl: 'home', who: 'mom', a: "It's cold today. Take your jacket.", q: 'Mẹ dặn gì?', o: ['Trời lạnh, mang áo khoác', 'Trời nóng, mang nước', 'Trời mưa, mang ô', 'Đi sớm kẻo trễ'] },
    // A2: việc hằng ngày, giờ hẹn, thuốc, giá cả
    { lv: 3, pl: 'bus', a: 'The next bus to the airport leaves at a quarter past nine.', q: 'Chuyến xe buýt tiếp theo ra sân bay chạy lúc mấy giờ?', o: ['9 giờ 15', '9 giờ 45', '8 giờ 15', '9 giờ 50'] },
    { lv: 3, pl: 'school', who: 'pat', a: "Sorry, we're out of chicken today, but the fish is really good.", q: 'Cô căng tin nói gì?', o: ['Hết gà rồi, gợi ý món cá', 'Hết cá rồi, còn gà', 'Hôm nay căng tin đóng cửa', 'Món gà hôm nay giảm giá'] },
    { lv: 3, pl: 'hospital', who: 'phone', a: 'Your appointment is on Thursday at two. Please come ten minutes early.', q: 'Bạn cần làm gì?', o: ['Đến lúc 1 giờ 50 thứ Năm', 'Đến lúc 2 giờ thứ Ba', 'Gọi lại sau 10 phút', 'Đến lúc 2 giờ 10 thứ Năm'] },
    { lv: 3, pl: 'pharmacy', a: 'Take this medicine three times a day, after meals, for five days.', q: 'Uống thuốc thế nào?', o: ['Ngày 3 lần sau bữa ăn, trong 5 ngày', 'Ngày 5 lần trước bữa ăn', 'Ngày 3 lần, trong 3 ngày', 'Một lần trước khi ngủ'] },
    { lv: 3, pl: 'market', a: 'The strawberries are two dollars a box, or three boxes for five.', q: 'Giá dâu thế nào?', o: ['2 đô một hộp, 3 hộp 5 đô', '5 đô một hộp, 3 hộp 2 đô', '3 đô một hộp', '2 hộp 5 đô'] },
    { lv: 3, pl: 'post', a: "If you send it by express, it'll arrive tomorrow. Standard post takes three days.", q: 'Gửi nhanh thì khi nào tới?', o: ['Ngày mai', 'Sau 3 ngày', 'Hôm nay', 'Tuần sau'] },
    { lv: 3, pl: 'barber', who: 'ben', a: "Just a little shorter on the sides, but don't touch the top, okay?", q: 'Bác Ben muốn cắt tóc thế nào?', o: ['Cắt ngắn hai bên, giữ nguyên phần trên', 'Cắt ngắn hết', 'Chỉ cắt phần trên', 'Cắt ngắn phía sau'] },
    { lv: 3, pl: 'bus', who: 'carlos', a: 'Excuse me, does this bus go to the city center, or do I need to change?', q: 'Carlos hỏi gì?', o: ['Xe này có tới trung tâm không, hay phải đổi xe', 'Vé xe giá bao nhiêu', 'Xe tiếp theo mấy giờ tới', 'Trạm cuối ở đâu'] },
    { lv: 3, pl: 'bus', who: 'ben', a: "I'm calling because I left my umbrella on the bus this morning. It's a blue one.", q: 'Bác Ben gọi điện để làm gì?', o: ['Báo để quên chiếc ô xanh trên xe sáng nay', 'Hỏi giờ xe chạy', 'Hỏi mua một chiếc ô mới', 'Báo mất ví trên xe'] },
    { lv: 3, pl: 'school', who: 'owen', a: 'The library closes early on Fridays, so please return your books by four.', q: 'Thứ Sáu cần làm gì?', o: ['Trả sách trước 4 giờ', 'Đến thư viện sau 4 giờ', 'Mượn thêm sách', 'Thư viện đóng cửa cả ngày'] },
    // B1: thông báo, tin nhắn công việc, bác sĩ, ngân hàng
    { lv: 4, pl: 'bus', who: 'pa', a: "Attention, passengers. Because of a signal problem, trains to Central Station are delayed by about twenty minutes. We're sorry for the inconvenience.", q: 'Thông báo nói gì?', o: ['Tàu đi ga Trung tâm trễ khoảng 20 phút vì sự cố tín hiệu', 'Tàu bị huỷ, hành khách đi xe buýt thay', 'Ga Trung tâm đóng cửa 20 phút', 'Tàu chạy sớm hơn 20 phút'] },
    { lv: 4, pl: 'cafe', a: "I'd love to come to your party, but I've got a work deadline on Friday. Could we meet up on Sunday instead?", q: 'Leo muốn gì?', o: ['Không đi tiệc được, hẹn gặp vào Chủ nhật', 'Sẽ đến tiệc vào thứ Sáu', 'Muốn tổ chức tiệc ở chỗ làm', 'Muốn hoãn tiệc sang tuần sau'] },
    { lv: 4, pl: 'school', who: 'phone', a: "Hi, it's Sam from the IT team. Your laptop is ready, but you'll need to reset your password before you log in.", q: 'Sam nhắn gì?', o: ['Máy sửa xong, phải đặt lại mật khẩu trước khi đăng nhập', 'Máy hỏng, phải mua máy mới', 'Cứ dùng mật khẩu cũ để đăng nhập', 'Máy chưa sửa xong, mai quay lại'] },
    { lv: 4, pl: 'airport', who: 'pa', a: 'Due to heavy fog, all flights to Northport are delayed. Please check the screens for updates.', q: 'Thông báo nói gì?', o: ['Các chuyến bay đi Northport bị trễ vì sương mù, xem màn hình để cập nhật', 'Các chuyến bay đi Northport bị huỷ', 'Hành khách đi Northport đổi sang cửa khác', 'Sương mù đã tan, máy bay cất cánh đúng giờ'] },
    { lv: 4, pl: 'bank', a: "You'll need to bring two forms of ID, and the account usually takes about a week to open.", q: 'Mở tài khoản cần gì?', o: ['Mang 2 loại giấy tờ tuỳ thân, khoảng 1 tuần mới mở xong', 'Chỉ cần 1 giấy tờ, mở ngay trong ngày', 'Phải có 2 người bảo lãnh', 'Mở trên mạng, không cần giấy tờ'] },
    { lv: 4, pl: 'hospital', a: "It's probably just a sprain, but let's get an X-ray to make sure nothing's broken.", q: 'Bác sĩ nói gì?', o: ['Có lẽ chỉ bong gân, nhưng chụp X-quang cho chắc', 'Chắc chắn bị gãy xương', 'Không cần chụp, về nghỉ là khỏi', 'Phải mổ ngay'] },
    { lv: 4, pl: 'gym', a: "If you can't make it to your class, please cancel at least twelve hours in advance, or you'll lose the session.", q: 'Không đi tập được thì phải làm gì?', o: ['Báo huỷ trước ít nhất 12 giờ, không thì mất buổi', 'Báo huỷ trước 2 giờ là được', 'Không cần báo trước', 'Gọi lại sau 12 giờ'] },
    { lv: 4, pl: 'post', a: "Hi, it's Ivy from the post office. A parcel has arrived for you, but there's two dollars to pay before we can release it.", q: 'Ivy báo gì?', o: ['Có bưu kiện tới, trả 2 đô mới lấy được', 'Bưu kiện bị thất lạc', 'Bưu kiện được giao miễn phí tới nhà', 'Bưu điện đóng cửa 2 ngày'] },
    { lv: 4, pl: 'super', a: "We've run out of the size you wanted, but I can order it in for you. It should be here by Wednesday.", q: 'Ray đề nghị gì?', o: ['Đặt hàng cỡ đó, khoảng thứ Tư có', 'Lấy cỡ khác đi', 'Quay lại vào thứ Hai', 'Siêu thị không bán cỡ đó nữa'] },
    { lv: 4, pl: 'school', a: 'Morning, everyone. Just a reminder that the fire drill is at ten, so please leave your bags in the classroom.', q: 'Cô Nora nhắc gì?', o: ['10 giờ tập phòng cháy, để cặp lại trong lớp', '10 giờ cả lớp đi dã ngoại, mang cặp theo', 'Hôm nay nghỉ học lúc 10 giờ', 'Mang cặp ra sân lúc 10 giờ'] },
    // B2: ý ngầm, quan điểm, họp hành
    { lv: 5, pl: 'meeting', who: 'tom', a: 'Honestly, the new schedule looks great on paper, but in practice it means most of us will be stuck in rush-hour traffic twice a day.', q: 'Ý chính của người nói là gì?', o: ['Lịch mới nghe hay nhưng thực tế bất tiện vì kẹt xe giờ cao điểm', 'Lịch mới giúp mọi người tránh kẹt xe', 'Người nói rất hài lòng với lịch mới', 'Lịch mới chỉ hợp với người đi làm sớm'] },
    { lv: 5, pl: 'meeting', a: "We're not saying the project should be cancelled. We're just suggesting we hold off on the launch until the feedback from the test group comes in.", q: 'Họ đề xuất gì?', o: ['Hoãn ra mắt, chờ phản hồi của nhóm dùng thử', 'Huỷ dự án', 'Ra mắt ngay, không cần chờ phản hồi', 'Thay nhóm dùng thử khác'] },
    { lv: 5, pl: 'airport', who: 'carlos', a: "I wouldn't say the hotel was bad, exactly. It's just that for the price, you'd expect a lot more.", q: 'Carlos thấy khách sạn thế nào?', o: ['Không tệ, nhưng không xứng với số tiền bỏ ra', 'Rất tệ, không bao giờ quay lại', 'Rẻ mà rất tốt', 'Đắt nhưng rất xứng đáng'] },
    { lv: 5, pl: 'airport', who: 'carlos', a: "To be fair, the delay wasn't entirely their fault, but they could have kept us better informed.", q: 'Carlos nghĩ gì về việc trễ chuyến?', o: ['Không hoàn toàn do họ, nhưng lẽ ra phải báo tin rõ hơn', 'Hoàn toàn do lỗi của họ', 'Họ đã thông báo rất đầy đủ', 'Việc trễ chuyến không làm ai khó chịu'] },
    { lv: 5, pl: 'cafe', a: "I see where you're coming from, but if we raise prices now, we risk losing our regular customers.", q: 'Leo muốn nói gì?', o: ['Hiểu ý bạn, nhưng tăng giá lúc này dễ mất khách quen', 'Đồng ý tăng giá ngay', 'Muốn giảm giá để có khách mới', 'Khách quen không quan tâm tới giá'] },
    { lv: 5, pl: 'hospital', a: "The results look promising, though it's too early to say whether the treatment works for everyone.", q: 'Bác sĩ đánh giá kết quả thế nào?', o: ['Có triển vọng, nhưng còn quá sớm để nói có hiệu quả với mọi người', 'Thuốc chắc chắn hiệu quả với tất cả', 'Kết quả xấu, nên ngừng điều trị', 'Đã chứng minh xong, có thể dùng rộng rãi'] },
    { lv: 5, pl: 'bus', who: 'ben', a: "Had I known the road would be closed, I'd have taken the train instead.", q: 'Bác Ben muốn nói gì?', o: ['Không biết đường bị chặn nên đã không đi tàu, giờ thấy tiếc', 'Đã đi tàu vì biết trước đường bị chặn', 'Đường hôm nay không bị chặn', 'Thích đi xe buýt hơn đi tàu'] },
    { lv: 5, pl: 'meeting', a: 'Rather than hiring more staff, we might get better results by simplifying the process.', q: 'Cô Emma đề xuất gì?', o: ['Đơn giản hoá quy trình thay vì tuyển thêm người', 'Tuyển thêm nhiều người', 'Giữ nguyên mọi thứ như cũ', 'Cho bớt nhân viên nghỉ việc'] },
    { lv: 5, pl: 'bank', who: 'carlos', a: "It's not that I don't trust the bank. I'd just rather keep some savings somewhere I can reach quickly.", q: 'Carlos muốn gì?', o: ['Giữ một phần tiền ở chỗ lấy ra nhanh được, không phải vì không tin ngân hàng', 'Rút hết tiền vì không tin ngân hàng', 'Gửi tất cả tiền vào ngân hàng', 'Vay thêm tiền'] },
    { lv: 5, pl: 'street', a: "Given how much the city has grown, it's surprising the bus network has barely changed in twenty years.", q: 'Ý chính là gì?', o: ['Thành phố lớn lên nhiều mà mạng xe buýt gần như không đổi suốt 20 năm, thật lạ', 'Mạng xe buýt mở rộng rất nhanh', 'Thành phố 20 năm nay không thay đổi', 'Xe buýt sẽ ngừng chạy sau 20 năm'] }
  ],

  doc: [
    // Pre-A1: biển báo, giá tiền, chữ rất ngắn
    { lv: 1, pl: 'airport', t: 'EXIT', q: 'Biển này nghĩa là gì?', o: ['Lối ra', 'Lối vào', 'Cấm vào', 'Nhà vệ sinh'] },
    { lv: 1, pl: 'bakery', t: 'OPEN', q: 'Biển này treo ở xe bánh. Nghĩa là gì?', o: ['Đang mở cửa', 'Đã đóng cửa', 'Đang giảm giá', 'Hết hàng'] },
    { lv: 1, pl: 'cafe', t: 'Coffee  $3', q: 'Cà phê giá bao nhiêu?', o: ['3 đô', '13 đô', '30 đô', '8 đô'] },
    { lv: 1, pl: 'airport', t: 'TOILETS →', q: 'Nhà vệ sinh ở hướng nào?', o: ['Bên phải', 'Bên trái', 'Phía trước', 'Trên lầu'] },
    { lv: 1, pl: 'street', t: 'BUS STOP', q: 'Biển này chỉ gì?', o: ['Trạm xe buýt', 'Bãi đỗ xe', 'Ga tàu', 'Cửa hàng'] },
    { lv: 1, pl: 'super', t: 'MILK  $2', q: 'Sữa giá bao nhiêu?', o: ['2 đô', '12 đô', '20 đô', '7 đô'] },
    { lv: 1, pl: 'post', t: 'PUSH', q: 'Cửa có chữ này. Bạn làm gì?', o: ['Đẩy cửa', 'Kéo cửa', 'Gõ cửa', 'Bấm chuông'] },
    { lv: 1, pl: 'hospital', t: 'NO SMOKING', q: 'Biển này nghĩa là gì?', o: ['Cấm hút thuốc', 'Cấm ăn uống', 'Cấm chụp ảnh', 'Cấm đỗ xe'] },
    { lv: 1, pl: 'school', t: 'Room 3', q: 'Đây là phòng số mấy?', o: ['Phòng 3', 'Phòng 13', 'Phòng 30', 'Phòng 8'] },
    { lv: 1, pl: 'home', t: 'Happy birthday, Mom!', q: 'Đây là lời chúc gì?', o: ['Chúc mừng sinh nhật mẹ', 'Chúc mẹ ngủ ngon', 'Cảm ơn mẹ', 'Chúc mừng năm mới'] },
    // A1: thông báo ngắn, tin nhắn đơn giản
    { lv: 2, pl: 'bakery', t: 'CLOSED ON SUNDAYS', q: 'Xe bánh nghỉ bán khi nào?', o: ['Chủ nhật', 'Thứ Bảy', 'Mỗi tối', 'Ngày lễ'] },
    { lv: 2, pl: 'home', t: "Mom: I'm at the supermarket. Do you want anything?", q: 'Mẹ nhắn hỏi gì?', o: ['Con có muốn mua gì không', 'Con đang ở đâu', 'Con ăn cơm chưa', 'Mấy giờ con về'] },
    { lv: 2, pl: 'street', t: 'Please do not touch.', q: 'Tấm biển trong bảo tàng nói gì?', o: ['Vui lòng không chạm vào', 'Mời bạn sờ thử', 'Vui lòng xếp hàng', 'Mời chụp ảnh'] },
    { lv: 2, pl: 'school', t: 'Today: Chicken soup $4. Salad $3.', q: 'Ở căng tin, món nào rẻ hơn?', o: ['Món salad', 'Món súp gà', 'Hai món bằng giá', 'Không ghi giá'] },
    { lv: 2, pl: 'cafe', t: 'Leo: The café is very busy. Can you come at 3 pm, not 2?', q: 'Leo muốn gì?', o: ['Bạn đến lúc 3 giờ thay vì 2 giờ', 'Bạn đến sớm lúc 2 giờ', 'Quán đóng cửa hôm nay', 'Bạn mua cà phê mang về'] },
    { lv: 2, pl: 'bus', t: 'Platform 2 → Trains to Central Station', q: 'Muốn đi ga Trung tâm thì ra đâu?', o: ['Sân ga số 2', 'Sân ga số 1', 'Cửa số 2', 'Trạm xe buýt'] },
    { lv: 2, pl: 'market', t: 'Apples: 3 for $1', q: 'Một đô mua được mấy quả táo?', o: ['3 quả', '1 quả', '13 quả', '2 quả'] },
    { lv: 2, pl: 'barber', t: 'Haircut – Men $15, Kids $10', q: 'Cắt tóc cho trẻ em giá bao nhiêu?', o: ['10 đô', '15 đô', '25 đô', '5 đô'] },
    { lv: 2, pl: 'home', t: 'Lost cat! Small, black and white. Please call Ben: 555-0142.', q: 'Bác Ben đang tìm gì?', o: ['Con mèo nhỏ màu đen trắng', 'Con chó nhỏ màu đen', 'Chiếc điện thoại', 'Chùm chìa khoá'] },
    { lv: 2, pl: 'gym', t: 'Gym hours: Mon–Fri 6 am – 10 pm', q: 'Phòng gym mở cửa khi nào?', o: ['Thứ Hai tới thứ Sáu, 6 giờ sáng tới 10 giờ tối', 'Mỗi ngày từ 10 giờ sáng', 'Chỉ cuối tuần', 'Thứ Hai tới thứ Sáu, 10 giờ sáng tới 6 giờ chiều'] },
    // A2: tin nhắn, hướng dẫn, quy định đơn giản
    { lv: 3, pl: 'school', t: 'Hi Linh, the meeting is moved from 2 pm to 4 pm. Same room. – Tom', q: 'Điều gì thay đổi?', o: ['Giờ họp', 'Phòng họp', 'Người họp', 'Ngày họp'] },
    { lv: 3, pl: 'pharmacy', t: 'Take 1 tablet twice a day after meals. Do not take more than 4 in 24 hours.', q: 'Uống thuốc thế nào cho đúng?', o: ['1 viên, ngày 2 lần, sau khi ăn', '2 viên mỗi bữa ăn', '4 viên một lần', '1 viên trước khi ngủ'] },
    { lv: 3, pl: 'super', t: 'Free delivery on orders over $50. Delivery takes 3–5 working days.', q: 'Bạn đặt đơn 40 đô. Điều nào đúng?', o: ['Phải trả phí giao hàng', 'Được giao miễn phí', 'Giao trong 1 ngày', 'Không được giao hàng'] },
    { lv: 3, pl: 'airport', t: 'Flight BR204 to Northport – Gate 12 – Boarding 10:40 – DELAYED', q: 'Điều nào đúng?', o: ['Chuyến bay bị trễ, lên máy bay ở cửa 12', 'Chuyến bay bị huỷ', 'Lên máy bay ở cửa 4 lúc 10 giờ 40', 'Chuyến bay cất cánh sớm'] },
    { lv: 3, pl: 'home', t: "Grandma's birthday dinner is on Saturday at 7. Please bring a cake. – Mom", q: 'Bạn cần làm gì?', o: ['Mang bánh tới bữa tối thứ Bảy lúc 7 giờ', 'Nấu bữa tối thứ Bảy', 'Mua quà cho mẹ', 'Đón bà lúc 7 giờ sáng'] },
    { lv: 3, pl: 'post', t: 'Parcels over 2 kg: please use counter 3.', q: 'Bưu kiện của bạn nặng 5 kg. Bạn ra đâu?', o: ['Quầy số 3', 'Quầy số 2', 'Quầy số 5', 'Quầy nào cũng được'] },
    { lv: 3, pl: 'school', t: 'Class cancelled today. Ms. Emma is sick. Please study Unit 4 at home.', q: 'Hôm nay học sinh làm gì?', o: ['Nghỉ học, tự học bài 4 ở nhà', 'Học bài 4 với cô Emma', 'Đến lớp sớm hơn', 'Đi thăm cô Emma'] },
    { lv: 3, pl: 'bakery', t: 'Buy one, get one free on all bread after 5 pm.', q: 'Sau 5 giờ chiều, mua 1 ổ bánh mì thì sao?', o: ['Được tặng thêm 1 ổ', 'Được giảm nửa giá', 'Phải mua 2 ổ', 'Không bán bánh mì nữa'] },
    { lv: 3, pl: 'hospital', t: 'Visiting hours: 2 pm – 5 pm. Children under 12 must be with an adult.', q: 'Điều nào đúng?', o: ['Trẻ dưới 12 tuổi phải đi cùng người lớn', 'Trẻ em không được vào thăm', 'Giờ thăm bắt đầu từ 5 giờ chiều', 'Người lớn phải đi cùng trẻ em'] },
    { lv: 3, pl: 'bus', t: 'Bus 7 does not stop at Maple Street this week because of road works. Please use the stop on Oak Road.', q: 'Tuần này đón xe số 7 ở đâu?', o: ['Trạm ở đường Oak', 'Trạm ở phố Maple', 'Tuần này không có xe số 7', 'Trạm trước ngân hàng'] },
    // B1: email, thông báo, quy định dài hơn
    { lv: 4, pl: 'gym', t: 'Because of maintenance, the gym will close at 6 pm on Friday. Members can use the pool as usual until 9 pm.', q: 'Thứ Sáu lúc 7 giờ tối bạn làm được gì?', o: ['Đi bơi', 'Tập ở phòng gym', 'Không làm gì được vì đóng cửa hết', 'Tập gym tới 9 giờ'] },
    { lv: 4, pl: 'post', t: 'Dear customer, we could not deliver your parcel today. You can collect it from the post office after 10 am tomorrow, or rebook delivery online.', q: 'Bạn có thể làm gì?', o: ['Lấy ở bưu điện sau 10 giờ sáng mai, hoặc đặt giao lại trên mạng', 'Chờ người giao hàng quay lại tối nay', 'Gọi bưu điện trước 10 giờ sáng nay', 'Bưu kiện tự giao lại tối mai'] },
    { lv: 4, pl: 'cafe', t: 'Part-time barista wanted. Weekends only. No experience needed – full training provided.', q: 'Điều nào đúng với tin tuyển dụng này?', o: ['Không cần kinh nghiệm, có đào tạo', 'Phải có kinh nghiệm pha chế', 'Làm cả tuần', 'Làm buổi tối các ngày trong tuần'] },
    { lv: 4, pl: 'bank', t: 'Your card will expire next month. A new card has been sent to your home address. Please activate it before using it.', q: 'Bạn cần làm gì?', o: ['Kích hoạt thẻ mới gửi về nhà rồi mới dùng', 'Ra ngân hàng lấy thẻ mới', 'Dùng thẻ cũ thêm một năm', 'Huỷ thẻ cũ ngay hôm nay'] },
    { lv: 4, pl: 'hospital', t: 'Patients should not eat or drink anything for eight hours before the blood test. Water is allowed.', q: 'Trước khi xét nghiệm máu, điều nào đúng?', o: ['Được uống nước, không ăn gì trong 8 giờ', 'Không được uống cả nước', 'Được ăn nhẹ trước 8 giờ', 'Chỉ cần nhịn 2 giờ'] },
    { lv: 4, pl: 'cafe', t: 'Hi! Running 15 min late – the train stopped outside the station. Order for me if you get there first. – Leo', q: 'Leo nhắn gì?', o: ['Leo trễ 15 phút vì tàu dừng, ai tới trước thì gọi món giúp', 'Leo huỷ hẹn', 'Leo đã tới và gọi món rồi', 'Leo muốn đổi sang gặp ở nhà ga'] },
    { lv: 4, pl: 'school', t: 'Library books can be renewed online up to twice, unless another student has reserved them.', q: 'Khi nào không gia hạn được sách?', o: ['Khi đã có bạn khác đặt trước cuốn đó', 'Khi gia hạn lần đầu', 'Khi gia hạn trên mạng', 'Sách không bao giờ được gia hạn'] },
    { lv: 4, pl: 'super', t: 'Refunds are only possible with a receipt and within 30 days. Sale items cannot be returned.', q: 'Bạn mua áo giảm giá tuần trước. Trả lại được không?', o: ['Không, hàng giảm giá không được trả', 'Được, nếu còn hoá đơn', 'Được, vì còn trong 30 ngày', 'Được đổi sang món khác'] },
    { lv: 4, pl: 'school', t: 'Due to the storm warning, all outdoor classes are moved indoors and the school bus will leave one hour early.', q: 'Hôm nay có gì thay đổi?', o: ['Học trong nhà, xe đưa đón về sớm 1 tiếng', 'Nghỉ học cả ngày', 'Xe đưa đón về trễ 1 tiếng', 'Học ngoài trời như thường'] },
    { lv: 4, pl: 'airport', t: 'Passengers flying to the US must check in at least 3 hours before departure. Online check-in closes 24 hours in advance.', q: 'Điều nào đúng?', o: ['Làm thủ tục trên mạng đóng trước giờ bay 24 tiếng', 'Làm thủ tục trên mạng được tới sát giờ bay', 'Chỉ cần có mặt trước 1 tiếng', 'Không cần làm thủ tục'] },
    // B2: lập luận, quan điểm, ý ngầm
    { lv: 5, pl: 'cafe', t: 'While the new policy aims to cut costs, critics argue it may hurt customer satisfaction, which could cancel out any savings.', q: 'Tờ báo trong quán viết: người phản đối cho rằng gì?', o: ['Chính sách có thể làm khách không hài lòng, mất luôn phần tiết kiệm', 'Chính sách giúp khách hài lòng hơn', 'Chính sách không tiết kiệm được đồng nào', 'Chính sách đã bị huỷ'] },
    { lv: 5, pl: 'bank', t: 'Applicants who meet the minimum requirements are not guaranteed an interview; priority will be given to those with relevant experience.', q: 'Ý nào đúng?', o: ['Đủ điều kiện tối thiểu chưa chắc được phỏng vấn', 'Ai đủ điều kiện cũng được phỏng vấn', 'Không cần kinh nghiệm vẫn được ưu tiên', 'Phỏng vấn tất cả mọi người'] },
    { lv: 5, pl: 'street', t: "The museum's new wing, though impressive, has been criticised for putting style ahead of accessibility.", q: 'Khu mới của bảo tàng bị chê vì sao?', o: ['Đẹp nhưng khó tiếp cận, khó sử dụng với nhiều người', 'Quá nhỏ', 'Thiếu tác phẩm trưng bày', 'Giá vé quá đắt'] },
    { lv: 5, pl: 'meeting', t: 'Although fees have risen for the third year in a row, enrolment has remained stable, suggesting that demand is relatively insensitive to price.', q: 'Đoạn này cho thấy gì?', o: ['Học phí tăng mà số người học vẫn giữ nguyên, tức nhu cầu ít phụ thuộc vào giá', 'Số người học giảm mạnh vì học phí tăng', 'Học phí đã giảm 3 năm liền', 'Người học rất nhạy cảm với giá'] },
    { lv: 5, pl: 'street', t: 'Commuters have welcomed the new cycle lanes, though some shop owners claim the loss of parking has driven customers away.', q: 'Ai không hài lòng và vì sao?', o: ['Chủ cửa hàng, vì mất chỗ đỗ xe làm khách ít đi', 'Người đi làm, vì làn xe đạp quá hẹp', 'Người đạp xe, vì làn đường nguy hiểm', 'Không ai phản đối'] },
    { lv: 5, pl: 'hospital', t: 'The clinic will no longer accept walk-in patients; appointments must be booked online, except in emergencies.', q: 'Từ nay điều nào đúng?', o: ['Phải đặt lịch trên mạng, trừ trường hợp cấp cứu', 'Ai đến trực tiếp cũng được khám ngay', 'Cấp cứu cũng phải đặt lịch trước', 'Phòng khám đóng cửa hẳn'] },
    { lv: 5, pl: 'cafe', t: 'Contrary to popular belief, the study found that people who skip breakfast do not necessarily eat more later in the day.', q: 'Nghiên cứu cho thấy gì?', o: ['Bỏ bữa sáng chưa chắc làm ăn nhiều hơn về sau', 'Bỏ bữa sáng luôn làm ăn nhiều hơn', 'Ai cũng nên bỏ bữa sáng', 'Ăn sáng làm tăng cân'] },
    { lv: 5, pl: 'bank', t: 'The monthly fee will be waived for customers who maintain a minimum balance of $1,000 throughout the month.', q: 'Khi nào không mất phí hằng tháng?', o: ['Khi số dư luôn từ 1.000 đô trở lên suốt tháng', 'Khi gửi 1.000 đô một lần bất kỳ', 'Khi rút dưới 1.000 đô', 'Phí luôn được miễn cho mọi người'] },
    { lv: 5, pl: 'meeting', t: 'While the team acknowledged the deadline was tight, they insisted that cutting corners on safety was out of the question.', q: 'Nhóm khẳng định điều gì?', o: ['Dù gấp, không được làm ẩu phần an toàn', 'Phải làm nhanh, bỏ qua bước an toàn', 'Hạn chót rất thoải mái', 'Họ sẽ xin lùi hạn chót'] },
    { lv: 5, pl: 'airport', t: 'Passengers are reminded that unattended baggage may be removed and destroyed without prior warning.', q: 'Thông báo cảnh báo gì?', o: ['Hành lý bỏ không người trông có thể bị mang đi huỷ mà không báo trước', 'Hành lý được giữ miễn phí', 'Hành khách phải mang hành lý ra cửa', 'Hành lý thất lạc sẽ được gửi về nhà'] }
  ],

  gt: [
    // Pre-A1
    { lv: 1, pl: 'airport', p: 'Hello!', o: ['Hello!', 'Goodbye!', 'Thank you!', 'Sorry!'] },
    { lv: 1, pl: 'school', who: 'tom', p: "What's your name?", o: ['My name is Linh.', "I'm fine.", 'Yes, I am.', 'Nice day.'] },
    { lv: 1, pl: 'school', p: 'How old are you?', o: ["I'm twenty.", "I'm from Vietnam.", "I'm happy.", "I'm at school."] },
    { lv: 1, pl: 'home', p: 'Nice to meet you!', o: ['Nice to meet you, too.', 'Yes, please.', 'See you yesterday.', 'I am meet.'] },
    { lv: 1, pl: 'bakery', p: 'Thank you!', o: ["You're welcome.", 'Yes, it is.', 'Good night.', 'I am Linh.'] },
    { lv: 1, pl: 'cafe', p: 'Coffee or tea?', o: ['Tea, please.', 'Yes, please.', 'I am fine.', 'Goodbye.'] },
    { lv: 1, pl: 'home', who: 'mom', p: 'Good night!', o: ['Good night!', 'Good morning!', 'Nice to meet you.', 'How are you?'] },
    { lv: 1, pl: 'school', p: 'Are you a student?', o: ['Yes, I am.', 'Yes, I do.', "I'm fine.", "It's a student."] },
    { lv: 1, pl: 'bakery', p: "Here's your bread.", o: ['Thank you!', 'Hello!', 'Good night!', "I'm bread."] },
    { lv: 1, pl: 'airport', p: 'Is this your bag?', o: ['Yes, it is.', 'Yes, I am.', "It's a bag.", 'No, I am not.'] },
    // A1
    { lv: 2, pl: 'home', p: 'How are you?', o: ["I'm fine, thanks.", "I'm a student.", "It's Monday.", 'Yes, I am.'] },
    { lv: 2, pl: 'airport', p: 'Where are you from?', o: ["I'm from Vietnam.", "I'm at home.", 'From nine to five.', "I'm twenty."] },
    { lv: 2, pl: 'super', p: 'Can I help you?', o: ["Yes, I'm looking for a jacket.", "No, I can't.", 'Yes, you are.', 'I can help.'] },
    { lv: 2, pl: 'street', p: 'What time is it?', o: ["It's half past two.", "It's Tuesday.", "It's two years.", 'Yes, it is.'] },
    { lv: 2, pl: 'super', p: 'Would you like a bag?', o: ["No, thanks. I've got one.", 'Yes, I would like.', "No, I don't bag.", "It's a bag."] },
    { lv: 2, pl: 'market', p: 'How many apples do you want?', o: ['Five, please.', 'Yes, I want.', 'They are red.', 'Every day.'] },
    { lv: 2, pl: 'bus', who: 'ben', p: 'Is this seat free?', o: ['Yes, sure. Go ahead.', "Yes, it's ten dollars.", "No, I'm free.", 'Thank you, I sit.'] },
    { lv: 2, pl: 'cafe', p: 'What do you do?', o: ["I'm a nurse.", "I'm doing fine.", 'I do it.', "I'm from Hanoi."] },
    { lv: 2, pl: 'post', p: 'Can you spell your name?', o: ['Sure. L-I-N-H.', 'I can spell.', 'My name is good.', 'It is Linh spell.'] },
    { lv: 2, pl: 'school', who: 'jake', p: "Let's have lunch together!", o: ['Good idea!', 'Yes, I have.', 'I had lunch tomorrow.', 'No, together.'] },
    // A2
    { lv: 3, pl: 'bakery', p: 'Would you like something to drink?', o: ['Yes, a cup of tea, please.', 'Yes, I would like.', 'I drink it yesterday.', 'No, I am drink.'] },
    { lv: 3, pl: 'school', who: 'jake', p: 'What did you do last weekend?', o: ['I went to the beach with my friends.', 'I go to the beach every day.', "I'm going to the beach.", 'I will go to the beach.'] },
    { lv: 3, pl: 'cafe', who: 'ivy', p: "Sorry I'm late!", o: ['No worries, we just started.', "You're welcome.", "Yes, I'm late too.", 'Late is good.'] },
    { lv: 3, pl: 'home', who: 'mom', p: 'How was your trip?', o: ['It was great, thanks!', 'It is a trip.', 'I go next week.', 'Yes, I was.'] },
    { lv: 3, pl: 'home', p: 'Could you help me carry this box?', o: ['Of course. Where does it go?', 'Yes, I could carry.', 'It is a heavy.', 'No, I help.'] },
    { lv: 3, pl: 'super', p: 'Cash or card?', o: ['Card, please.', 'Yes, cash.', 'I have a card yesterday.', 'It is a card.'] },
    { lv: 3, pl: 'hospital', p: 'What seems to be the problem?', o: ['I have a bad headache.', 'I seem fine problem.', 'The problem is the doctor.', 'Yes, it seems.'] },
    { lv: 3, pl: 'home', p: 'How long have you lived here?', o: ['For about two years.', 'Since two years.', 'Two years ago.', 'I live here.'] },
    { lv: 3, pl: 'street', who: 'carlos', p: 'Do you know where the post office is?', o: ["Yes, it's next to the bank.", 'Yes, I know it.', 'The post office is old.', "No, it isn't."] },
    { lv: 3, pl: 'cafe', p: 'Shall we meet at six?', o: ['Six is fine. See you then!', 'Yes, we shall.', 'I meet at six yesterday.', "No, it's six."] },
    // B1
    { lv: 4, pl: 'airport', who: 'carlos', p: 'Have you ever been to Japan?', o: ["No, but I'd love to go one day.", "No, I didn't go yesterday.", 'Yes, I go there every day.', "Yes, I've been there tomorrow."] },
    { lv: 4, pl: 'bus', who: 'ivy', p: 'Do you mind if I open the window?', o: ['Not at all. Go ahead.', 'Yes, please open it.', 'No, I mind.', "Sure, I don't open."] },
    { lv: 4, pl: 'street', who: 'carlos', p: 'Could you tell me how to get to the station?', o: ['Sure. Go straight and turn left at the lights.', 'Yes, I could.', 'The station is very old.', 'Station is at the left.'] },
    { lv: 4, pl: 'cafe', p: "I'm afraid we're fully booked tonight.", o: ["Oh, that's a shame. What about tomorrow?", "Great, I'll book it.", "I'm afraid too.", "Yes, it's full of books."] },
    { lv: 4, pl: 'bank', p: 'Would you mind waiting a few minutes?', o: ["No problem, I'm not in a hurry.", 'Yes, I would wait.', 'No, I mind it.', 'I waited a few minutes ago.'] },
    { lv: 4, pl: 'hospital', p: 'Have you been taking anything for the pain?', o: ['Just some paracetamol last night.', 'Yes, I took the bus.', "I'm painful.", 'No, I have been.'] },
    { lv: 4, pl: 'bus', who: 'ben', p: 'What would you do if you missed the last bus?', o: ["I'd probably call a taxi.", 'I will missed it.', 'I do the last bus.', 'Yes, I would.'] },
    { lv: 4, pl: 'cafe', p: "Sorry, could you say that again? It's a bit noisy.", o: ["Sure. I said I'd like a latte.", 'Yes, it is noisy.', 'Again, again.', "No, I can't say."] },
    { lv: 4, pl: 'barber', p: "We're short-staffed today, so there might be a wait.", o: ["That's fine. Roughly how long?", "Yes, I'm short.", 'Wait is good.', 'No staff, no problem.'] },
    { lv: 4, pl: 'bus', who: 'carlos', p: "I've lost my ticket. What should I do?", o: ["Don't worry. Let's ask the driver.", 'You should lost it.', 'Yes, I lost it too.', 'The ticket is cheap.'] },
    // B2
    { lv: 5, pl: 'cafe', who: 'ivy', p: "I'm thinking of quitting my job to start my own business.", o: ["That's a big step. Have you thought it through?", 'Yes, business is very big.', "Sure, I'll quit my job for you.", 'Quitting is a business.'] },
    { lv: 5, pl: 'meeting', who: 'tom', p: 'We need to cut the budget by twenty percent this quarter.', o: ["That'll be tough, but let's see where we can save.", "Great, let's spend more on ads.", 'The budget is twenty.', 'Twenty percent is a quarter.'] },
    { lv: 5, pl: 'airport', p: "I'm afraid there's been a mix-up with your booking.", o: ['Oh no. What exactly happened?', "I'm afraid of it too.", 'Thanks for the booking.', 'Mix it up, please.'] },
    { lv: 5, pl: 'school', p: "Don't you think the new rules are a bit too strict?", o: ['Maybe, but I can see why they were introduced.', "Yes, I don't think.", 'The rules are new.', 'No, they think.'] },
    { lv: 5, pl: 'meeting', who: 'tom', p: "To be honest, I'm not sure this plan will work.", o: ['What makes you say that?', 'Me neither, it works.', 'Honest is good.', 'Sure, it will be a plan.'] },
    { lv: 5, pl: 'meeting', p: 'Would it be possible to push the meeting back to Thursday?', o: ["That should be fine. I'll update the calendar.", 'Yes, push it hard.', 'The meeting is back.', 'Thursday is a possible day.'] },
    { lv: 5, pl: 'home', p: "I can't believe they've raised the rent again!", o: ["I know, it's getting ridiculous.", 'Yes, I believe it.', 'The rent is raised by me.', 'Congratulations!'] },
    { lv: 5, pl: 'super', who: 'carlos', p: "If I were you, I'd ask for a refund.", o: ["You're right. I'll talk to the manager.", "I'm not you.", 'Yes, I were.', 'A refund is a shop.'] },
    { lv: 5, pl: 'meeting', who: 'tom', p: "There's no rush, but could you send me the report by Friday?", o: ["Sure, I'll have it to you by Thursday.", 'No rush, no report.', 'Friday is a report.', 'Yes, I rushed.'] },
    { lv: 5, pl: 'cafe', p: "I hope I didn't offend you earlier.", o: ["Not at all. Don't worry about it.", 'Yes, I hope too.', 'You offended me earlier, thanks.', "I didn't earlier."] }
  ],

  // phần nói: đọc to (read, cần đạt pass điểm) hoặc tự trả lời câu người kia hỏi (ask: cần nói ít nhất min từ, có một trong các từ any nếu có)
  noi: [
    { lv: 1, pl: 'airport', read: 'Hello. My name is Linh.', pass: 60 },
    { lv: 1, pl: 'home', read: 'Good morning. How are you?', pass: 60 },
    { lv: 1, pl: 'bakery', read: 'Thank you very much.', pass: 60 },
    { lv: 2, pl: 'cafe', read: "I'd like a coffee, please.", pass: 65 },
    { lv: 2, pl: 'street', read: 'Where is the bus stop, please?', pass: 65 },
    { lv: 2, pl: 'super', read: 'How much is this bag?', pass: 65 },
    { lv: 3, pl: 'bus', read: 'I usually take the bus to school at seven thirty.', pass: 70 },
    { lv: 3, pl: 'pharmacy', read: 'Could I have some medicine for a headache?', pass: 70 },
    { lv: 3, pl: 'post', read: 'I would like to send this letter to Vietnam.', pass: 70 },
    { lv: 4, pl: 'school', ask: 'Why are you learning English?', vi: 'Vì sao bạn học tiếng Anh? Trả lời 1–2 câu.', min: 8, any: ['because', 'to', 'for', 'so', 'want', 'need'] },
    { lv: 4, pl: 'cafe', ask: 'What did you do last weekend?', vi: 'Cuối tuần trước bạn làm gì? Trả lời 1–2 câu.', min: 8, any: ['went', 'was', 'were', 'had', 'visited', 'watched', 'played', 'stayed', 'did', 'ate', 'saw', 'met', 'cooked', 'read'] },
    { lv: 4, pl: 'home', ask: 'Can you tell me a little about your neighbourhood?', vi: 'Kể một chút về khu bạn ở. Nói 1–2 câu.', min: 8, any: ['there', 'is', 'are', 'near', 'quiet', 'busy', 'live', 'has', 'have'] },
    { lv: 5, pl: 'meeting', ask: 'What are the pros and cons of working from home?', vi: 'Làm việc ở nhà có lợi và hại gì? Nói 2–3 câu.', min: 16, any: ['but', 'however', 'although', 'though', 'while', 'on the other hand'] },
    { lv: 5, pl: 'meeting', who: 'tom', ask: 'Do you think people should work fewer days a week? Why?', vi: 'Có nên làm việc ít ngày hơn mỗi tuần không? Vì sao? Nói 2–3 câu.', min: 16, any: ['because', 'but', 'however', 'although', 'if', 'since', 'so', 'on the other hand'] },
    { lv: 5, pl: 'school', ask: 'How has technology changed the way people learn?', vi: 'Công nghệ đã thay đổi cách mọi người học thế nào? Nói 2–3 câu.', min: 16, any: ['because', 'but', 'however', 'for example', 'such as', 'although', 'now', 'used to', 'instead'] }
  ]
};
