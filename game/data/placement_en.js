/* Bài kiểm tra đầu vào tiếng Anh: 4 phần thực tế theo khung CEFR, đi từ dễ tới khó, tự dừng khi tới mức người học chưa làm được.
   Cấp: 1 Pre-A1 · 2 A1 · 3 A2 · 4 B1 · 5 B2 (0 = mới bắt đầu, chưa đạt Pre-A1).
   Mỗi cấp 3 câu: đúng 2 câu đầu thì lên cấp, sai cả 2 thì dừng, đúng 1 thì làm câu thứ 3 để quyết định.
   Đáp án đúng luôn đặt đầu mảng o (k = 0), lúc hiện sẽ tráo thứ tự. */
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
    { id: 'nghe', icon: '👂', name: 'Nghe', what: 'Nghe câu nói ngoài đời rồi chọn ý đúng. Nghe được 2 lần, có nút nghe chậm.' },
    { id: 'doc', icon: '📖', name: 'Đọc', what: 'Đọc biển báo, tin nhắn, thông báo rồi chọn ý đúng.' },
    { id: 'gt', icon: '💬', name: 'Phản xạ giao tiếp', what: 'Người ta nói một câu, bạn chọn câu đáp tự nhiên nhất.' },
    { id: 'noi', icon: '🗣️', name: 'Nói', what: 'Đọc to câu mẫu rồi tự trả lời câu hỏi. Cần micro; không có thì bỏ qua phần này.' }
  ],
  nghe: [
    { lv: 1, a: 'Seven.', q: 'Bạn nghe thấy số nào?', o: ['7', '11', '17'] },
    { lv: 1, a: 'Apple.', q: 'Bạn nghe thấy từ gì?', o: ['🍎 Quả táo', '🍌 Quả chuối', '🥚 Quả trứng'] },
    { lv: 1, a: 'Good morning!', q: 'Người này nói gì?', o: ['Chào buổi sáng', 'Chúc ngủ ngon', 'Tạm biệt'] },
    { lv: 2, a: 'It\'s twelve dollars.', q: 'Món này giá bao nhiêu?', o: ['12 đô', '20 đô', '2 đô'] },
    { lv: 2, a: 'The bathroom is on the left.', q: 'Nhà vệ sinh ở đâu?', o: ['Bên trái', 'Bên phải', 'Trên lầu'] },
    { lv: 2, a: 'Can I have a glass of water, please?', q: 'Người này muốn gì?', o: ['Một ly nước', 'Một ly cà phê', 'Tính tiền'] },
    { lv: 3, a: 'The next bus to the airport leaves at a quarter past nine.', q: 'Chuyến xe buýt tiếp theo ra sân bay chạy lúc mấy giờ?', o: ['9 giờ 15', '9 giờ 45', '8 giờ 15'] },
    { lv: 3, a: 'Sorry, we\'re out of chicken today, but the fish is really good.', q: 'Nhân viên nói gì?', o: ['Hết gà rồi, gợi ý món cá', 'Hết cá rồi, còn gà', 'Hôm nay quán đóng cửa'] },
    { lv: 3, a: 'Your appointment is on Thursday at two. Please come ten minutes early.', q: 'Bạn cần làm gì?', o: ['Đến lúc 1 giờ 50 thứ Năm', 'Đến lúc 2 giờ thứ Ba', 'Gọi lại sau 10 phút'] },
    { lv: 4, a: 'Attention, passengers. Because of a signal problem, trains to Central Station are delayed by about twenty minutes. We\'re sorry for the inconvenience.', q: 'Thông báo nói gì?', o: ['Tàu đi ga Trung tâm trễ khoảng 20 phút vì sự cố tín hiệu', 'Tàu bị huỷ, hành khách đi xe buýt thay', 'Ga Trung tâm đóng cửa 20 phút'] },
    { lv: 4, a: 'I\'d love to come to your party, but I\'ve got a work deadline on Friday. Could we meet up on Sunday instead?', q: 'Người này muốn gì?', o: ['Không đi tiệc được, hẹn gặp vào Chủ nhật', 'Sẽ đến tiệc vào thứ Sáu', 'Muốn tổ chức tiệc ở chỗ làm'] },
    { lv: 4, a: 'Hi, it\'s Sam from the IT team. Your laptop is ready, but you\'ll need to reset your password before you log in.', q: 'Sam nhắn gì?', o: ['Máy sửa xong, phải đặt lại mật khẩu trước khi đăng nhập', 'Máy hỏng, phải mua máy mới', 'Cứ dùng mật khẩu cũ để đăng nhập'] },
    { lv: 5, a: 'Honestly, the new schedule looks great on paper, but in practice it means most of us will be stuck in rush-hour traffic twice a day.', q: 'Ý chính của người nói là gì?', o: ['Lịch mới nghe hay nhưng thực tế bất tiện vì kẹt xe giờ cao điểm', 'Lịch mới giúp mọi người tránh kẹt xe', 'Người nói rất hài lòng với lịch mới'] },
    { lv: 5, a: 'We\'re not saying the project should be cancelled. We\'re just suggesting we hold off on the launch until the feedback from the test group comes in.', q: 'Họ đề xuất gì?', o: ['Hoãn ra mắt, chờ phản hồi của nhóm dùng thử', 'Huỷ dự án', 'Ra mắt ngay, không cần chờ phản hồi'] },
    { lv: 5, a: 'I wouldn\'t say the hotel was bad, exactly. It\'s just that for the price, you\'d expect a lot more.', q: 'Người này thấy khách sạn thế nào?', o: ['Không tệ, nhưng không xứng với số tiền bỏ ra', 'Rất tệ, không bao giờ quay lại', 'Rẻ mà rất tốt'] }
  ],
  doc: [
    { lv: 1, t: 'EXIT', q: 'Biển này nghĩa là gì?', o: ['Lối ra', 'Lối vào', 'Cấm vào'] },
    { lv: 1, t: 'OPEN', q: 'Biển này treo ở cửa tiệm. Nghĩa là gì?', o: ['Đang mở cửa', 'Đã đóng cửa', 'Đang giảm giá'] },
    { lv: 1, t: 'Coffee  $3', q: 'Cà phê giá bao nhiêu?', o: ['3 đô', '13 đô', '30 đô'] },
    { lv: 2, t: 'CLOSED ON SUNDAYS', q: 'Cửa hàng đóng cửa khi nào?', o: ['Chủ nhật', 'Thứ Bảy', 'Mỗi tối'] },
    { lv: 2, t: 'Mom: I\'m at the supermarket. Do you want anything?', q: 'Mẹ nhắn hỏi gì?', o: ['Con có muốn mua gì không', 'Con đang ở đâu', 'Con ăn cơm chưa'] },
    { lv: 2, t: 'Please do not touch.', q: 'Tấm biển trong bảo tàng nói gì?', o: ['Vui lòng không chạm vào', 'Mời bạn sờ thử', 'Vui lòng xếp hàng'] },
    { lv: 3, t: 'Hi Linh, the meeting is moved from 2 pm to 4 pm. Same room. – Tom', q: 'Điều gì thay đổi?', o: ['Giờ họp', 'Phòng họp', 'Người họp'] },
    { lv: 3, t: 'Take 1 tablet twice a day after meals. Do not take more than 4 in 24 hours.', q: 'Uống thuốc thế nào cho đúng?', o: ['1 viên, ngày 2 lần, sau khi ăn', '2 viên mỗi bữa ăn', '4 viên một lần'] },
    { lv: 3, t: 'Free delivery on orders over $50. Delivery takes 3–5 working days.', q: 'Bạn đặt đơn 40 đô. Điều nào đúng?', o: ['Phải trả phí giao hàng', 'Được giao miễn phí', 'Giao trong 1 ngày'] },
    { lv: 4, t: 'Because of maintenance, the gym will close at 6 pm on Friday. Members can use the pool as usual until 9 pm.', q: 'Thứ Sáu lúc 7 giờ tối bạn làm được gì?', o: ['Đi bơi', 'Tập ở phòng gym', 'Không làm gì được vì đóng cửa hết'] },
    { lv: 4, t: 'Dear customer, we could not deliver your parcel today. You can collect it from the post office after 10 am tomorrow, or rebook delivery online.', q: 'Bạn có thể làm gì?', o: ['Lấy ở bưu điện sau 10 giờ sáng mai, hoặc đặt giao lại trên mạng', 'Chờ người giao hàng quay lại tối nay', 'Gọi bưu điện trước 10 giờ sáng nay'] },
    { lv: 4, t: 'Part-time barista wanted. Weekends only. No experience needed – full training provided.', q: 'Điều nào đúng với tin tuyển dụng này?', o: ['Không cần kinh nghiệm, có đào tạo', 'Phải có kinh nghiệm pha chế', 'Làm cả tuần'] },
    { lv: 5, t: 'While the new policy aims to cut costs, critics argue it may hurt customer satisfaction, which could cancel out any savings.', q: 'Người phản đối cho rằng gì?', o: ['Chính sách có thể làm khách không hài lòng, mất luôn phần tiết kiệm', 'Chính sách giúp khách hài lòng hơn', 'Chính sách không tiết kiệm được đồng nào'] },
    { lv: 5, t: 'Applicants who meet the minimum requirements are not guaranteed an interview; priority will be given to those with relevant experience.', q: 'Ý nào đúng?', o: ['Đủ điều kiện tối thiểu chưa chắc được phỏng vấn', 'Ai đủ điều kiện cũng được phỏng vấn', 'Không cần kinh nghiệm vẫn được ưu tiên'] },
    { lv: 5, t: 'The museum\'s new wing, though impressive, has been criticised for putting style ahead of accessibility.', q: 'Khu mới của bảo tàng bị chê vì sao?', o: ['Đẹp nhưng khó tiếp cận, khó sử dụng với nhiều người', 'Quá nhỏ', 'Thiếu tác phẩm trưng bày'] }
  ],
  gt: [
    { lv: 1, p: 'Hello!', o: ['Hello!', 'Goodbye!', 'Thank you!'] },
    { lv: 1, p: 'What\'s your name?', o: ['My name is Linh.', 'I\'m fine.', 'Yes, I am.'] },
    { lv: 1, p: 'How old are you?', o: ['I\'m twenty.', 'I\'m from Vietnam.', 'I\'m happy.'] },
    { lv: 2, p: 'How are you?', o: ['I\'m fine, thanks.', 'I\'m a student.', 'It\'s Monday.'] },
    { lv: 2, p: 'Where are you from?', o: ['I\'m from Vietnam.', 'I\'m at home.', 'From nine to five.'] },
    { lv: 2, p: 'Can I help you?', o: ['Yes, I\'m looking for a jacket.', 'No, I can\'t.', 'Yes, you are.'] },
    { lv: 3, p: 'Would you like something to drink?', o: ['Yes, a cup of tea, please.', 'Yes, I would like.', 'I drink it yesterday.'] },
    { lv: 3, p: 'What did you do last weekend?', o: ['I went to the beach with my friends.', 'I go to the beach every day.', 'I\'m going to the beach.'] },
    { lv: 3, p: 'Sorry I\'m late!', o: ['No worries, we just started.', 'You\'re welcome.', 'Yes, I\'m late too.'] },
    { lv: 4, p: 'Have you ever been to Japan?', o: ['No, but I\'d love to go one day.', 'No, I didn\'t go yesterday.', 'Yes, I go there every day.'] },
    { lv: 4, p: 'Do you mind if I open the window?', o: ['Not at all. Go ahead.', 'Yes, please open it.', 'No, I mind.'] },
    { lv: 4, p: 'Could you tell me how to get to the station?', o: ['Sure. Go straight and turn left at the lights.', 'Yes, I could.', 'The station is very old.'] },
    { lv: 5, p: 'I\'m thinking of quitting my job to start my own business.', o: ['That\'s a big step. Have you thought it through?', 'Yes, business is very big.', 'Sure, I\'ll quit my job for you.'] },
    { lv: 5, p: 'We need to cut the budget by twenty percent this quarter.', o: ['That\'ll be tough, but let\'s see where we can save.', 'Great, let\'s spend more on ads.', 'The budget is twenty.'] },
    { lv: 5, p: 'I\'m afraid there\'s been a mix-up with your booking.', o: ['Oh no. What exactly happened?', 'I\'m afraid of it too.', 'Thanks for the booking.'] }
  ],
  // phần nói: đọc to (read, cần đạt pass điểm) hoặc tự trả lời (ask: cần nói ít nhất min từ, có một trong các từ any nếu có)
  noi: [
    { lv: 1, read: 'Hello. My name is Linh.', pass: 60 },
    { lv: 2, read: 'I\'d like a coffee, please.', pass: 65 },
    { lv: 3, read: 'I usually take the bus to school at seven thirty.', pass: 70 },
    { lv: 4, ask: 'Why are you learning English?', vi: 'Vì sao bạn học tiếng Anh? Trả lời 1–2 câu.', min: 8, any: ['because', 'to', 'for', 'so', 'want', 'need'] },
    { lv: 5, ask: 'What are the pros and cons of working from home?', vi: 'Làm việc ở nhà có lợi và hại gì? Nói 2–3 câu.', min: 16, any: ['but', 'however', 'although', 'though', 'while', 'on the other hand'] }
  ]
};
